'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Product, CartProduct, CartItem, Cart } from '@/types';

// Cart actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number; reservationId?: string; expiresAt?: string } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'APPLY_DISCOUNT'; payload: { code: string; amount: number } }
  | { type: 'CLEAR_DISCOUNT' }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart }
  | { type: 'REMOVE_EXPIRED' };

// ARCH-007: Extract only essential product fields for cart storage
function toCartProduct(product: Product): CartProduct {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    image_url: product.image_url,
    product_type: product.product_type,
    stock_quantity: product.stock_quantity,
    is_available: product.is_available,
  };
}

// Initial cart state
const initialCart: Cart = {
  items: [],
  subtotal: 0,
  discountAmount: 0,
  total: 0,
};

// Calculate totals
function calculateTotals(items: CartItem[], discountAmount: number): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, total };
}

// Cart reducer
function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, reservationId, expiresAt } = action.payload;
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      // ARCH-007: Store only essential product fields
      const cartProduct = toCartProduct(product);

      let newItems: CartItem[];
      if (existingIndex > -1) {
        // Update existing item
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, product: cartProduct, quantity: item.quantity + quantity, reservationId, expiresAt }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, { product: cartProduct, quantity, reservationId, expiresAt }];
      }

      const { subtotal, total } = calculateTotals(newItems, state.discountAmount);
      return { ...state, items: newItems, subtotal, total };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.product.id !== action.payload.productId);
      const { subtotal, total } = calculateTotals(newItems, state.discountAmount);
      return { ...state, items: newItems, subtotal, total };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        const newItems = state.items.filter((item) => item.product.id !== productId);
        const { subtotal, total } = calculateTotals(newItems, state.discountAmount);
        return { ...state, items: newItems, subtotal, total };
      }

      const newItems = state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      const { subtotal, total } = calculateTotals(newItems, state.discountAmount);
      return { ...state, items: newItems, subtotal, total };
    }

    case 'APPLY_DISCOUNT': {
      const { code, amount } = action.payload;
      const { subtotal, total } = calculateTotals(state.items, amount);
      return { ...state, discountCode: code, discountAmount: amount, subtotal, total };
    }

    case 'CLEAR_DISCOUNT': {
      const { subtotal, total } = calculateTotals(state.items, 0);
      return { ...state, discountCode: undefined, discountAmount: 0, subtotal, total };
    }

    case 'CLEAR_CART':
      return initialCart;

    case 'LOAD_CART':
      return action.payload;

    case 'REMOVE_EXPIRED': {
      const now = new Date().getTime();
      const newItems = state.items.filter((item) => {
        if (!item.expiresAt) return true;
        return new Date(item.expiresAt).getTime() > now;
      });

      if (newItems.length === state.items.length) return state;

      const { subtotal, total } = calculateTotals(newItems, state.discountAmount);
      return { ...state, items: newItems, subtotal, total };
    }

    default:
      return state;
  }
}

// Context
interface CartContextType {
  cart: Cart;
  addItem: (product: Product, quantity?: number, reservationId?: string, expiresAt?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyDiscount: (code: string, amount: number) => void;
  clearDiscount: () => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'dotty-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Cart;
        dispatch({ type: 'LOAD_CART', payload: parsed });
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Check for expired reservations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'REMOVE_EXPIRED' });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const addItem = (product: Product, quantity = 1, reservationId?: string, expiresAt?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, reservationId, expiresAt } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const applyDiscount = (code: string, amount: number) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: { code, amount } });
  };

  const clearDiscount = () => {
    dispatch({ type: 'CLEAR_DISCOUNT' });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        applyDiscount,
        clearDiscount,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
