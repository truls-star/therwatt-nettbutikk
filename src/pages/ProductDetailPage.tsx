import { Link, useParams } from 'react-router-dom';
import { getProductByProductNumber } from '../modules/catalog/catalogService';
import { useCart } from '../modules/cart/cartStore';
import { useEffect, useState } from 'react';
import type { ProductWithPricing } from '../modules/catalog/catalogService';

export const ProductDetailPage = () => {
  const params = useParams<{ productNumber: string }>();
  const [product, setProduct] = useState<ProductWithPricing | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { addProduct } = useCart();

  useEffect(() => {
    if (!params.productNumber) {
      setLoading(false);
      return;
    }

    let mounted = true;
    getProductByProductNumber(params.productNumber)
      .then((result) => {
        if (!mounted) return;
        setProduct(result);
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Kunne ikke hente produkt.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [params.productNumber]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Laster produkt...</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="section">
        <div className="container">
          <p>{loadError}</p>
          <Link to="/webshop">Tilbake til webshop</Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <h1>Produkt ikke funnet</h1>
          <Link to="/webshop">Tilbake til webshop</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container split">
        <div className="product-detail-image">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="image-fallback">THERWATT</div>}
        </div>
        <div className="prose">
          <h1>{product.name}</h1>
          <p>{product.description || 'Produktbeskrivelse oppdateres.'}</p>
          <p>Merke: {product.brand || product.supplier}</p>
          <p>Varenummer: {product.productNumber}</p>
          <p>NOBB: {product.nobbNumber || '-'}</p>
          <p>
            Pris inkl. mva:{' '}
            <strong>
              {product.pricing?.finalPriceIncVat
                ? product.pricing.finalPriceIncVat.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })
                : 'Pris pa foresporsel'}
            </strong>
          </p>

          {product.technicalSpecs && (
            <table className="spec-table">
              <tbody>
                {Object.entries(product.technicalSpecs).map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button className="btn btn-primary" onClick={() => addProduct(product)} disabled={!product.pricing?.finalPriceIncVat}>
            Legg i handlekurv
          </button>
        </div>
      </div>
    </section>
  );
};
