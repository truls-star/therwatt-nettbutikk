
exports.handler = async (event) => {
  try {
    const cfg = { vatRate: 0.25, defaultDiscount: 0 };
    const body = JSON.parse(event.body || '{}');
    const gross = Number(body.gross_price || 0);
    const discount = Number(body.discount || cfg.defaultDiscount || 0);
    if (!Number.isFinite(gross)) throw new Error('Ugyldig bruttopris');
    const price = gross * (1 - discount) * (1 + cfg.vatRate);
    return { statusCode: 200, body: JSON.stringify({ price }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
