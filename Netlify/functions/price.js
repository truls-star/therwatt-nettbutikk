// Netlify Function to calculate discounted price
exports.handler = async (event) => {
  const DISCOUNT = 0.20; // 20% rabatt
  try {
    const data = JSON.parse(event.body || '{}');
    const bruttopris = parseFloat(data.bruttopris);
    if (isNaN(bruttopris)) {
      throw new Error('Ugyldig bruttopris');
    }
    const price = bruttopris * (1 - DISCOUNT);
    return {
      statusCode: 200,
      body: JSON.stringify({ price: Number(price.toFixed(2)) }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};