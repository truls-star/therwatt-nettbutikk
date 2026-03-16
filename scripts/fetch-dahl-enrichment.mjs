import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';

const repoRoot = process.cwd();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const getValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    if (index === -1) return fallback;
    return args[index + 1] ?? fallback;
  };

  return {
    excel: getValue('--excel', ''),
    output: getValue('--output', 'data/raw/dahl_enrichment.json'),
    concurrency: Number(getValue('--concurrency', '4')),
    limit: Number(getValue('--limit', '0')),
    force: args.includes('--force'),
    delayMs: Number(getValue('--delay-ms', '100'))
  };
};

const options = parseArgs();
const CHECKPOINT_INTERVAL = 250;
const MAX_DESCRIPTION_LENGTH = 700;
const MAX_SPEC_FIELDS = 20;
const MAX_SPEC_VALUE_LENGTH = 120;
const MAX_KEYWORDS = 24;

const excelFile = options.excel
  ? path.resolve(repoRoot, options.excel)
  : path.join(
      repoRoot,
      fs
        .readdirSync(repoRoot)
        .find((file) => file.toLowerCase().endsWith('.xlsx') && file.includes('BDExcel')) || ''
    );

if (!excelFile || !fs.existsSync(excelFile)) {
  console.error('Fant ingen Excel-prisfil. Bruk --excel hvis filen ligger et annet sted.');
  process.exit(1);
}

const outputPath = path.resolve(repoRoot, options.output);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtml = (value) =>
  String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const stripTags = (value) => decodeHtml(String(value || '').replace(/<[^>]*>/g, ' '));
const truncate = (value, maxLength) => String(value || '').slice(0, maxLength).trim();

const extractMeta = (html, propertyName) => {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'));
  return match ? decodeHtml(match[1]) : undefined;
};

const extractJsonLdBlocks = (html) => {
  const scripts = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  return scripts
    .map((script) => {
      const match = script.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (!match) return null;
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const extractSection = (html, sectionId) => {
  const marker = `id="${sectionId}"`;
  const start = html.indexOf(marker);
  if (start === -1) return '';
  const nextMarker = html.indexOf('<div id="', start + marker.length);
  return html.slice(start, nextMarker === -1 ? undefined : nextMarker);
};

const extractDescription = (html) => {
  const descriptionSection = extractSection(html, 'description');
  const paragraphMatch = descriptionSection.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (paragraphMatch) {
    return stripTags(paragraphMatch[1]);
  }
  return undefined;
};

const extractTechnicalSpecs = (html) => {
  const specificationSection = extractSection(html, 'specifications');
  const rowRegex = /<tr[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  const specs = {};
  let match;

  while ((match = rowRegex.exec(specificationSection))) {
    const key = stripTags(match[1]).replace(/:$/, '').trim();
    const value = stripTags(match[2]).trim();
    if (key && value) {
      specs[key] = truncate(value, MAX_SPEC_VALUE_LENGTH);
      if (Object.keys(specs).length >= MAX_SPEC_FIELDS) break;
    }
  }

  return Object.keys(specs).length ? specs : undefined;
};

const extractH1 = (html) => {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : undefined;
};

const toProductRecord = (html, searchedProductNumber) => {
  if (!/"trackingPageType"\s*:\s*"productDetail"/.test(html)) return null;

  const actualProductNumber = html.match(/"nrfNumberM3C":"([^"]+)"/)?.[1] || searchedProductNumber;
  if (String(actualProductNumber).trim() !== String(searchedProductNumber).trim()) return null;

  const jsonLdBlocks = extractJsonLdBlocks(html);
  const productJsonLd = jsonLdBlocks.find((entry) => entry && entry['@type'] === 'Product');
  const breadcrumbJsonLd = jsonLdBlocks.find((entry) => entry && entry['@type'] === 'BreadcrumbList');

  const breadcrumb = Array.isArray(breadcrumbJsonLd?.itemListElement)
    ? breadcrumbJsonLd.itemListElement.map((item) => item?.item?.name).filter(Boolean)
    : undefined;

  const imageFromJsonLd = Array.isArray(productJsonLd?.image)
    ? productJsonLd.image.find(Boolean)
    : typeof productJsonLd?.image === 'string'
      ? productJsonLd.image
      : undefined;

  const descriptionFromJsonLd =
    typeof productJsonLd?.description === 'string' && productJsonLd.description !== 'null'
      ? productJsonLd.description
      : undefined;

  const descriptionRaw =
    extractDescription(html) || (descriptionFromJsonLd ? stripTags(descriptionFromJsonLd) : undefined);
  const description = descriptionRaw ? truncate(descriptionRaw, MAX_DESCRIPTION_LENGTH) : undefined;

  const technicalSpecs = extractTechnicalSpecs(html);
  const title = extractH1(html) || stripTags(productJsonLd?.name || '');
  const imageUrl = imageFromJsonLd || extractMeta(html, 'og:image');

  return {
    productNumber: String(actualProductNumber).trim(),
    name: title || undefined,
    imageUrl: imageUrl || undefined,
    description: description || undefined,
    technicalSpecs,
    productUrl: extractMeta(html, 'og:url') || undefined,
    category: breadcrumb?.at(-1),
    breadcrumb,
    keywords: [title, description, ...(breadcrumb || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9\u00C0-\u017F]+/)
      .filter((token) => token.length > 2)
      .slice(0, MAX_KEYWORDS),
    fetchedAt: new Date().toISOString()
  };
};

const fetchProductPage = async (productNumber) => {
  const url = `https://www.dahl.no/sok?q=${encodeURIComponent(productNumber)}`;
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) return null;

  const html = await response.text();
  return toProductRecord(html, productNumber);
};

const workbook = xlsx.readFile(excelFile);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

const productNumbers = [...new Set(rows.map((row) => String(row.Varenr || '').trim()).filter(Boolean))];

const existingRecords = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : [];
const recordMap = new Map(existingRecords.map((record) => [String(record.productNumber).trim(), record]));

const persist = () => {
  const output = [...recordMap.values()].sort((a, b) =>
    String(a.productNumber).localeCompare(String(b.productNumber), 'nb-NO')
  );
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
};

let queue = productNumbers;
if (!options.force) {
  queue = queue.filter((productNumber) => !recordMap.has(productNumber));
}

if (options.limit > 0) {
  queue = queue.slice(0, options.limit);
}
const totalQueue = queue.length;

console.log(
  `Starter Dahl-enrichment. Varenummer totalt: ${productNumbers.length}, i kø: ${totalQueue}, concurrency: ${options.concurrency}`
);

let done = 0;
let matched = 0;
let failed = 0;

const worker = async () => {
  while (queue.length > 0) {
    const productNumber = queue.shift();
    if (!productNumber) return;

    try {
      const record = await fetchProductPage(productNumber);
      if (record) {
        recordMap.set(productNumber, record);
        matched += 1;
      }
    } catch {
      failed += 1;
    }

    done += 1;
    if (done % 50 === 0 || done === totalQueue) {
      console.log(`Fremdrift: ${done} behandlet, ${matched} koblet, ${failed} feil.`);
    }

    if (done % CHECKPOINT_INTERVAL === 0) {
      persist();
      console.log(`Checkpoint lagret etter ${done} oppslag.`);
    }

    if (options.delayMs > 0) {
      await wait(options.delayMs);
    }
  }
};

const workers = Array.from({ length: Math.max(1, options.concurrency) }, () => worker());
await Promise.all(workers);

persist();

console.log(
  `Dahl-enrichment ferdig. Lagret ${recordMap.size} poster i ${path.relative(repoRoot, outputPath)}. Nye treff: ${matched}, feil: ${failed}.`
);
