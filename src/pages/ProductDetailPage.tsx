import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadAllProducts, type Product } from '../lib/loadProducts';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/formatters';

export function ProductDetailPage() {
  const params = useParams<{ productNumber: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addProduct } = useCart();

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

  return (
    <section className="section">
      <div className="container split">
        <div className="product-detail-image">
          {product.image && !product.image.startsWith('data:') ? (
            <img src={product.image} alt={product.title} />
          ) : (
            <div className="image-fallback">THERWATT</div>
          )}
        </div>
        <div className="prose">
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <p>Kategori: {product.category}</p>
          <p>Varenummer: {product.product_number}</p>
          <p>
            Pris inkl. mva: <strong>{formatPrice(product.price_inc_vat)}</strong>
          </p>
          <p className="muted-note">
            Pris ex. mva: {formatPrice(product.price_ex_vat)}
          </p>

          <button className="btn btn-primary" onClick={() => addProduct(product)}>
            Legg i handlekurv
          </button>

          <p style={{ marginTop: '1rem' }}>
            <Link to="/webshop">Tilbake til nettbutikk</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
