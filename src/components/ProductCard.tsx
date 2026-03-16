import { useCallback, useState } from 'react';
import type { Product } from '../lib/loadProducts';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/formatters';
import { Toast } from './Toast';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addProduct } = useCart();
  const [toastVisible, setToastVisible] = useState(false);

  const handleAdd = useCallback(() => {
    addProduct(product);
    setToastVisible(true);
  }, [addProduct, product]);

  const handleToastDone = useCallback(() => setToastVisible(false), []);

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {product.image && !product.image.startsWith('data:') ? (
          <img src={product.image} alt={product.title} loading="lazy" />
        ) : (
          <div className="image-fallback">THERWATT</div>
        )}
      </div>
      <div className="product-meta">
        <span className="badge">{product.category}</span>
        <h3>{product.title}</h3>
        <dl>
          <div>
            <dt>Varenr&nbsp;</dt>
            <dd>{product.product_number}</dd>
          </div>
        </dl>
      </div>
      <div className="product-actions">
        <p className="price">{formatPrice(product.price_inc_vat)}</p>
        <button className="btn btn-secondary" onClick={handleAdd}>
          Legg i handlekurv
        </button>
      </div>
      <Toast message={`${product.title} lagt i handlekurven`} visible={toastVisible} onDone={handleToastDone} />
    </article>
  );
}
