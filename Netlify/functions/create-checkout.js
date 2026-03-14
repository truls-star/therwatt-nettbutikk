const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Ingen varer i handlekurven' }) };
    }
    const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        quantity: item.qty,
        price_data: {
          currency: 'nok',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            metadata: { sku: item.sku || '' },
          },
        },
      })),
      success_url: `${baseUrl}/ordre-sendt.html`,
      cancel_url: `${baseUrl}/butikk.html`,
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Checkout feilet' }) };
  }
};
