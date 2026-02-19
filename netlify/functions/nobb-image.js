const FALLBACK = "/assets/images/no-image.svg";

/**
 * Midlertidig uten NOBB API:
 * Vi prøver et standard mønster på images.nobb.no og lar browseren feile over til fallback.
 * Når du får NOBB API, kan denne funksjonen endres til å slå opp korrekt bilde-url.
 */
exports.handler = async (event) => {
  const sku = event.queryStringParameters?.sku;
  if (!sku) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing sku" }) };
  }

  const image = `https://images.nobb.no/products/${encodeURIComponent(sku)}.jpg`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
    body: JSON.stringify({ image, fallback: FALLBACK })
  };
};
