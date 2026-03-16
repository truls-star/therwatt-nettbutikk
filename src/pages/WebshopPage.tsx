import { useEffect, useMemo, useState } from 'react';
import { loadAllProducts, type Product, type Category, type Supplier } from '../lib/loadProducts';
import { ProductGrid } from '../components/ProductGrid';
import { CategoryFilter } from '../components/CategoryFilter';
import { SupplierFilter } from '../components/SupplierFilter';
import { SearchBar } from '../components/SearchBar';
import { PriceStatusFilter } from '../components/PriceStatusFilter';

export function WebshopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [supplier, setSupplier] = useState('all');
  const [priceStatus, setPriceStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    loadAllProducts()
      .then((data) => {
        if (!mounted) return;
        setAllProducts(data.products);
        setCategories(data.categories);
        setSuppliers(data.suppliers || []);
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

    if (supplier !== 'all') {
      products = products.filter((p) => p.supplier === supplier);
    }

    if (priceStatus !== 'all') {
      products = products.filter((p) => p.price_status === priceStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.product_number.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
      );
    }

    return products;
  }, [allProducts, category, supplier, priceStatus, search]);

  return (
    <section className="section">
      <div className="container">
        <h1>Nettbutikk</h1>
        <p>Profesjonelt VVS-utstyr med priser inkl. mva.</p>

        <div className="shop-toolbar">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter
            categories={categories}
            selected={category}
            onChange={setCategory}
          />
          <SupplierFilter
            suppliers={suppliers}
            selected={supplier}
            onChange={setSupplier}
          />
          <PriceStatusFilter
            selected={priceStatus}
            onChange={setPriceStatus}
          />
        </div>

        {loading && <p>Laster produkter...</p>}
        {error && <p className="status error">{error}</p>}
        {!loading && !error && <ProductGrid products={filtered} />}
      </div>
    </section>
  );
}
