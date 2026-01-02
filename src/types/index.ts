// Database Types

export interface ProductSize {
  width: number;  // cm
  height: number; // cm
  label: string;  // e.g., "60x80 cm"
}

export interface GalleryImage {
  url: string;
  path: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number; // NOK øre, includes MVA
  image_url: string;
  image_path: string;
  product_type: 'original' | 'print';
  stock_quantity: number | null; // null for originals
  collection_id: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  sizes?: ProductSize[];
  gallery_images?: GalleryImage[];
  created_at: string;
  updated_at: string;
}

// Lightweight product data for listing/card views (DB-011: optimized SELECT)
export type ProductListItem = Pick<Product,
  'id' | 'title' | 'slug' | 'price' | 'image_url' | 'product_type' |
  'is_available' | 'is_featured' | 'stock_quantity' | 'collection_id'
> & { sizes?: ProductSize[] };

// Alias for backwards compatibility with component names
export type ProductCard = ProductListItem;

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  shipping_cost: number; // NOK øre (100 = 1 kr). 0 = free shipping
  created_at: string;
}

// Lightweight collection data for filter/listing views (DB-011: optimized SELECT)
export type CollectionCard = Pick<Collection, 'id' | 'name' | 'slug' | 'description'>;

export interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  total: number;
  payment_provider: 'stripe' | 'vipps' | null;
  payment_session_id: string | null;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  tracking_carrier: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  is_active: boolean;
  uses_remaining: number | null;
  expires_at: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  feedback: string;
  name: string;
  source: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Lightweight testimonial data for display (DB-011: optimized SELECT)
export type TestimonialCard = Pick<Testimonial, 'id' | 'name' | 'feedback' | 'source'>;

export interface CartReservation {
  id: string;
  product_id: string;
  session_id: string;
  quantity: number;
  expires_at: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  resend_synced: boolean;
}

// Cart Types
// ARCH-007: Optimized product data for cart storage (reduces localStorage size)
export type CartProduct = Pick<Product,
  'id' | 'title' | 'slug' | 'price' | 'image_url' | 'product_type' | 'stock_quantity' | 'is_available'
>;

export interface CartItem {
  product: CartProduct;
  quantity: number;
  reservationId?: string;
  expiresAt?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  total: number;
}

// i18n Types
export type Locale = 'no' | 'en';

export interface Dictionary {
  navigation: {
    shop: string;
    cart: string;
    about: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  shop: {
    title: string;
    allCollections: string;
    addToCart: string;
    soldOut: string;
    sold: string;
    original: string;
    print: string;
    requestSimilar: string;
  };
  cart: {
    title: string;
    empty: string;
    continueShopping: string;
    checkout: string;
    remove: string;
    subtotal: string;
    total: string;
    reservationWarning: string;
    itemSoldOut: string;
  };
  checkout: {
    title: string;
    shipping: string;
    payment: string;
    discountCode: string;
    apply: string;
    invalidCode: string;
    payWithCard: string;
    payWithVipps: string;
    processing: string;
  };
  success: {
    title: string;
    message: string;
    orderNumber: string;
    emailSent: string;
  };
  newsletter: {
    title: string;
    placeholder: string;
    subscribe: string;
    success: string;
  };
  footer: {
    privacy: string;
    terms: string;
    copyright: string;
  };
  errors: {
    itemSold: string;
    paymentFailed: string;
    cartExpired: string;
    generic: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Admin Types
export interface AdminStats {
  salesThisMonth: number;
  ordersThisMonth: number;
  topSellers: Array<{
    product: Product;
    totalSold: number;
  }>;
}
