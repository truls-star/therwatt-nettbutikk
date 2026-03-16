import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/loadProducts';
import { hasPrice } from '../lib/loadProducts';
import { useCart } from '../lib/cart';
import { useQuoteList } from '../lib/quoteList';
import { formatPrice } from '../lib/formatters';
import { Toast } from './Toast';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addProduct } = useCart();
  const { addProduct: addToQuote, isInList } = useQuoteList();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const productHasPrice = hasPrice(product);

  const handleAddToCart = useCallback(() => {
    addProduct(product);
    setToastMessage(`${product.title} lagt i handlekurven`);
    setToastVisible(true);
  }, [addProduct, product]);

  const handleAddToQuote = useCallback(() => {
    addToQuote(product);
    setToastMessage(`${product.title} lagt i forespørselslisten`);
    setToastVisible(true);
  }, [addToQuote, product]);

  const handleToastDone = useCallback(() => setToastVisible(false), []);

  return (
    <article className="product-card">
      <Link to={`/webshop/${product.product_number}`} className="product-card-link">
        <div className="product-image-wrap">
          {product.image && !product.image.startsWith('data:') ? (
            <img src={product.image} alt={product.title} loading="lazy" />
          ) : (
            <div className="image-fallback">THERWATT</div>
          )}
        </div>
        <div className="product-meta">
          <span className="badge">{product.category}</span>
          {product.supplier && <span className="badge badge-supplier">{product.supplier}</span>}
          <h3>{product.title}</h3>
          <dl>
            <div>
              <dt>Varenr&nbsp;</dt>
              <dd>{product.product_number}</dd>
            </div>
          </dl>
        </div>
      </Link>
      <div className="product-actions">
        {productHasPrice ? (
          <>
            <p className="price">{formatPrice(product.price_inc_vat)}</p>
            <button className="btn btn-secondary" onClick={handleAddToCart}>
              Legg i handlekurv
            </button>
          </>
        ) : (
          <>
            <p className="price price-missing">Pris på forespørsel</p>
            <button
              className="btn btn-quote"
              onClick={handleAddToQuote}
              disabled={isInList(product.product_number)}
            >
              {isInList(product.product_number) ? 'Lagt til' : 'Be om tilbud'}
            </button>
          </>
        )}
      </div>
      <Toast message={toastMessage} visible={toastVisible} onDone={handleToastDone} />
    </article>
  );
}
