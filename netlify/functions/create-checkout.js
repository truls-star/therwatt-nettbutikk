
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

    const customer = body.customer || {};
    const baseUrl = process.env.URL || '';

    const sessionParams = {
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
      success_url: baseUrl + '/ordre-sendt.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/kasse.html',
      metadata: {
        customer_name: customer.name || '',
        customer_phone: customer.phone || '',
        customer_company: customer.company || '',
        shipping_address: customer.address || '',
        shipping_zip: customer.zip || '',
        shipping_city: customer.city || '',
        note: customer.note || ''
      }
    };

    // Set customer email for receipt
    if (customer.email) {
      sessionParams.customer_email = customer.email;
      sessionParams.payment_intent_data = { receipt_email: customer.email };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
