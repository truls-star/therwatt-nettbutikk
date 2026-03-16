/**
 * Quote/inquiry list for products without price
 * localStorage-based, similar pattern to cart
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Product } from './loadProducts';

const STORAGE_KEY = 'therwatt_quote_list';

export type QuoteLine = {
  product_number: string;
  title: string;
  slug: string;
  image: string;
  supplier: string;
  comment: string;
};

type QuoteState = {
  lines: QuoteLine[];
};

type QuoteAction =
  | { type: 'add'; product: Product }
  | { type: 'remove'; product_number: string }
  | { type: 'set_comment'; product_number: string; comment: string }
  | { type: 'clear' }
  | { type: 'hydrate'; lines: QuoteLine[] };

function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case 'add': {
      const existing = state.lines.find((l) => l.product_number === action.product.product_number);
      if (existing) return state;
      return {
        lines: [
          ...state.lines,
          {
            product_number: action.product.product_number,
            title: action.product.title,
            slug: action.product.slug,
            image: action.product.image,
            supplier: action.product.supplier,
            comment: '',
          },
        ],
      };
    }
    case 'remove':
      return { lines: state.lines.filter((l) => l.product_number !== action.product_number) };
    case 'set_comment':
      return {
        lines: state.lines.map((l) =>
          l.product_number === action.product_number ? { ...l, comment: action.comment } : l
        ),
      };
    case 'clear':
      return { lines: [] };
    case 'hydrate':
      return { lines: action.lines };
    default:
      return state;
  }
}

function loadFromStorage(): QuoteLine[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveToStorage(lines: QuoteLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore
  }
}

type QuoteContextType = {
  lines: QuoteLine[];
  lineCount: number;
  addProduct: (product: Product) => void;
  removeProduct: (productNumber: string) => void;
  setComment: (productNumber: string, comment: string) => void;
  clear: () => void;
  isInList: (productNumber: string) => boolean;
};

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, { lines: [] });

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.length > 0) {
      dispatch({ type: 'hydrate', lines: stored });
    }
  }, []);

  useEffect(() => {
    saveToStorage(state.lines);
  }, [state.lines]);

  const addProduct = useCallback((product: Product) => dispatch({ type: 'add', product }), []);
  const removeProduct = useCallback((pn: string) => dispatch({ type: 'remove', product_number: pn }), []);
  const setComment = useCallback((pn: string, comment: string) => dispatch({ type: 'set_comment', product_number: pn, comment }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(() => ({
    lines: state.lines,
    lineCount: state.lines.length,
    addProduct,
    removeProduct,
    setComment,
    clear,
    isInList: (pn: string) => state.lines.some((l) => l.product_number === pn),
  }), [state.lines, addProduct, removeProduct, setComment, clear]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuoteList() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuoteList must be used within QuoteProvider');
  return ctx;
}
