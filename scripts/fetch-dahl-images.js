#!/usr/bin/env node
/**
 * fetch-dahl-images.js
 *
 * Fetches product images from Dahl.no by looking up each product's SKU.
 *
 * Strategy:
 *   1. For each product, search Dahl.no with /sok?q=<SKU>
 *   2. If the search redirects (302), follow to the product page
 *   3. Extract image URLs from the JSON-LD schema.org data on the page
 *   4. Update the product with image_url (first image) and images (all images)
 *
 * Usage: node scripts/fetch-dahl-images.js [--concurrency=N] [--file=filename]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(__dirname, '..', 'Data');
const PRODUCT_FILES = [
  'products-vvs.json',
  'products-industri.json',
  'products-vann-og-milj-teknikk.json',
  'products-verkt-y.json',
];

// Parse CLI args
const args = process.argv.slice(2);
let CONCURRENCY = 15;
let ONLY_FILE = null;

for (const arg of args) {
  if (arg.startsWith('--concurrency=')) {
    CONCURRENCY = parseInt(arg.split('=')[1], 10) || 15;
  }
  if (arg.startsWith('--file=')) {
    ONLY_FILE = arg.split('=')[1];
  }
}

const SAVE_INTERVAL = 200; // Save progress every N products
const REQUEST_TIMEOUT = 15000; // 15 seconds

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY + 5,
  timeout: REQUEST_TIMEOUT,
});

function fetchUrl(url, followRedirects = true, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { agent, timeout: REQUEST_TIMEOUT }, (res) => {
      if (followRedirects && (res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        if (maxRedirects <= 0) {
          resolve({ statusCode: res.statusCode, body: '', redirectUrl: res.headers.location });
          res.resume();
          return;
        }
        res.resume();
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = parsed.protocol + '//' + parsed.host + redirectUrl;
        }
        fetchUrl(redirectUrl, true, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
          redirectUrl: res.headers.location || null,
        });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// ---------------------------------------------------------------------------
// Image extraction from Dahl.no HTML
// ---------------------------------------------------------------------------

function extractImagesFromHtml(html) {
  const images = [];

  // Method 1: Extract from JSON-LD schema.org Product data
  const jsonLdMatch = html.match(/"image"\s*:\s*\[(.*?)\]/);
  if (jsonLdMatch) {
    const urlMatches = jsonLdMatch[1].match(/https:\/\/media\.bluestonepim\.com\/[^"]+/g);
    if (urlMatches) {
      for (const url of urlMatches) {
        if (!images.includes(url)) {
          images.push(url);
        }
      }
    }
  }

  // Method 2: Extract from img tags with bluestonepim URLs (fallback)
  if (images.length === 0) {
    const imgMatches = html.match(/https:\/\/media\.bluestonepim\.com\/[^"?]+/g);
    if (imgMatches) {
      for (const url of imgMatches) {
        // Skip duplicates and very small thumbnails
        if (!images.includes(url)) {
          images.push(url);
        }
      }
    }
  }

  // Deduplicate
  return [...new Set(images)];
}

// Extract the Dahl.no product URL from the page
function extractDahlUrl(html) {
  const match = html.match(/"url"\s*:\s*"(https:\/\/www\.dahl\.no\/[^"]+)"/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Fetch images for a single product
// ---------------------------------------------------------------------------

async function fetchProductImages(sku) {
  try {
    const searchUrl = 'https://www.dahl.no/sok?q=' + encodeURIComponent(sku);
    const result = await fetchUrl(searchUrl, true);

    if (result.statusCode !== 200) {
      return { sku, images: [], dahlUrl: null, error: 'HTTP ' + result.statusCode };
    }

    const images = extractImagesFromHtml(result.body);
    const dahlUrl = extractDahlUrl(result.body);

    return { sku, images, dahlUrl, error: null };
  } catch (err) {
    return { sku, images: [], dahlUrl: null, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

async function processWithConcurrency(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(concurrency, items.length); w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

async function processFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  console.log('\n=== Processing ' + filename + ' ===');

  const raw = fs.readFileSync(filepath, 'utf8');
  const products = JSON.parse(raw);

  // Skip products that already have images
  const toProcess = [];
  const alreadyHaveImages = [];
  for (let i = 0; i < products.length; i++) {
    if (products[i].images && products[i].images.length > 0) {
      alreadyHaveImages.push(i);
    } else {
      toProcess.push({ index: i, sku: products[i].sku });
    }
  }

  console.log('  Total products: ' + products.length);
  console.log('  Already have images: ' + alreadyHaveImages.length);
  console.log('  To process: ' + toProcess.length);
  console.log('  Concurrency: ' + CONCURRENCY);

  let processed = 0;
  let withImages = 0;
  let noImages = 0;
  let errors = 0;

  const startTime = Date.now();

  await processWithConcurrency(toProcess, CONCURRENCY, async (item, idx) => {
    const result = await fetchProductImages(item.sku);

    if (result.error) {
      errors++;
    } else if (result.images.length > 0) {
      products[item.index].image_url = result.images[0];
      products[item.index].images = result.images;
      if (result.dahlUrl) {
        products[item.index].dahl_url = result.dahlUrl;
      }
      withImages++;
    } else {
      noImages++;
    }

    processed++;

    // Progress log
    if (processed % 50 === 0 || processed === toProcess.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (processed / ((Date.now() - startTime) / 1000)).toFixed(1);
      console.log(
        '  Progress: ' + processed + '/' + toProcess.length +
        ' (' + (processed / toProcess.length * 100).toFixed(1) + '%)' +
        ' | Images: ' + withImages + ' | No image: ' + noImages +
        ' | Errors: ' + errors +
        ' | ' + elapsed + 's (' + rate + ' req/s)'
      );
    }

    // Save periodically
    if (processed % SAVE_INTERVAL === 0) {
      fs.writeFileSync(filepath, JSON.stringify(products, null, 2), 'utf8');
      console.log('  [Saved progress]');
    }
  });

  // Final save
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2), 'utf8');

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n  Results for ' + filename + ':');
  console.log('    Products with images: ' + (withImages + alreadyHaveImages.length) + '/' + products.length);
  console.log('    New images found: ' + withImages);
  console.log('    No images on Dahl: ' + noImages);
  console.log('    Errors: ' + errors);
  console.log('    Time: ' + totalTime + 's');

  return { total: products.length, withImages: withImages + alreadyHaveImages.length, newImages: withImages, noImages, errors };
}

async function main() {
  console.log('=== Dahl.no Image Fetcher ===');
  console.log('Concurrency: ' + CONCURRENCY);
  console.log('');

  const filesToProcess = ONLY_FILE ? [ONLY_FILE] : PRODUCT_FILES;
  const allStats = { total: 0, withImages: 0, newImages: 0, noImages: 0, errors: 0 };

  for (const filename of filesToProcess) {
    const stats = await processFile(filename);
    allStats.total += stats.total;
    allStats.withImages += stats.withImages;
    allStats.newImages += stats.newImages;
    allStats.noImages += stats.noImages;
    allStats.errors += stats.errors;
  }

  console.log('\n=== Overall Summary ===');
  console.log('Total products: ' + allStats.total);
  console.log('Products with images: ' + allStats.withImages + ' (' + (allStats.withImages / allStats.total * 100).toFixed(1) + '%)');
  console.log('New images found: ' + allStats.newImages);
  console.log('Products without images: ' + allStats.noImages);
  console.log('Errors: ' + allStats.errors);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
