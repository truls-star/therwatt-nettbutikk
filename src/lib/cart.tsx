/**
 * Shopping cart with localStorage persistence
 * Includes shipping calculation at cart level
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { calculateCartTotals } from './services/shippingCalculator.js';
import type { Product } from './loadProducts';

const STORAGE_KEY = 'therwatt_cart';

export type CartLine = {
  product_number: string;
  title: string;
  slug: string;
  image: string;
  price_inc_vat: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
};

type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'remove'; product_number: string }
  | { type: 'set_quantity'; product_number: string; quantity: number }
  | { type: 'clear' }
  | { type: 'hydrate'; lines: CartLine[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.lines.find((l) => l.product_number === action.product.product_number);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.product_number === action.product.product_number
              ? { ...l, quantity: l.quantity + 1 }
              : l
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            product_number: action.product.product_number,
            title: action.product.title,
            slug: action.product.slug,
            image: action.product.image,
            price_inc_vat: action.product.price_inc_vat,
            quantity: 1,
          },
        ],
      };
    }
    case 'remove':
      return { lines: state.lines.filter((l) => l.product_number !== action.product_number) };
    case 'set_quantity': {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((l) => l.product_number !== action.product_number) };
      }
      return {
        lines: state.lines.map((l) =>
          l.product_number === action.product_number ? { ...l, quantity: action.quantity } : l
        ),
      };
    }
    case 'clear':
      return { lines: [] };
    case 'hydrate':
      return { lines: action.lines };
    default:
      return state;
  }
}

function loadFromStorage(): CartLine[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

function saveToStorage(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore storage errors
  }
}

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
};

type CartContextType = {
  lines: CartLine[];
  lineCount: number;
  addProduct: (product: Product) => void;
  removeProduct: (productNumber: string) => void;
  setQuantity: (productNumber: string, quantity: number) => void;
  clear: () => void;
  totals: CartTotals;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.length > 0) {
      dispatch({ type: 'hydrate', lines: stored });
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    saveToStorage(state.lines);
  }, [state.lines]);

  const addProduct = useCallback((product: Product) => dispatch({ type: 'add', product }), []);
  const removeProduct = useCallback((pn: string) => dispatch({ type: 'remove', product_number: pn }), []);
  const setQuantity = useCallback((pn: string, qty: number) => dispatch({ type: 'set_quantity', product_number: pn, quantity: qty }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(() => {
    const subtotal = state.lines.reduce((sum, l) => sum + l.price_inc_vat * l.quantity, 0);
    const lineCount = state.lines.reduce((sum, l) => sum + l.quantity, 0);
    const totals = calculateCartTotals(subtotal);

    return {
      lines: state.lines,
      lineCount,
      addProduct,
      removeProduct,
      setQuantity,
      clear,
      totals,
    };
  }, [state.lines, addProduct, removeProduct, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
