const path = require("path");
const fs = require("fs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const DISCOUNT = 0.20; // Endre rabatt her (0.20 = 20%)

function loadProducts() {
  // Functions bundle includes project files; assets/products.json should be resolvable relative to this file.
  const p = path.join(__dirname, "..", "..", "assets", "products.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function roundNok(amount) {
  // stripe uses integer minor units (øre)
  return Math.round(amount * 100);
}

exports.handler = async (event) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }) };
    }

    const { items, customerEmail, customerNote } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty" }) };
    }

    const products = loadProducts();
    const bySku = new Map(products.map(p => [String(p.sku), p]));

    const line_items = items.map((i) => {
      const sku = String(i.sku);
      const qty = Math.max(1, Number(i.qty || 1));
      const p = bySku.get(sku);
      if (!p || typeof p.bruttopris !== "number") {
        throw new Error(`Unknown product: ${sku}`);
      }

      const unitPrice = Number((p.bruttopris * (1 - DISCOUNT)).toFixed(2));
      return {
        price_data: {
          currency: "nok",
          product_data: {
            name: p.name,
            metadata: { sku }
          },
          unit_amount: roundNok(unitPrice),
        },
        quantity: qty
      };
    });

    const siteUrl = process.env.URL || "https://therwatt.netlify.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${siteUrl}/success.html`,
      cancel_url: `${siteUrl}/cancel.html`,
      customer_email: customerEmail || undefined,
      metadata: customerNote ? { note: customerNote.slice(0, 450) } : undefined
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
