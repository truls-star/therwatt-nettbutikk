import { useEffect, useMemo, useState } from 'react';
import { loadAllProducts, type Product, type Category } from '../lib/loadProducts';
import { ProductGrid } from '../components/ProductGrid';
import { CategoryFilter } from '../components/CategoryFilter';

export function WebshopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    loadAllProducts()
      .then((data) => {
        if (!mounted) return;
        setAllProducts(data.products);
        setCategories(data.categories);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Kunne ikke hente produkter.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let products = allProducts;

    if (category !== 'all') {
      products = products.filter(
        (p) => p.category_slug === category || p.category === category
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.product_number.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return products;
  }, [allProducts, category, search]);

  return (
    <section className="section">
      <div className="container">
        <h1>Nettbutikk</h1>
        <p>Profesjonelt VVS-utstyr med priser inkl. mva.</p>

        <div className="shop-toolbar">
          <label>
            Søk
            <input
              placeholder="Varenummer eller produktnavn"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <CategoryFilter
            categories={categories}
            selected={category}
            onChange={setCategory}
          />
        </div>

        {loading && <p>Laster produkter...</p>}
        {error && <p className="status error">{error}</p>}
        {!loading && !error && <ProductGrid products={filtered} />}
      </div>
    </section>
  );
}
