/**
 * Input validation utilities for API routes
 * Simple runtime validation without external dependencies
 */

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: (string | number)[];
  };
}

export function validate<T extends Record<string, unknown>>(
  data: unknown,
  schema: ValidationSchema,
): ValidationResult<T> {
  if (typeof data !== 'object' || data === null) {
    return { success: false, error: 'Invalid input: expected an object' };
  }

  const input = data as Record<string, unknown>;
  const validated: Record<string, unknown> = {};
  const allowedKeys = Object.keys(schema);

  // Check for required fields and validate types
  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      return { success: false, error: `Missing required field: ${key}` };
    }

    // Skip validation if not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type check
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      return { success: false, error: `Invalid type for ${key}: expected ${rules.type}, got ${actualType}` };
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return { success: false, error: `${key} must be at least ${rules.minLength} characters` };
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return { success: false, error: `${key} must be at most ${rules.maxLength} characters` };
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return { success: false, error: `${key} has invalid format` };
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return { success: false, error: `${key} must be at least ${rules.min}` };
      }
      if (rules.max !== undefined && value > rules.max) {
        return { success: false, error: `${key} must be at most ${rules.max}` };
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value as string | number)) {
      return { success: false, error: `${key} must be one of: ${rules.enum.join(', ')}` };
    }

    validated[key] = value;
  }

  // Only allow fields defined in schema (prevent injection of extra fields)
  for (const key of Object.keys(input)) {
    if (!allowedKeys.includes(key)) {
      // Silently ignore unknown fields for forward compatibility
      continue;
    }
  }

  return { success: true, data: validated as T };
}

// Collection schema
export const collectionSchema: ValidationSchema = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  slug: { type: 'string', required: true, minLength: 1, maxLength: 100, pattern: /^[a-z0-9-]+$/ },
  description: { type: 'string', maxLength: 500 },
  display_order: { type: 'number', min: 0, max: 1000 },
  is_active: { type: 'boolean' },
};

// Discount code schema
export const discountSchema: ValidationSchema = {
  code: { type: 'string', required: true, minLength: 2, maxLength: 50, pattern: /^[A-Z0-9_-]+$/i },
  discount_type: { type: 'string', required: true, enum: ['percent', 'fixed'] },
  discount_value: { type: 'number', required: true, min: 0, max: 100000 },
  min_order_amount: { type: 'number', min: 0 },
  max_uses: { type: 'number', min: 1 },
  valid_from: { type: 'string' },
  valid_until: { type: 'string' },
  is_active: { type: 'boolean' },
};

// Testimonial schema
export const testimonialSchema: ValidationSchema = {
  customer_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  customer_location: { type: 'string', maxLength: 100 },
  quote: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
  rating: { type: 'number', min: 1, max: 5 },
  display_order: { type: 'number', min: 0, max: 1000 },
  is_featured: { type: 'boolean' },
};

// UUID validation pattern
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}
