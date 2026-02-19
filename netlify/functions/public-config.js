exports.handler = async () => {
  const DISCOUNT = 0.20; // Endre rabatt her (0.20 = 20%)
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      discount: DISCOUNT,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
    })
  };
};
