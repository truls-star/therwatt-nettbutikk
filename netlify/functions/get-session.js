
exports.handler = async (event) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { statusCode: 200, body: JSON.stringify({ error: 'Stripe er ikke konfigurert.' }) };
    }
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey);

    const sessionId = (event.queryStringParameters || {}).session_id;
    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'session_id mangler.' }) };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email || session.customer_email || '',
        customer_name: session.customer_details?.name || '',
        amount_total: session.amount_total,
        currency: session.currency,
        line_items: (session.line_items?.data || []).map(item => ({
          name: item.description,
          quantity: item.quantity,
          amount: item.amount_total
        }))
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
