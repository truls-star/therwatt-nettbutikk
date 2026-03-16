import { Link } from 'react-router-dom';
import type { ProductWithPricing } from '../modules/catalog/catalogService';
import { useCart } from '../modules/cart/cartStore';

type ProductCardProps = {
  product: ProductWithPricing;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addProduct } = useCart();
  const price = product.pricing?.finalPriceIncVat;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <div className="image-fallback">THERWATT</div>}
      </div>
      <div className="product-meta">
        <span className="badge">{product.brand || product.supplier || 'Ukjent merke'}</span>
        <h3>
          <Link to={`/webshop/${product.productNumber}`}>{product.name}</Link>
        </h3>
        <dl>
          <div>
            <dt>Varenr</dt>
            <dd>{product.productNumber}</dd>
          </div>
          <div>
            <dt>NOBB</dt>
            <dd>{product.nobbNumber || '-'}</dd>
          </div>
        </dl>
      </div>
      <div className="product-actions">
        <p className="price">{price ? price.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' }) : 'Pris pa foresporsel'}</p>
        <button className="btn btn-secondary" onClick={() => addProduct(product)} disabled={!price}>
          Legg i kurv
        </button>
      </div>
    </article>
  );
};
