import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // SEC-010: Use exact match instead of ilike to prevent wildcard injection
    // Normalize to uppercase for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();

    const { data: discount, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .is('deleted_at', null)  // Exclude soft-deleted codes
      .single();

    if (error || !discount) {
      return NextResponse.json(
        { error: 'Invalid discount code', valid: false },
        { status: 404 }
      );
    }

    // Check if active
    if (!discount.is_active) {
      return NextResponse.json(
        { error: 'This discount code is no longer active', valid: false },
        { status: 400 }
      );
    }

    // Check if expired
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This discount code has expired', valid: false },
        { status: 400 }
      );
    }

    // Check uses remaining
    if (discount.uses_remaining !== null && discount.uses_remaining <= 0) {
      return NextResponse.json(
        { error: 'This discount code has been fully redeemed', valid: false },
        { status: 400 }
      );
    }

    // Calculate discount amount
    const effectiveSubtotal = subtotal || 0;
    const discountAmount = discount.discount_percent
      ? Math.round(effectiveSubtotal * (discount.discount_percent / 100))
      : Math.min(discount.discount_amount || 0, effectiveSubtotal);

    return NextResponse.json({
      valid: true,
      code: discount.code,
      discount_percent: discount.discount_percent,
      discount_amount: discount.discount_amount,
      calculated_discount: discountAmount,
    });
  } catch (error) {
    console.error('Failed to validate discount code:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code', valid: false },
      { status: 500 }
    );
  }
}
