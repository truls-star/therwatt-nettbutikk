import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { getAllProducts, getCatalogIndex, type ProductWithPricing } from '../modules/catalog/catalogService';
import { searchProducts } from '../modules/catalog/searchEngine';
import type { CatalogIndex } from '../types/catalog';

export const WebshopPage = () => {
  const [allProducts, setAllProducts] = useState<ProductWithPricing[]>([]);
  const [catalogIndex, setCatalogIndex] = useState<CatalogIndex>({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');

  useEffect(() => {
    let mounted = true;
    Promise.all([getAllProducts(), getCatalogIndex()])
      .then(([products, index]) => {
        if (!mounted) return;
        setAllProducts(products);
        setCatalogIndex(index);
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Kunne ikke hente katalogdata.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let products = allProducts;

    if (category !== 'all') products = products.filter((product) => product.category === category);
    if (brand !== 'all') products = products.filter((product) => product.brand === brand);
    if (query.trim()) products = searchProducts(products, query);

    return products;
  }, [query, category, brand]);

  const suggestions = useMemo(() => (query.trim() ? searchProducts(allProducts, query).slice(0, 8) : []), [allProducts, query]);

  return (
    <section className="section">
      <div className="container">
        <h1>Webshop</h1>
        <p>B2B-katalog med varenummer-fokus, tekniske data og priser inkl. mva.</p>

        <div className="shop-toolbar">
          <label>
            Sok
            <input
              placeholder="Varenr, NOBB, produktnavn, merke"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Kategori
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">Alle</option>
              {catalogIndex.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.productCount})
                </option>
              ))}
            </select>
          </label>
          <label>
            Merke
            <select value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="all">Alle</option>
              {catalogIndex.brands.slice(0, 200).map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} ({item.productCount})
                </option>
              ))}
            </select>
          </label>
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((product) => (
              <button key={product.productNumber} onClick={() => setQuery(product.productNumber)}>
                {product.productNumber} - {product.name}
              </button>
            ))}
          </div>
        )}

        {loading && <p>Laster katalog...</p>}
        {loadError && <p>{loadError}</p>}
        {!loading && !loadError && (
          <div className="product-grid">
            {filtered.slice(0, 240).map((product) => (
              <ProductCard key={product.productNumber} product={product} />
            ))}
          </div>
        )}

        {filtered.length > 240 && <p className="muted-note">Viser 240 av {filtered.length} produkter. Bruk mer spesifikt sok.</p>}
        {filtered.length === 0 && <p>Ingen treff med valgte filtre.</p>}
      </div>
    </section>
  );
};
