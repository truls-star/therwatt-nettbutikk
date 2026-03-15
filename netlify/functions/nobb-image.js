
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      image: '/assets/images/no-image.jpg',
      note: 'NOBB-bilder er ikke koblet til i denne versjonen. Fallback-bilde brukes inntil API er klart.'
    })
  };
};
