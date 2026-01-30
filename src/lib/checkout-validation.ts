import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderItem } from '@/types';

export interface CartValidationResult {
  valid: boolean;
  error?: string;
  items?: OrderItem[];
  discountAmount?: number;
}

/**
 * Validates cart items server-side by checking database prices.
 * This prevents price manipulation attacks where clients send fake prices.
 */
export async function validateCartServerSide(
  clientItems: OrderItem[],
  discountCode?: string,
): Promise<CartValidationResult> {
  const supabase = createAdminClient();
  const productIds = clientItems.map(item => item.product_id);

  // Fetch actual product data from database
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price, is_available, stock_quantity, product_type, image_url')
    .in('id', productIds)
    .is('deleted_at', null);

  if (productsError) {
    console.error('Failed to fetch products for validation:', productsError);
    return { valid: false, error: 'Failed to validate cart items' };
  }

  if (!products || products.length !== productIds.length) {
    return { valid: false, error: 'One or more products not found' };
  }

  // Create a map for easy lookup
  const productMap = new Map(products.map(p => [p.id, p]));

  // Validate each item and build validated items list
  const validatedItems: OrderItem[] = [];

  for (const clientItem of clientItems) {
    const dbProduct = productMap.get(clientItem.product_id);

    if (!dbProduct) {
      return { valid: false, error: `Product ${clientItem.product_id} not found` };
    }

    if (!dbProduct.is_available) {
      return { valid: false, error: `${dbProduct.title} is no longer available` };
    }

    // Check stock for prints
    if (dbProduct.product_type === 'print' && dbProduct.stock_quantity !== null) {
      if (dbProduct.stock_quantity < clientItem.quantity) {
        return {
          valid: false,
          error: `Not enough stock for ${dbProduct.title}. Available: ${dbProduct.stock_quantity}`,
        };
      }
    }

    // Build validated item with server prices
    validatedItems.push({
      product_id: dbProduct.id,
      title: dbProduct.title,
      price: dbProduct.price, // Use database price, not client price
      quantity: clientItem.quantity,
      image_url: dbProduct.image_url,
    });
  }

  // Validate and calculate discount if provided
  let discountAmount = 0;

  if (discountCode) {
    const normalizedCode = discountCode.toUpperCase();

    const { data: discount, error: discountError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // Check if code has remaining uses
    if (discount.uses_remaining !== null && discount.uses_remaining <= 0) {
      return { valid: false, error: 'Discount code has been used up' };
    }

    // Check expiration
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return { valid: false, error: 'Discount code has expired' };
    }

    // Calculate discount amount
    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (discount.discount_percent) {
      discountAmount = Math.floor(subtotal * (discount.discount_percent / 100));
    } else if (discount.discount_amount) {
      discountAmount = discount.discount_amount;
    }
  }

  return {
    valid: true,
    items: validatedItems,
    discountAmount,
  };
}

/**
 * Calculate artist levy (5% on artwork over 2,500 NOK)
 */
export function calculateArtistLevy(subtotal: number): number {
  return subtotal >= 250000 ? Math.floor(subtotal * 0.05) : 0;
}
