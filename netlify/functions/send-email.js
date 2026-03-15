exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body);
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const mailTo = process.env.MAIL_TO || 'post@therwatt.no';
    const mailFrom = process.env.MAIL_FROM || 'noreply@therwatt.no';

    if (!sendgridKey) {
      console.warn('SENDGRID_API_KEY not set. Email delivery disabled.');
      return { statusCode: 500, body: JSON.stringify({ error: 'Email configuration error (missing SENDGRID_API_KEY)' }) };
    }

    const { formName, contact, data } = payload;
    
    let emailText = `Ny henvendelse fra Therwatt Kalkulator\n\n`;
    emailText += `Type: ${formName || 'Kalkulator'}\n`;
    emailText += `Navn: ${contact?.name || 'Ikke oppgitt'}\n`;
    emailText += `Telefon: ${contact?.phone || 'Ikke oppgitt'}\n`;
    emailText += `E-post: ${contact?.email || 'Ikke oppgitt'}\n`;
    emailText += `Adresse: ${contact?.address || ''} ${contact?.postal_code || ''} ${contact?.city || ''}\n\n`;
    emailText += `Melding: ${contact?.message || 'Ingen melding'}\n\n`;
    
    emailText += `=== Detaljer ===\n`;
    for (const [key, value] of Object.entries(data || {})) {
      emailText += `${key}: ${value}\n`;
    }

    const msg = {
      personalizations: [{ to: [{ email: mailTo }] }],
      from: { email: mailFrom, name: 'Therwatt Kalkulator' },
      subject: `Ny lead: ${contact?.name || 'Kunde'} - ${formName || 'Kalkulator'}`,
      content: [{ type: 'text/plain', value: emailText }]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(msg)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', errorText);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email via SendGrid' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email sent successfully' })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
