import type { Product } from '../lib/loadProducts';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: Product[];
  maxItems?: number;
};

export function ProductGrid({ products, maxItems = 240 }: ProductGridProps) {
  const visible = maxItems > 0 ? products.slice(0, maxItems) : products;

  if (visible.length === 0) {
    return <p>Ingen produkter funnet.</p>;
  }

  return (
    <>
      <div className="product-grid">
        {visible.map((product) => (
          <ProductCard key={product.product_number} product={product} />
        ))}
      </div>
      {products.length > maxItems && (
        <p className="muted-note">
          Viser {maxItems} av {products.length} produkter. Bruk filtre for å snevre inn.
        </p>
      )}
    </>
  );
}
