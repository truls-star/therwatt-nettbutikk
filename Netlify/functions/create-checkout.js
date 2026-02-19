const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout session for cart items
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const items = data.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Ingen varer i handlekurven' }) };
    }
    // Build line_items for Stripe
    const line_items = items.map(item => ({
      price_data: {
        currency: 'nok',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.URL || ''}/ordre-sendt.html`,
      cancel_url: `${process.env.URL || ''}/butikk.html`,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Kunne ikke opprette betaling' }),
    };
  }
};