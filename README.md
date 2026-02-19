# Therwatt AS nettbutikk

Statisk nettside (Netlify + GitHub) med:
- Bedriftssider + butikk
- Produkter fra Dahl-prisfil (assets/products.json)
- Fast rabatt fra bruttopris (server-side i Netlify Functions)
- Stripe Checkout

## Konfigurasjon (Netlify)
Legg inn env vars:
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY

Rabatt endres i:
- netlify/functions/public-config.js
- netlify/functions/create-checkout.js
