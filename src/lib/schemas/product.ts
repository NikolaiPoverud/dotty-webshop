/**
 * SEC-007: Zod validation schemas for product creation/update
 *
 * These schemas validate product data to prevent malformed input
 * from reaching the database and ensure data integrity.
 */

import { z } from 'zod';

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Product size schema
 */
export const productSizeSchema = z.object({
  width: z.number()
    .min(0, 'Width cannot be negative')
    .max(1000, 'Width exceeds maximum'),
  height: z.number()
    .min(0, 'Height cannot be negative')
    .max(1000, 'Height exceeds maximum'),
  label: z.string()
    .max(100, 'Label too long')
    .optional()
    .default(''),
});

/**
 * Gallery image schema
 */
export const galleryImageSchema = z.object({
  url: z.string().url('Invalid URL').or(z.literal('')),
  path: z.string().max(500, 'Path too long'),
});

/**
 * Shipping size enum
 */
export const shippingSizeEnum = z.enum(['small', 'medium', 'large', 'oversized']);

/**
 * Product type enum
 */
export const productTypeEnum = z.enum(['original', 'print']);

/**
 * Product creation schema
 */
export const createProductSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .transform(val => val.trim()),

  description: z.string()
    .max(5000, 'Description too long')
    .nullable()
    .optional(),

  price: z.number()
    .int('Price must be an integer (in øre)')
    .min(100, 'Price must be at least 1 kr')
    .max(100000000, 'Price exceeds maximum (1,000,000 kr)'),

  image_url: z.string()
    .max(2000, 'Image URL too long')
    .optional()
    .default(''),

  image_path: z.string()
    .max(500, 'Image path too long')
    .optional()
    .default(''),

  product_type: productTypeEnum
    .optional()
    .default('original'),

  stock_quantity: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock exceeds maximum')
    .nullable()
    .optional()
    .default(1),

  collection_id: z.string()
    .regex(uuidRegex, 'Invalid collection ID')
    .nullable()
    .optional(),

  is_available: z.boolean()
    .optional()
    .default(true),

  is_featured: z.boolean()
    .optional()
    .default(false),

  sizes: z.array(productSizeSchema)
    .max(20, 'Too many sizes')
    .optional()
    .default([]),

  gallery_images: z.array(galleryImageSchema)
    .max(20, 'Too many gallery images')
    .optional()
    .default([]),

  shipping_cost: z.number()
    .int('Shipping cost must be an integer')
    .min(0, 'Shipping cost cannot be negative')
    .max(10000000, 'Shipping cost exceeds maximum')
    .nullable()
    .optional(),

  shipping_size: shippingSizeEnum
    .nullable()
    .optional(),

  requires_inquiry: z.boolean()
    .optional()
    .default(false),

  year: z.number()
    .int('Year must be an integer')
    .min(1900, 'Year too early')
    .max(new Date().getFullYear() + 1, 'Year cannot be in future')
    .nullable()
    .optional(),

  sku: z.string()
    .max(50, 'SKU too long')
    .nullable()
    .optional(),
});

/**
 * Product update schema (all fields optional except explicit ones)
 */
export const updateProductSchema = createProductSchema.partial().extend({
  // ID is required for updates
  id: z.string()
    .regex(uuidRegex, 'Invalid product ID')
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Validate product creation data
 */
export function validateCreateProduct(data: unknown): {
  success: true;
  data: CreateProductInput;
} | {
  success: false;
  error: string;
  details?: z.ZodError['issues'];
} {
  const result = createProductSchema.safeParse(data);

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

/**
 * Validate product update data
 */
export function validateUpdateProduct(data: unknown): {
  success: true;
  data: UpdateProductInput;
} | {
  success: false;
  error: string;
  details?: z.ZodError['issues'];
} {
  const result = updateProductSchema.safeParse(data);

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
