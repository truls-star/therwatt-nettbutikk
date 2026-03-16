import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ProductWithPricing } from '../catalog/catalogService';

export type CartLine = {
  productNumber: string;
  name: string;
  priceIncVat: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
};

type CartAction =
  | { type: 'add'; product: ProductWithPricing }
  | { type: 'remove'; productNumber: string }
  | { type: 'set_quantity'; productNumber: string; quantity: number }
  | { type: 'clear' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'add': {
      const price = action.product.pricing?.finalPriceIncVat;
      if (!price) return state;

      const existing = state.lines.find((line) => line.productNumber === action.product.productNumber);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.productNumber === action.product.productNumber
              ? { ...line, quantity: line.quantity + 1 }
              : line
          )
        };
      }

      return {
        lines: [
          ...state.lines,
          {
            productNumber: action.product.productNumber,
            name: action.product.name,
            priceIncVat: price,
            quantity: 1
          }
        ]
      };
    }
    case 'remove':
      return { lines: state.lines.filter((line) => line.productNumber !== action.productNumber) };
    case 'set_quantity':
      return {
        lines: state.lines
          .map((line) =>
            line.productNumber === action.productNumber ? { ...line, quantity: Math.max(1, action.quantity) } : line
          )
          .filter((line) => line.quantity > 0)
      };
    case 'clear':
      return { lines: [] };
    default:
      return state;
  }
};

type CartContextType = {
  state: CartState;
  addProduct: (product: ProductWithPricing) => void;
  removeProduct: (productNumber: string) => void;
  setQuantity: (productNumber: string, quantity: number) => void;
  clear: () => void;
  totalIncVat: number;
  lineCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });

  const value = useMemo(() => {
    const totalIncVat = state.lines.reduce((sum, line) => sum + line.priceIncVat * line.quantity, 0);
    const lineCount = state.lines.reduce((sum, line) => sum + line.quantity, 0);

    return {
      state,
      addProduct: (product: ProductWithPricing) => dispatch({ type: 'add', product }),
      removeProduct: (productNumber: string) => dispatch({ type: 'remove', productNumber }),
      setQuantity: (productNumber: string, quantity: number) => dispatch({ type: 'set_quantity', productNumber, quantity }),
      clear: () => dispatch({ type: 'clear' }),
      totalIncVat,
      lineCount
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};
