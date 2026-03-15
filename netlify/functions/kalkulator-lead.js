const { getStore } = require("@netlify/blobs");
const { handler: sendEmailHandler } = require("./send-email");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    if (!payload.kontakt || !payload.kontakt.epost) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Mangler e-postadresse" }),
      };
    }

    const store = getStore("kalkulator-leads");
    const leadId = Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    await store.setJSON(leadId, {
      id: leadId,
      ...payload,
      receivedAt: new Date().toISOString(),
    });

    const mailEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        ...payload,
        type: "calculator",
        sourceForm: "kalkulator-lead",
      }),
      isBase64Encoded: false,
    };

    const mailResponse = await sendEmailHandler(mailEvent);
    if (mailResponse.statusCode >= 400) {
      return mailResponse;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, leadId }),
    };
  } catch (err) {
    console.error("Lead processing error:", err && err.message ? err.message : err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Intern feil ved behandling" }),
    };
  }
};
