import { NextResponse } from 'next/server';
import { generateCheckoutToken } from '@/lib/checkout-token';

/**
 * Generate a checkout token for the client
 * This token must be included in payment initiation requests
 * to prove the request originated from a legitimate checkout session
 */
export async function GET(): Promise<NextResponse> {
  const token = generateCheckoutToken();

  return NextResponse.json({ token });
}
