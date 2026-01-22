'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Product, CartProduct, CartItem, Cart, ProductSize } from '@/types';
import { calculateCartTotalsSimple, type CartItemInput } from '@/lib/services/cart-service';

// Cart actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number; reservationId?: string; expiresAt?: string; selectedSize?: ProductSize } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; selectedSize?: ProductSize } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; selectedSize?: ProductSize } }
  | { type: 'APPLY_DISCOUNT'; payload: { code: string; amount: number; freeShipping?: boolean } }
  | { type: 'CLEAR_DISCOUNT' }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart }
  | { type: 'REMOVE_EXPIRED' };

// Helper to generate unique item key
function getItemKey(productId: string, size?: ProductSize): string {
  return size ? `${productId}-${size.width}x${size.height}` : productId;
}

function itemMatchesKey(item: CartItem, targetKey: string): boolean {
  const itemKey = getItemKey(item.product.id, item.selectedSize);
  return itemKey === targetKey;
}

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
function calculateTotals(items: CartItem[], discountAmount: number, freeShipping?: boolean): Pick<Cart, 'subtotal' | 'shippingCost' | 'artistLevy' | 'total'> {
  // Convert CartItem[] to CartItemInput[] for the service
  // Use size price if available, otherwise use product price
  const serviceItems: CartItemInput[] = items.map(item => ({
    productId: item.product.id,
    title: item.product.title,
    price: item.selectedSize?.price ?? item.product.price,
    quantity: item.quantity,
    shippingCost: item.product.shipping_cost,
  }));

  // Pass 0 as custom shipping cost if free shipping is applied
  const customShippingCost = freeShipping ? 0 : undefined;
  return calculateCartTotalsSimple(serviceItems, discountAmount, customShippingCost);
}

// Helper to create updated cart state with recalculated totals
function withTotals(state: Cart, items: CartItem[], discountAmount: number = state.discountAmount, freeShipping?: boolean): Cart {
  const hasFreeShipping = freeShipping ?? state.freeShipping;
  return { ...state, items, ...calculateTotals(items, discountAmount, hasFreeShipping) };
}

// Cart reducer
function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, reservationId, expiresAt, selectedSize } = action.payload;
      const cartProduct = toCartProduct(product);

      // For products with size pricing, treat each size as a separate item
      const targetKey = getItemKey(product.id, selectedSize);
      const existingIndex = state.items.findIndex((item) => itemMatchesKey(item, targetKey));

      const newItems = existingIndex > -1
        ? state.items.map((item, index) =>
            index === existingIndex
              ? { ...item, product: cartProduct, quantity: item.quantity + quantity, reservationId, expiresAt, selectedSize }
              : item
          )
        : [...state.items, { product: cartProduct, quantity, reservationId, expiresAt, selectedSize }];

      return withTotals(state, newItems);
    }

    case 'REMOVE_ITEM': {
      const { productId, selectedSize } = action.payload;
      const targetKey = getItemKey(productId, selectedSize);
      const newItems = state.items.filter((item) => !itemMatchesKey(item, targetKey));
      return withTotals(state, newItems);
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity, selectedSize } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId, selectedSize } });
      }
      const targetKey = getItemKey(productId, selectedSize);
      const newItems = state.items.map((item) =>
        itemMatchesKey(item, targetKey) ? { ...item, quantity } : item
      );
      return withTotals(state, newItems);
    }

    case 'APPLY_DISCOUNT': {
      const { code, amount, freeShipping } = action.payload;
      return { ...withTotals(state, state.items, amount, freeShipping), discountCode: code, discountAmount: amount, freeShipping };
    }

    case 'CLEAR_DISCOUNT': {
      return { ...withTotals(state, state.items, 0, false), discountCode: undefined, discountAmount: 0, freeShipping: false };
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
  addItem: (product: Product, quantity?: number, reservationId?: string, expiresAt?: string, selectedSize?: ProductSize) => void;
  removeItem: (productId: string, selectedSize?: ProductSize) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: ProductSize) => void;
  applyDiscount: (code: string, amount: number, freeShipping?: boolean) => void;
  clearDiscount: () => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'dotty-cart';
const CART_STORAGE_VERSION = 1;
const CART_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface StoredCart {
  version: number;
  timestamp: number;
  cart: Cart;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  // SEC-016: Load cart from localStorage with expiration check
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);

        // Handle legacy format (direct cart object)
        if (!data.version) {
          // Legacy cart without versioning - clear it
          console.log('Clearing legacy cart format');
          localStorage.removeItem(CART_STORAGE_KEY);
          return;
        }

        const storedCart = data as StoredCart;

        // Check version compatibility
        if (storedCart.version !== CART_STORAGE_VERSION) {
          console.log('Cart version mismatch, clearing cart');
          localStorage.removeItem(CART_STORAGE_KEY);
          return;
        }

        // Check if cart has expired
        const age = Date.now() - storedCart.timestamp;
        if (age > CART_MAX_AGE_MS) {
          console.log('Cart expired, clearing');
          localStorage.removeItem(CART_STORAGE_KEY);
          return;
        }

        dispatch({ type: 'LOAD_CART', payload: storedCart.cart });
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // SEC-016: Save cart to localStorage with version and timestamp
  useEffect(() => {
    const storedCart: StoredCart = {
      version: CART_STORAGE_VERSION,
      timestamp: Date.now(),
      cart,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart));
  }, [cart]);

  // Check for expired reservations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'REMOVE_EXPIRED' });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  function addItem(product: Product, quantity = 1, reservationId?: string, expiresAt?: string, selectedSize?: ProductSize): void {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, reservationId, expiresAt, selectedSize } });
  }

  function removeItem(productId: string, selectedSize?: ProductSize): void {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, selectedSize } });
  }

  function updateQuantity(productId: string, quantity: number, selectedSize?: ProductSize): void {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, selectedSize } });
  }

  function applyDiscount(code: string, amount: number, freeShipping?: boolean): void {
    dispatch({ type: 'APPLY_DISCOUNT', payload: { code, amount, freeShipping } });
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
