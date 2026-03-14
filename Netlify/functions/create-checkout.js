
exports.handler = async (event) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { statusCode: 200, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY mangler. Legg den inn i Netlify før betaling aktiveres.' }) };
    }
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey);
    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return { statusCode: 400, body: JSON.stringify({ error: 'Handlekurven er tom.' }) };
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        quantity: item.qty,
        price_data: {
          currency: 'nok',
          product_data: { name: item.name },
          unit_amount: Math.round(Number(item.price || 0) * 100)
        }
      })),
      success_url: `${process.env.URL || ''}/ordre-sendt.html`,
      cancel_url: `${process.env.URL || ''}/butikk.html`
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
