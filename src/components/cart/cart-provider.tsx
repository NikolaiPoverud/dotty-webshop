'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Product, CartProduct, CartItem, Cart } from '@/types';
import { calculateCartTotalsSimple, type CartItemInput } from '@/lib/services/cart-service';

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
    requires_inquiry: product.requires_inquiry,
    shipping_cost: product.shipping_cost,
  };
}

// Initial cart state
const initialCart: Cart = {
  items: [],
  subtotal: 0,
  discountAmount: 0,
  shippingCost: 0,
  artistLevy: 0,
  total: 0,
};

// ARCH-008: Use CartService for consistent calculations
function calculateTotals(items: CartItem[], discountAmount: number): Pick<Cart, 'subtotal' | 'shippingCost' | 'artistLevy' | 'total'> {
  // Convert CartItem[] to CartItemInput[] for the service
  const serviceItems: CartItemInput[] = items.map(item => ({
    productId: item.product.id,
    title: item.product.title,
    price: item.product.price,
    quantity: item.quantity,
    shippingCost: item.product.shipping_cost,
  }));

  return calculateCartTotalsSimple(serviceItems, discountAmount);
}

// Helper to create updated cart state with recalculated totals
function withTotals(state: Cart, items: CartItem[], discountAmount: number = state.discountAmount): Cart {
  return { ...state, items, ...calculateTotals(items, discountAmount) };
}

// Cart reducer
function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, reservationId, expiresAt } = action.payload;
      const cartProduct = toCartProduct(product);
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);

      const newItems = existingIndex > -1
        ? state.items.map((item, index) =>
            index === existingIndex
              ? { ...item, product: cartProduct, quantity: item.quantity + quantity, reservationId, expiresAt }
              : item
          )
        : [...state.items, { product: cartProduct, quantity, reservationId, expiresAt }];

      return withTotals(state, newItems);
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.product.id !== action.payload.productId);
      return withTotals(state, newItems);
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } });
      }
      const newItems = state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      return withTotals(state, newItems);
    }

    case 'APPLY_DISCOUNT': {
      const { code, amount } = action.payload;
      return { ...withTotals(state, state.items, amount), discountCode: code, discountAmount: amount };
    }

    case 'CLEAR_DISCOUNT': {
      return { ...withTotals(state, state.items, 0), discountCode: undefined, discountAmount: 0 };
    }

    case 'CLEAR_CART':
      return initialCart;

    case 'LOAD_CART':
      return action.payload;

    case 'REMOVE_EXPIRED': {
      const now = Date.now();
      const newItems = state.items.filter((item) =>
        !item.expiresAt || new Date(item.expiresAt).getTime() > now
      );
      if (newItems.length === state.items.length) return state;
      return withTotals(state, newItems);
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

  function addItem(product: Product, quantity = 1, reservationId?: string, expiresAt?: string): void {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, reservationId, expiresAt } });
  }

  function removeItem(productId: string): void {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  }

  function updateQuantity(productId: string, quantity: number): void {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }

  function applyDiscount(code: string, amount: number): void {
    dispatch({ type: 'APPLY_DISCOUNT', payload: { code, amount } });
  }

  function clearDiscount(): void {
    dispatch({ type: 'CLEAR_DISCOUNT' });
  }

  function clearCart(): void {
    dispatch({ type: 'CLEAR_CART' });
  }

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

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
