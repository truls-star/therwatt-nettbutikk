// Netlify Function to return product image URL
// If API access is not available, returns a fallback image.
exports.handler = async (event) => {
  const sku = event.queryStringParameters && event.queryStringParameters.sku;
  let imageUrl;
  if (sku) {
    // Attempt to construct NOBB image URL (may not work without API)
    imageUrl = `https://images.nobb.no/products/${sku}.jpg`;
  }
  // Provide fallback image path relative to site root
  const fallback = '/assets/images/no-image.jpg';
  return {
    statusCode: 200,
    body: JSON.stringify({ image: imageUrl || fallback, fallback }),
  };
};