/**
 * Frontend product loader
 * Fetches products from the Netlify Function API
 */

export type Product = {
  supplier: string;
  supplier_product_id: string;
  product_number: string;
  nobb_number: string | null;
  ean: string | null;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  brand: string;
  main_category: string;
  sub_category: string;
  product_group: string;
  category: string;
  category_slug: string;
  image: string;
  images: string[];
  documents: string[];
  specifications: Record<string, string>;
  gross_price: number;
  gross_price_ex_vat: number;
  discount_percent: number;
  customer_discount_percent: number;
  price_ex_vat: number;
  price: number;
  price_inc_vat: number;
  vat_rate: number;
  price_status: string;
  stock_status: string;
  unit: string;
  source_type: string;
  source_url: string | null;
  valid_from: string | null;
  match_keys: {
    product_number: string;
    nobb_number: string | null;
    ean: string | null;
    normalized_title: string;
  };
};

export type Category = {
  id: string;
  name: string;
  count: number;
};

export type Supplier = {
  id: string;
  name: string;
  count: number;
};

export type SubCategory = {
  name: string;
  product_groups: string[];
};

export type CategoryHierarchyItem = {
  name: string;
  sub_categories: SubCategory[];
};

export type ProductsResponse = {
  success: boolean;
  total: number;
  count: number;
  offset: number;
  categories: Category[];
  suppliers: Supplier[];
  categoryHierarchy: CategoryHierarchyItem[];
  parseErrors: number;
  products: Product[];
  error?: string;
};

export type ProductBySlugResponse = {
  success: boolean;
  product?: Product;
  related?: Product[];
  error?: string;
};

let cache: ProductsResponse | null = null;

export async function loadProducts(params?: {
  category?: string;
  supplier?: string;
  price_status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.supplier) searchParams.set('supplier', params.supplier);
  if (params?.price_status) searchParams.set('price_status', params.price_status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const url = `/.netlify/functions/products${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kunne ikke hente produkter (${response.status})`);
  }

  const data: ProductsResponse = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Ukjent feil ved lasting av produkter');
  }

  return data;
}

export async function loadAllProducts(): Promise<ProductsResponse> {
  if (cache) return cache;
  cache = await loadProducts();
  return cache;
}

export function clearProductCache(): void {
  cache = null;
}

export async function loadProductBySlug(slug: string): Promise<ProductBySlugResponse> {
  const response = await fetch(`/.netlify/functions/product-by-slug?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Kunne ikke hente produkt (${response.status})`);
  }
  return response.json();
}

/**
 * Check if product has a price
 */
export function hasPrice(product: Product): boolean {
  return product.price_status === 'active' && product.price_inc_vat > 0;
}
