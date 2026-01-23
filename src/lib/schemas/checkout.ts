import { z } from 'zod';

const phoneRegex = /^(\+47)?[2-9]\d{7}$/;
const postalCodeRegex = /^\d{4}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const shippingAddressSchema = z.object({
  line1: z.string()
    .min(1, 'Address is required')
    .max(200, 'Address too long'),
  line2: z.string().max(200).optional(),
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City name too long'),
  postal_code: z.string()
    .regex(postalCodeRegex, 'Invalid postal code (must be 4 digits)'),
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country name too long'),
});

export const orderItemSchema = z.object({
  product_id: z.string()
    .regex(uuidRegex, 'Invalid product ID'),
  title: z.string()
    .min(1, 'Product title is required')
    .max(200, 'Product title too long'),
  price: z.number()
    .int('Price must be an integer (in øre)')
    .min(0, 'Price cannot be negative')
    .max(100000000, 'Price exceeds maximum'), // 1,000,000 NOK max
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity exceeds maximum'),
  image_url: z.string()
    .nullable()
    .optional()
    .transform(val => val ?? ''),
});

export const checkoutRequestSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, 'Cart cannot be empty')
    .max(50, 'Too many items in cart'),

  customer_email: z.string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Invalid email format')
    .max(254, 'Email too long')
    .transform(val => val.toLowerCase().trim()),

  customer_name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name too long')
    .transform(val => val.trim()),

  customer_phone: z.string()
    .min(1, 'Phone is required')
    .transform(val => val.replace(/\s/g, '')) // Remove spaces
    .refine(
      val => phoneRegex.test(val),
      'Invalid phone number (must be 8 digits, optionally with +47)'
    ),

  shipping_address: shippingAddressSchema,

  discount_code: z.string()
    .max(50, 'Discount code too long')
    .transform(val => val.toUpperCase().trim())
    .optional(),

  discount_amount: z.number()
    .int('Discount must be an integer')
    .min(0, 'Discount cannot be negative')
    .max(100000000, 'Discount exceeds maximum')
    .optional()
    .default(0),

  shipping_cost: z.number()
    .int('Shipping cost must be an integer')
    .min(0, 'Shipping cost cannot be negative')
    .max(10000000, 'Shipping cost exceeds maximum')
    .optional()
    .default(0),

  artist_levy: z.number()
    .int('Artist levy must be an integer')
    .min(0, 'Artist levy cannot be negative')
    .max(10000000, 'Artist levy exceeds maximum')
    .optional()
    .default(0),

  locale: z.enum(['no', 'en']).optional().default('no'),

  privacy_accepted: z.boolean()
    .refine(val => val === true, 'Privacy policy must be accepted')
    .optional()
    .default(false),

  newsletter_opt_in: z.boolean().optional().default(false),

  checkout_token: z.union([
    z.string().min(1, 'Checkout token is required'),
    z.null(),
    z.undefined(),
  ]).transform(val => val || undefined),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

export function validateCheckoutRequest(data: unknown): {
  success: true;
  data: CheckoutRequest;
} | {
  success: false;
  error: string;
  details?: z.ZodError['issues'];
} {
  const result = checkoutRequestSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    const path = firstError.path.join('.');
    const message = path
      ? `${path}: ${firstError.message}`
      : firstError.message;

    return {
      success: false,
      error: message,
      details: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
