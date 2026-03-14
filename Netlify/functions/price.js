exports.handler = async (event) => {
  const DISCOUNTS = {
    'VVS': 0.10,
    'Verktøy': 0.10,
    'Vann- og miljøteknikk': 0.10,
    'Industri': 0.10,
    standard: 0.10,
  };
  try {
    const body = JSON.parse(event.body || '{}');
    const gross = parseFloat(body.bruttopris);
    const area = body.business_area || 'standard';
    if (!Number.isFinite(gross)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Ugyldig bruttopris' }) };
    }
    const discount = DISCOUNTS[area] ?? DISCOUNTS.standard;
    const price = gross * (1 - discount) * 1.25;
    return { statusCode: 200, body: JSON.stringify({ price, discount, vatIncluded: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
