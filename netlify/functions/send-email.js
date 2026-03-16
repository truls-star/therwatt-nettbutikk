const RECIPIENT = 'post@therwatt.no';

const validatePayload = (payload) => {
  const required = ['name', 'phone', 'email', 'address', 'selectedRegion', 'calculationResults', 'recommendedSystem'];
  for (const field of required) {
    if (!payload?.[field] || String(payload[field]).trim().length === 0) {
      return `Mangler felt: ${field}`;
    }
  }

  return '';
};

const sendWithResend = async (payload) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Therwatt <no-reply@therwatt.no>',
      to: [RECIPIENT],
      subject: `Ny Therwatt lead fra ${payload.name}`,
      text: [
        `Navn: ${payload.name}`,
        `Telefon: ${payload.phone}`,
        `E-post: ${payload.email}`,
        `Adresse: ${payload.address}`,
        `Region: ${payload.selectedRegion}`,
        `Resultater:\n${payload.calculationResults}`,
        `Anbefalt system: ${payload.recommendedSystem}`
      ].join('\n\n')
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend-feil: ${body}`);
  }
};

const sendWithSendgrid = async (payload) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: RECIPIENT }] }],
      from: { email: process.env.EMAIL_FROM || 'no-reply@therwatt.no', name: 'Therwatt' },
      subject: `Ny Therwatt lead fra ${payload.name}`,
      content: [
        {
          type: 'text/plain',
          value: [
            `Navn: ${payload.name}`,
            `Telefon: ${payload.phone}`,
            `E-post: ${payload.email}`,
            `Adresse: ${payload.address}`,
            `Region: ${payload.selectedRegion}`,
            `Resultater:\n${payload.calculationResults}`,
            `Anbefalt system: ${payload.recommendedSystem}`
          ].join('\n\n')
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid-feil: ${body}`);
  }
};

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Kun POST er tillatt.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.json();
    const validationError = validatePayload(payload);

    if (validationError) {
      return new Response(JSON.stringify({ success: false, message: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (process.env.RESEND_API_KEY) {
      await sendWithResend(payload);
    } else if (process.env.SENDGRID_API_KEY) {
      await sendWithSendgrid(payload);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Ingen e-postprovider konfigurert. Sett RESEND_API_KEY eller SENDGRID_API_KEY.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Ukjent feil' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
