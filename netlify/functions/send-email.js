const SUCCESS_MESSAGE =
  "Takk for forespørselen. Vi har mottatt informasjonen din og tar kontakt så snart som mulig.";
const GENERIC_ERROR_MESSAGE =
  "Det oppstod en feil ved sending. Prøv igjen, eller kontakt oss på post@therwatt.no.";

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  try {
    const payload = parseBody(event);

    if (getString(payload.botField)) {
      return jsonResponse(200, { success: true, message: SUCCESS_MESSAGE, spam: true });
    }

    const sourceForm = getString(payload.sourceForm) || "ukjent";
    const type = getString(payload.type) === "calculator" ? "calculator" : "contact";
    const normalized = type === "calculator" ? normalizeCalculator(payload) : normalizeContact(payload);

    const validationError = validatePayload(type, normalized);
    if (validationError) {
      return jsonResponse(400, { error: validationError });
    }

    const env = getEnvReader();
    const sendGridApiKey = env("SENDGRID_API_KEY");
    if (!sendGridApiKey) {
      console.error("Missing SENDGRID_API_KEY runtime environment variable");
      return jsonResponse(500, { error: GENERIC_ERROR_MESSAGE });
    }

    const mailTo = env("MAIL_TO") || "post@therwatt.no";
    const mailFrom = env("MAIL_FROM") || "post@therwatt.no";

    const message = buildMessage({ type, sourceForm, data: normalized });
    const sendResult = await sendWithSendGrid({
      apiKey: sendGridApiKey,
      from: mailFrom,
      to: mailTo,
      replyTo: normalized.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    if (!sendResult.ok) {
      console.error("SendGrid delivery failed", { status: sendResult.status, sourceForm, type });
      return jsonResponse(502, { error: GENERIC_ERROR_MESSAGE });
    }

    return jsonResponse(200, { success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("send-email failed", error && error.message ? error.message : error);
    return jsonResponse(500, { error: GENERIC_ERROR_MESSAGE });
  }
};

function parseBody(event) {
  if (!event.body) return {};
  if (typeof event.body === "object") return event.body;

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    const params = new URLSearchParams(rawBody);
    const obj = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

function normalizeContact(payload) {
  return {
    name: getString(payload.name),
    email: getString(payload.email),
    phone: getString(payload.phone),
    address: getString(payload.address),
    company: getString(payload.company),
    inquiryType: getString(payload.inquiry_type || payload.inquiryType),
    product: getString(payload.product),
    message: getString(payload.message),
    notes: getString(payload.notes),
  };
}

function normalizeCalculator(payload) {
  const kontakt = payload.kontakt || {};
  const energi = payload.energi || {};
  const gulvvarme = payload.gulvvarme || {};

  const materialLines = [];
  const summary = gulvvarme.materialSummary || {};
  Object.keys(summary).forEach((key) => {
    const item = summary[key];
    if (!item) return;
    materialLines.push(
      `${getString(item.label) || key}: ${getString(item.antall)} ${getString(item.enhet)}`.trim(),
    );
  });

  const heatPumpRecommendation = [
    energi.bergvarmeKw ? `Bergvarme ${formatDecimal(energi.bergvarmeKw)} kW` : "",
    energi.luftVannKw ? `Luft-vann ${formatDecimal(energi.luftVannKw)} kW` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    name: getString(kontakt.navn),
    email: getString(kontakt.epost),
    phone: getString(kontakt.telefon),
    address: getString(kontakt.adresse),
    calculationType: Array.isArray(payload.tjenester) ? payload.tjenester.join(", ") : getString(payload.tjenester),
    heatingDemandKw: energi.effektbehovKw != null ? formatDecimal(energi.effektbehovKw) : "",
    heatPumpRecommendation,
    floorHeatingSummary: materialLines.join("\n"),
    pipeLength: gulvvarme.totalRoer != null ? String(gulvvarme.totalRoer) : "",
    circuits: gulvvarme.totalKurser != null ? String(gulvvarme.totalKurser) : "",
    rooms: gulvvarme.antallRom != null ? String(gulvvarme.antallRom) : "",
    notes: getString(payload.notes),
    rawData: {
      kontakt,
      energi,
      gulvvarme,
      tjenester: payload.tjenester,
      timestamp: payload.timestamp,
    },
  };
}

function validatePayload(type, data) {
  if (!data.email || !isValidEmail(data.email)) {
    return "Ugyldig e-postadresse";
  }

  if (type === "contact") {
    if (!data.name) return "Navn er påkrevd";
    if (!data.message) return "Melding er påkrevd";
  }

  if (type === "calculator") {
    if (!data.calculationType) return "Beregningstype mangler";
  }

  return "";
}

function buildMessage({ type, sourceForm, data }) {
  if (type === "calculator") {
    const subject = `Ny kalkulatorforespørsel (${sourceForm})`;
    const rows = [
      ["Navn", data.name],
      ["E-post", data.email],
      ["Telefon", data.phone],
      ["Adresse", data.address],
      ["Kilde skjema", sourceForm],
      ["Valgt beregningstype", data.calculationType],
      ["Varmebehov (kW)", data.heatingDemandKw],
      ["Anbefalt varmepumpe", data.heatPumpRecommendation],
      ["Rørlengde", data.pipeLength],
      ["Antall kurser", data.circuits],
      ["Antall rom", data.rooms],
      ["Notater", data.notes],
    ];

    const text = [
      "Ny kalkulatorforespørsel", "",
      ...rows.map(([label, value]) => `${label}: ${value || "-"}`),
      "",
      "Gulvvarme materialoversikt:",
      data.floorHeatingSummary || "-",
      "",
      "Komplett datastruktur:",
      JSON.stringify(data.rawData, null, 2),
    ].join("\n");

    const html = [
      "<h2>Ny kalkulatorforespørsel</h2>",
      renderTable(rows),
      `<h3>Gulvvarme materialoversikt</h3><pre>${escapeHtml(data.floorHeatingSummary || "-")}</pre>`,
      `<h3>Komplett datastruktur</h3><pre>${escapeHtml(JSON.stringify(data.rawData, null, 2))}</pre>`,
    ].join("\n");

    return { subject, text, html };
  }

  const subject = `Ny henvendelse (${sourceForm})`;
  const rows = [
    ["Navn", data.name],
    ["E-post", data.email],
    ["Telefon", data.phone],
    ["Adresse", data.address],
    ["Firma", data.company],
    ["Henvendelsestype", data.inquiryType],
    ["Produkt", data.product],
    ["Notater", data.notes],
    ["Kilde skjema", sourceForm],
  ];

  const text = [
    "Ny kontaktforespørsel", "",
    ...rows.map(([label, value]) => `${label}: ${value || "-"}`),
    "",
    "Melding:",
    data.message || "-",
  ].join("\n");

  const html = [
    "<h2>Ny kontaktforespørsel</h2>",
    renderTable(rows),
    `<h3>Melding</h3><p>${escapeHtml(data.message || "-")}</p>`,
  ].join("\n");

  return { subject, text, html };
}

async function sendWithSendGrid({ apiKey, from, to, replyTo, subject, text, html }) {
  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html },
    ],
  };

  if (isValidEmail(replyTo)) {
    payload.reply_to = { email: replyTo };
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { ok: response.ok, status: response.status };
}

function getEnvReader() {
  if (typeof Netlify !== "undefined" && Netlify.env && typeof Netlify.env.get === "function") {
    return (name) => Netlify.env.get(name);
  }

  return (name) => process.env[name];
}

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function renderTable(rows) {
  const htmlRows = rows
    .map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value || "-")}</td></tr>`)
    .join("");
  return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">${htmlRows}</table>`;
}

function formatDecimal(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return num.toFixed(2).replace(".", ",");
}

function escapeHtml(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}
