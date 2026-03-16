import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { loadAllProducts, hasPrice, type Product } from '../lib/loadProducts';
import { useCart } from '../lib/cart';
import { useQuoteList } from '../lib/quoteList';
import { formatPrice } from '../lib/formatters';
import { ProductCard } from '../components/ProductCard';
import { Toast } from '../components/Toast';

export function ProductDetailPage() {
  const params = useParams<{ productNumber: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { addProduct } = useCart();
  const { addProduct: addToQuote, isInList } = useQuoteList();

  useEffect(() => {
    if (!params.productNumber) {
      setLoading(false);
      return;
    }

    let mounted = true;
    loadAllProducts()
      .then((data) => {
        if (!mounted) return;
        const found = data.products.find((p) => p.product_number === params.productNumber);
        setProduct(found);
        if (found) {
          const rel = data.products
            .filter((p) => p.product_number !== found.product_number && p.category === found.category)
            .slice(0, 6);
          setRelated(rel);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Kunne ikke hente produkt.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [params.productNumber]);

  const handleAddToCart = useCallback(() => {
    if (product) {
      addProduct(product);
      setToastMessage(`${product.title} lagt i handlekurven`);
      setToastVisible(true);
    }
  }, [addProduct, product]);

  const handleAddToQuote = useCallback(() => {
    if (product) {
      addToQuote(product);
      setToastMessage(`${product.title} lagt i forespørselslisten`);
      setToastVisible(true);
    }
  }, [addToQuote, product]);

  if (loading) {
    return (
      <section className="section">
        <div className="container"><p>Laster produkt...</p></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <p className="status error">{error}</p>
          <Link to="/webshop">Tilbake til nettbutikk</Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <h1>Produkt ikke funnet</h1>
          <Link to="/webshop">Tilbake til nettbutikk</Link>
        </div>
      </section>
    );
  }

  const productHasPrice = hasPrice(product);
  const allImages = product.images?.length
    ? product.images
    : product.image && !product.image.startsWith('data:')
      ? [product.image]
      : [];
  const mainImage = allImages[selectedImage] || product.image;
  const specs = product.specifications || {};
  const hasSpecs = Object.keys(specs).length > 0;

  return (
    <section className="section">
      <div className="container">
        <p style={{ marginBottom: '1rem' }}>
          <Link to="/webshop">Tilbake til nettbutikk</Link>
        </p>

        <div className="split">
          <div className="product-detail-image">
            {mainImage && !mainImage.startsWith('data:') ? (
              <img src={mainImage} alt={product.title} />
            ) : (
              <div className="image-fallback">THERWATT</div>
            )}
            {allImages.length > 1 && (
              <div className="product-thumbnails">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    className={`thumbnail-btn ${i === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={img} alt={`${product.title} bilde ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="prose">
            <h1>{product.title}</h1>

            <div className="product-detail-badges">
              <span className="badge">{product.category}</span>
              {product.supplier && <span className="badge badge-supplier">{product.supplier}</span>}
            </div>

            <dl className="product-detail-info">
              <div>
                <dt>Varenummer</dt>
                <dd>{product.product_number}</dd>
              </div>
              {product.supplier && (
                <div>
                  <dt>Leverandør</dt>
                  <dd>{product.supplier}</dd>
                </div>
              )}
              {product.main_category && (
                <div>
                  <dt>Hovedkategori</dt>
                  <dd>{product.main_category}</dd>
                </div>
              )}
              {product.sub_category && (
                <div>
                  <dt>Underkategori</dt>
                  <dd>{product.sub_category}</dd>
                </div>
              )}
              {product.product_group && (
                <div>
                  <dt>Produktgruppe</dt>
                  <dd>{product.product_group}</dd>
                </div>
              )}
              {product.unit && (
                <div>
                  <dt>Enhet</dt>
                  <dd>{product.unit}</dd>
                </div>
              )}
            </dl>

            {productHasPrice ? (
              <div className="product-detail-price">
                <p className="price-large">{formatPrice(product.price_inc_vat)}</p>
                <p className="muted-note">Pris ex. mva: {formatPrice(product.price_ex_vat)}</p>
                <button className="btn btn-primary" onClick={handleAddToCart}>
                  Legg i handlekurv
                </button>
              </div>
            ) : (
              <div className="product-detail-price">
                <p className="price-large price-missing">Pris på forespørsel</p>
                <button
                  className="btn btn-quote"
                  onClick={handleAddToQuote}
                  disabled={isInList(product.product_number)}
                >
                  {isInList(product.product_number) ? 'Allerede i forespørselslisten' : 'Be om tilbud'}
                </button>
              </div>
            )}

            {product.description && product.description !== 'Produktbeskrivelse kommer' && (
              <div className="product-detail-description">
                <h3>Beskrivelse</h3>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {hasSpecs && (
          <div className="product-detail-specs">
            <h3>Tekniske spesifikasjoner</h3>
            <table className="spec-table">
              <tbody>
                {Object.entries(specs).map(([key, val]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {related.length > 0 && (
          <div className="product-detail-related">
            <h3>Relaterte produkter</h3>
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p.product_number} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Toast message={toastMessage} visible={toastVisible} onDone={() => setToastVisible(false)} />
    </section>
  );
}
