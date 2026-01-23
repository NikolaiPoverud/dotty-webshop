import { NextResponse } from 'next/server';
import { generateCheckoutToken } from '@/lib/checkout-token';

export async function GET(): Promise<NextResponse> {
  try {
    const token = generateCheckoutToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Failed to generate checkout token:', error);
    return NextResponse.json({ error: 'Failed to initialize checkout session' }, { status: 500 });
  }
}
