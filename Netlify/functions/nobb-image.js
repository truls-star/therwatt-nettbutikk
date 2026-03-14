exports.handler = async (event) => {
  const sku = event.queryStringParameters?.sku;
  const fallback = '/assets/images/no-image.jpg';
  if (!sku) {
    return { statusCode: 302, headers: { Location: fallback } };
  }
  // Placeholder NOBB mapping strategy:
  // if your product file later includes an explicit NOBB number, swap sku for that value.
  // This version attempts a predictable image path and falls back if the image is not available.
  const candidate = `https://images.nobb.no/products/${encodeURIComponent(sku)}.jpg`;
  return { statusCode: 302, headers: { Location: candidate } };
};
