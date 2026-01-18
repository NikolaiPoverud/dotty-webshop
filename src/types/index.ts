// Product Types

export interface ProductSize {
  width: number;
  height: number;
  label: string;
}

export interface GalleryImage {
  url: string;
  path: string;
}

export type ShippingSize = 'small' | 'medium' | 'large' | 'oversized';

export const SHIPPING_SIZE_INFO: Record<ShippingSize, { label: string; description: string }> = {
  small: { label: 'Liten', description: 'Trykk opptil A4 (21x30 cm) - Passer i standard postkasse' },
  medium: { label: 'Medium', description: 'Trykk opptil A2 (42x60 cm) - Sendes i rør eller flat eske' },
  large: { label: 'Stor', description: 'Trykk/originaler opptil 100 cm - Krever spesialhåndtering' },
  oversized: { label: 'Ekstra stor', description: 'Større verk - Krever spesialtransport eller henting' },
};

export interface Product {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  sku: string | null;
  price: number;
  image_url: string;
  image_path: string;
  product_type: 'original' | 'print';
  stock_quantity: number | null;
  collection_id: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_public: boolean;
  display_order: number;
  shipping_cost: number | null;
  shipping_size: ShippingSize | null;
  requires_inquiry: boolean;
  year: number | null;
  sizes?: ProductSize[];
  gallery_images?: GalleryImage[];
  created_at: string;
  updated_at: string;
}

export type ProductListItem = Pick<Product,
  | 'id' | 'title' | 'slug' | 'price' | 'image_url' | 'product_type'
  | 'is_available' | 'is_featured' | 'is_public' | 'stock_quantity' | 'collection_id' | 'requires_inquiry'
> & { sizes?: ProductSize[] };

export type ProductCard = ProductListItem;

// Collection Types

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  shipping_cost: number;
  is_public: boolean;
  created_at: string;
}

export type CollectionCard = Pick<Collection, 'id' | 'name' | 'slug' | 'description'>;

// Order Types

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

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentProvider = 'stripe' | 'vipps';

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  // DB-003: items removed - now stored in order_items junction table
  // Use OrderWithItems for orders that include items
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  shipping_cost: number;
  artist_levy: number;
  total: number;
  payment_provider: PaymentProvider | null;
  payment_session_id: string | null;
  status: OrderStatus;
  tracking_carrier: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

// Order with items loaded from order_items junction table
export interface OrderWithItems extends Order {
  items: OrderItem[];
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

// Testimonial Types

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

export type TestimonialCard = Pick<Testimonial, 'id' | 'name' | 'feedback' | 'source'>;

// Cart Types

export interface CartReservation {
  id: string;
  product_id: string;
  session_id: string;
  quantity: number;
  expires_at: string;
  created_at: string;
}

export type CartProduct = Pick<Product,
  | 'id' | 'title' | 'slug' | 'price' | 'image_url' | 'product_type'
  | 'stock_quantity' | 'is_available' | 'requires_inquiry' | 'shipping_cost'
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
  shippingCost: number;
  artistLevy: number;
  total: number;
}

// Newsletter Types

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  resend_synced: boolean;
}

// Shipping Types (Bring integration)
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  deliveryType: string;
  estimatedDelivery: string;
  workingDays: number;
  priceWithVat: number; // In øre (cents)
  priceWithoutVat: number;
  logo?: string;
  environmentalInfo?: {
    fossilFreePercentage?: number;
  };
}

// i18n Types
export type Locale = 'no' | 'en';

export interface Dictionary {
  navigation: {
    shop: string;
    cart: string;
    about: string;
    aboutArtist: string;
    art: string;
    contact: string;
    collections: string;
    allProducts: string;
    admin: string;
  };
  hero: {
    title: string;
    headline: string;
    subtitle: string;
    cta: string;
  };
  shop: {
    title: string;
    sectionTitle: string;
    allCollections: string;
    addToCart: string;
    soldOut: string;
    sold: string;
    original: string;
    print: string;
    requestSimilar: string;
    sizes: string;
    left: string;
    backToShop: string;
    backToHome: string;
    all: string;
    empty: string;
    viewAll: string;
    comingSoon: string;
  };
  cart: {
    title: string;
    empty: string;
    emptyShort: string;
    continueShopping: string;
    continueShoppingShort: string;
    checkout: string;
    toCheckout: string;
    remove: string;
    subtotal: string;
    total: string;
    reservationWarning: string;
    itemSoldOut: string;
    discount: string;
    includingVat: string;
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
    name: string;
    email: string;
    phone: string;
    address: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
    subtotal: string;
    artistLevy: string;
    artistLevyNote: string;
    discount: string;
    shippingCost: string;
    shippingFree: string;
    total: string;
    orderSummary: string;
    includingVat: string;
    emptyCart: string;
    paymentCanceled: string;
    paymentCanceledDesc: string;
    paymentFailed: string;
    paymentFailedDesc: string;
    genericError: string;
    fillAllFields: string;
    acceptPrivacy: string;
    privacyPolicy: string;
    subscribeNewsletter: string;
    acceptPrivacyRequired: string;
    discountApplied: string;
    discountValidationFailed: string;
    vippsIncomplete: string;
    shippingMethod: string;
    selectShipping: string;
    shippingLoading: string;
    noShippingOptions: string;
    shippingRequired: string;
  };
  success: {
    title: string;
    message: string;
    orderNumber: string;
    emailSent: string;
    shippingNote: string;
    backToShop: string;
    total: string;
    loading: string;
    yourOrder: string;
  };
  newsletter: {
    title: string;
    subtitle: string;
    placeholder: string;
    subscribe: string;
    success: string;
    successMessage: string;
    alreadySubscribed: string;
    error: string;
  };
  footer: {
    privacy: string;
    terms: string;
    cookies: string;
    myData: string;
    copyright: string;
    returns: string;
    securePayment: string;
    shop: string;
    collections: string;
    allProducts: string;
  };
  language: {
    switchTo: string;
  };
  errors: {
    itemSold: string;
    paymentFailed: string;
    cartExpired: string;
    generic: string;
  };
  form: {
    name: string;
    email: string;
    phone: string;
    address: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
  };
  artist: {
    title: string;
    statement: string;
  };
  contact: {
    greeting: string;
    title: string;
    subtitle: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    success: string;
    error: string;
    privacyNotice: string;
    privacyLink: string;
  };
  cookies: {
    title: string;
    description: string;
    accept: string;
    decline: string;
    learnMore: string;
  };
  productDetail: {
    backToShop: string;
    dimensions: string;
    year: string;
    availability: string;
    available: string;
    soldOut: string;
    addToCart: string;
    addedToCart: string;
    viewCart: string;
    original: string;
    print: string;
    inquiryOnly: string;
    inquiryDescription: string;
    emailPlaceholder: string;
    sendInquiry: string;
    inquirySent: string;
    inquiryError: string;
    soldOutInterest: string;
    soldOutDescription: string;
    contactArtist: string;
    shippingEstimate: string;
    returnPolicy: string;
    material: string;
    type: string;
    aboutArtist: string;
  };
  shipping: {
    title: string;
    loading: string;
    enterPostalCode: string;
    noOptions: string;
    estimated: string;
    fossilFree: string;
    pickup: string;
    homeDelivery: string;
    error: string;
  };
  soldPage: {
    title: string;
    description: string;
    empty: string;
  };
  faq: {
    title: string;
    subtitle: string;
    moreQuestions: string;
    contact: string;
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
