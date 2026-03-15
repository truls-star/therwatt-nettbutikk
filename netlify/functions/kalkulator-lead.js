const { getStore } = require("@netlify/blobs");
const nodemailer = require("nodemailer");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body);

    if (!payload.kontakt || !payload.kontakt.epost) {
      return { statusCode: 400, body: JSON.stringify({ error: "Mangler e-postadresse" }) };
    }

    // Store lead in Netlify Blobs
    const store = getStore("kalkulator-leads");
    const leadId = Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    await store.setJSON(leadId, {
      id: leadId,
      ...payload,
      receivedAt: new Date().toISOString()
    });

    // Send emails if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || "noreply@therwatt.no";

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const emailHtml = buildEmailHTML(payload);
      const internalEmailHtml = buildInternalEmailHTML(payload);

      // Send to customer
      try {
        await transporter.sendMail({
          from: '"Therwatt" <' + emailFrom + '>',
          to: payload.kontakt.epost,
          subject: "Din beregning fra Therwatt",
          html: emailHtml
        });
      } catch (mailErr) {
        console.error("Failed to send customer email:", mailErr.message);
      }

      // Send to Therwatt
      try {
        await transporter.sendMail({
          from: '"Therwatt Kalkulator" <' + emailFrom + '>',
          to: "post@therwatt.no",
          subject: "Ny kalkulatorforespørsel" + (payload.kontakt.navn ? " – " + payload.kontakt.navn : " – " + payload.kontakt.epost),
          html: internalEmailHtml
        });
      } catch (mailErr) {
        console.error("Failed to send internal email:", mailErr.message);
      }
    } else {
      console.log("SMTP not configured – skipping email delivery. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables to enable.");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, leadId: leadId })
    };
  } catch (err) {
    console.error("Lead processing error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Intern feil ved behandling" })
    };
  }
};

// ============================================================
// Email HTML for customer
// ============================================================
function buildEmailHTML(payload) {
  const kontakt = payload.kontakt;
  const energi = payload.energi;
  const gulvvarme = payload.gulvvarme;
  const dato = new Date().toLocaleDateString("nb-NO");

  let h = emailHeader();
  h += '<div style="padding:32px 24px">';
  h += '<h1 style="margin:0 0 8px;font-size:22px;color:#1a2332">Din beregning fra Therwatt</h1>';
  h += '<p style="color:#6b7a8d;font-size:14px;margin:0 0 24px">Beregnet ' + esc(dato) + '</p>';

  h += '<p style="font-size:14px;color:#3a4a5c;line-height:1.6;margin:0 0 24px">Hei' + (kontakt.navn ? ' ' + esc(kontakt.navn) : '') + '! Takk for at du brukte Therwatt sin kalkulator. Her er en oppsummering av beregningen din.</p>';

  // Tjenester
  const tjenester = [];
  if (payload.tjenester.indexOf("energi") !== -1 || payload.tjenester.indexOf("begge") !== -1) tjenester.push("Energiberegning varmepumpe");
  if (payload.tjenester.indexOf("gulvvarme") !== -1 || payload.tjenester.indexOf("begge") !== -1) tjenester.push("Materialberegning gulvvarme");

  h += sectionTitle("Valgt tjeneste");
  tjenester.forEach(function(t) {
    h += '<p style="font-size:14px;color:#3a4a5c;margin:2px 0">&#10003; ' + t + '</p>';
  });

  // Energi
  if (energi) {
    h += sectionTitle("Energiberegning");
    h += kvRow("Byggeår", energi.byggeaar);
    h += kvRow("Boligtype", energi.boligtype);
    h += kvRow("Oppvarmet areal", energi.areal + " m²");
    if (energi.etterisolert) {
      h += kvRow("Etterisolering", energi.etterisoleringCm + " cm");
    }
    h += '<div style="background:#e8f4fb;border-radius:8px;padding:16px;margin:16px 0;text-align:center">';
    h += '<div style="font-size:28px;font-weight:800;color:#1a7ab5">' + formatKw(energi.effektbehovKw) + ' kW</div>';
    h += '<div style="font-size:13px;color:#6b7a8d">Beregnet effektbehov</div>';
    h += '</div>';

    h += '<table style="width:100%;border-collapse:collapse;margin:12px 0">';
    h += '<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e9ef;font-size:14px;font-weight:600">Anbefalt bergvarmepumpe</td>';
    h += '<td style="padding:10px 12px;border-bottom:1px solid #e5e9ef;font-size:14px;font-weight:700;color:#e8581c;text-align:right">' + formatKw(energi.bergvarmeKw) + ' kW</td></tr>';
    h += '<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e9ef;font-size:14px;font-weight:600">Anbefalt luft-vann varmepumpe</td>';
    h += '<td style="padding:10px 12px;border-bottom:1px solid #e5e9ef;font-size:14px;font-weight:700;color:#e8581c;text-align:right">' + formatKw(energi.luftVannKw) + ' kW</td></tr>';
    h += '</table>';

    if (energi.bergSpartKr || energi.luftSpartKr) {
      h += sectionTitle("Estimert energibesparelse per år");
      h += '<table style="width:100%;border-collapse:collapse;margin:12px 0">';
      h += '<tr style="background:#f0faf0"><td style="padding:10px 12px;font-size:14px;font-weight:600">Bergvarme</td>';
      h += '<td style="padding:10px 12px;font-size:14px;text-align:right">' + formatNum(Math.round(energi.bergSpartKwh)) + ' kWh / ca. ' + formatNum(Math.round(energi.bergSpartKr)) + ' kr</td></tr>';
      h += '<tr style="background:#f0faf0"><td style="padding:10px 12px;font-size:14px;font-weight:600">Luft-vann</td>';
      h += '<td style="padding:10px 12px;font-size:14px;text-align:right">' + formatNum(Math.round(energi.luftSpartKwh)) + ' kWh / ca. ' + formatNum(Math.round(energi.luftSpartKr)) + ' kr</td></tr>';
      h += '</table>';
      h += '<p style="font-size:12px;color:#8b95a5;margin:8px 0;line-height:1.5">Estimatet er basert på forenklet beregning. Faktisk besparelse varierer med klima, strømpris, turtemperatur og bruksmønster.</p>';
    }
  }

  // Gulvvarme
  if (gulvvarme) {
    h += sectionTitle("Gulvvarme – Materialoversikt");
    h += '<table style="width:100%;border-collapse:collapse;margin:12px 0">';
    h += '<tr style="background:#f5f7fa"><td style="padding:10px 12px;font-size:13px;font-weight:700;text-transform:uppercase;color:#6b7a8d;border-bottom:2px solid #e5e9ef">Produkt</td>';
    h += '<td style="padding:10px 12px;font-size:13px;font-weight:700;text-transform:uppercase;color:#6b7a8d;border-bottom:2px solid #e5e9ef;text-align:right">Antall</td></tr>';
    h += matEmailRow("Rør totalt", gulvvarme.totalRoer + " m");
    h += matEmailRow("Kurser", gulvvarme.totalKurser);
    h += matEmailRow("Romtermostater", gulvvarme.termostater);
    h += matEmailRow("Aktuatorer", gulvvarme.aktuatorer);
    h += matEmailRow("Bøyefiksturer", gulvvarme.boeyefiksturer);
    h += matEmailRow("Styringsenheter", gulvvarme.styringsenheter);
    if (gulvvarme.materialSummary) {
      for (const matId in gulvvarme.materialSummary) {
        const mat = gulvvarme.materialSummary[matId];
        h += matEmailRow(mat.label, mat.antall + " " + mat.enhet);
      }
    }
    h += '</table>';

    if (gulvvarme.rom && gulvvarme.rom.length > 0) {
      h += '<h4 style="font-size:14px;margin:20px 0 8px;color:#1a2332">Romoversikt</h4>';
      h += '<table style="width:100%;border-collapse:collapse">';
      h += '<tr style="background:#f5f7fa"><td style="padding:8px 10px;font-size:12px;font-weight:700;color:#6b7a8d;border-bottom:2px solid #e5e9ef">Rom</td>';
      h += '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:#6b7a8d;border-bottom:2px solid #e5e9ef;text-align:right">Areal</td>';
      h += '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:#6b7a8d;border-bottom:2px solid #e5e9ef;text-align:right">Kurser</td>';
      h += '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:#6b7a8d;border-bottom:2px solid #e5e9ef;text-align:right">Rør</td></tr>';
      gulvvarme.rom.forEach(function(rom) {
        h += '<tr><td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #e5e9ef">' + esc(rom.romtype) + '</td>';
        h += '<td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #e5e9ef;text-align:right">' + rom.kvm + ' m²</td>';
        h += '<td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #e5e9ef;text-align:right">' + rom.kurser + '</td>';
        h += '<td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #e5e9ef;text-align:right">' + rom.roer + ' m</td></tr>';
      });
      h += '</table>';
    }
  }

  // CTA
  h += '<div style="margin:32px 0 16px;padding:24px;background:#fff7f0;border:1px solid #f5d6c0;border-radius:8px;text-align:center">';
  h += '<p style="font-size:15px;font-weight:600;color:#1a2332;margin:0 0 8px">Har du spørsmål om beregningen?</p>';
  h += '<p style="font-size:14px;color:#6b7a8d;margin:0 0 16px">Kontakt oss for en uforpliktende samtale om varmeanlegget ditt.</p>';
  h += '<p style="margin:0"><strong>Telefon:</strong> <a href="tel:+4790280156" style="color:#1a7ab5">902 80 156</a> &middot; <strong>E-post:</strong> <a href="mailto:post@therwatt.no" style="color:#1a7ab5">post@therwatt.no</a></p>';
  h += '</div>';

  h += '</div>';
  h += emailFooter();

  return h;
}

// ============================================================
// Email HTML for Therwatt internal (post@therwatt.no)
// ============================================================
function buildInternalEmailHTML(payload) {
  const kontakt = payload.kontakt;
  const energi = payload.energi;
  const gulvvarme = payload.gulvvarme;
  const dato = new Date().toLocaleDateString("nb-NO");

  let h = emailHeader();
  h += '<div style="padding:32px 24px">';
  h += '<h1 style="margin:0 0 8px;font-size:22px;color:#1a2332">Ny kalkulatorforespørsel</h1>';
  h += '<p style="color:#6b7a8d;font-size:14px;margin:0 0 24px">Mottatt ' + esc(dato) + '</p>';

  // Kontaktinfo
  h += sectionTitle("Kontaktinformasjon");
  h += kvRow("E-post", kontakt.epost);
  if (kontakt.kunEpost) {
    h += '<p style="font-size:13px;color:#e8581c;margin:4px 0 8px">Kunden ønsker kun å dele e-postadresse.</p>';
  }
  if (kontakt.navn) h += kvRow("Navn", kontakt.navn);
  if (kontakt.telefon) h += kvRow("Telefon", kontakt.telefon);
  if (kontakt.adresse) h += kvRow("Adresse", kontakt.adresse);

  // Tjenester
  const tjenester = [];
  if (payload.tjenester.indexOf("energi") !== -1 || payload.tjenester.indexOf("begge") !== -1) tjenester.push("Energiberegning varmepumpe");
  if (payload.tjenester.indexOf("gulvvarme") !== -1 || payload.tjenester.indexOf("begge") !== -1) tjenester.push("Materialberegning gulvvarme");
  h += sectionTitle("Valgt tjeneste");
  tjenester.forEach(function(t) {
    h += '<p style="font-size:14px;color:#3a4a5c;margin:2px 0">&#10003; ' + t + '</p>';
  });

  // Energi
  if (energi) {
    h += sectionTitle("Energiberegning");
    h += kvRow("Byggeår", energi.byggeaar);
    h += kvRow("Boligtype", energi.boligtype);
    h += kvRow("Oppvarmet areal", energi.areal + " m²");
    if (energi.etterisolert) h += kvRow("Etterisolering", energi.etterisoleringCm + " cm");
    h += kvRow("Effektbehov", formatKw(energi.effektbehovKw) + " kW");
    h += kvRow("Anbefalt bergvarme", formatKw(energi.bergvarmeKw) + " kW");
    h += kvRow("Anbefalt luft-vann", formatKw(energi.luftVannKw) + " kW");
    if (energi.bergSpartKr) {
      h += kvRow("Estimert besparelse bergvarme", formatNum(Math.round(energi.bergSpartKwh)) + " kWh / " + formatNum(Math.round(energi.bergSpartKr)) + " kr per år");
      h += kvRow("Estimert besparelse luft-vann", formatNum(Math.round(energi.luftSpartKwh)) + " kWh / " + formatNum(Math.round(energi.luftSpartKr)) + " kr per år");
    }
  }

  // Gulvvarme
  if (gulvvarme) {
    h += sectionTitle("Gulvvarme – Materialoversikt");
    h += kvRow("Totalt areal", gulvvarme.totalKvm + " m²");
    h += kvRow("Rør", gulvvarme.totalRoer + " m");
    h += kvRow("Kurser", gulvvarme.totalKurser);
    h += kvRow("Termostater", gulvvarme.termostater);
    h += kvRow("Aktuatorer", gulvvarme.aktuatorer);
    h += kvRow("Bøyefiksturer", gulvvarme.boeyefiksturer);
    h += kvRow("Styringsenheter", gulvvarme.styringsenheter);
    if (gulvvarme.materialSummary) {
      for (const matId in gulvvarme.materialSummary) {
        const mat = gulvvarme.materialSummary[matId];
        h += kvRow(mat.label, mat.antall + " " + mat.enhet);
      }
    }
    if (gulvvarme.rom && gulvvarme.rom.length > 0) {
      h += '<h4 style="font-size:14px;margin:20px 0 8px;color:#1a2332">Romoversikt</h4>';
      gulvvarme.rom.forEach(function(rom) {
        h += '<p style="font-size:13px;margin:2px 0;color:#3a4a5c">' + esc(rom.romtype) + ': ' + rom.kvm + ' m² – ' + rom.kurser + ' kurs(er) – ' + rom.roer + ' m rør' + (rom.konstruksjonLabel ? ' (' + esc(rom.konstruksjonLabel) + (rom.undertypeLabel ? ' / ' + esc(rom.undertypeLabel) : '') + ')' : '') + '</p>';
      });
    }
  }

  h += '</div>';
  h += emailFooter();
  return h;
}

// ============================================================
// Email template helpers
// ============================================================
function emailHeader() {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">' +
    '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;border:1px solid #e5e9ef">' +
    '<div style="background:#1a2332;padding:20px 24px;text-align:center">' +
    '<h2 style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:0.02em">Therwatt</h2>' +
    '<p style="margin:4px 0 0;color:#8b95a5;font-size:12px">Faghandel for vannbåren varme og varmepumper</p>' +
    '</div>';
}

function emailFooter() {
  return '<div style="padding:16px 24px;background:#f5f7fa;border-top:1px solid #e5e9ef;text-align:center">' +
    '<p style="font-size:12px;color:#8b95a5;margin:0">Therwatt AS &middot; Tlf: 902 80 156 &middot; post@therwatt.no</p>' +
    '<p style="font-size:11px;color:#b0b8c4;margin:4px 0 0">Denne e-posten ble generert automatisk fra kalkulatoren på therwatt.no</p>' +
    '</div></div></body></html>';
}

function sectionTitle(text) {
  return '<h3 style="font-size:16px;font-weight:700;color:#1a2332;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e5e9ef">' + text + '</h3>';
}

function kvRow(label, value) {
  return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f2f5">' +
    '<span style="font-size:14px;color:#6b7a8d">' + esc(label) + '</span>' +
    '<span style="font-size:14px;color:#1a2332;font-weight:600">' + esc(String(value)) + '</span></div>';
}

function matEmailRow(product, amount) {
  return '<tr><td style="padding:10px 12px;font-size:14px;border-bottom:1px solid #e5e9ef">' + esc(product) + '</td>' +
    '<td style="padding:10px 12px;font-size:14px;font-weight:700;color:#1a7ab5;text-align:right;border-bottom:1px solid #e5e9ef">' + esc(String(amount)) + '</td></tr>';
}

function formatKw(val) {
  return Number(val).toFixed(2).replace(".", ",");
}

function formatNum(val) {
  return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function esc(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
