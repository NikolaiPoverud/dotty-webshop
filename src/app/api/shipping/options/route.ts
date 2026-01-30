import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ShippingOption } from '@/lib/bring';

// TEMPORARY: Flat fee shipping - restore Bring API integration when ready
const FLAT_SHIPPING_FEE = 9900; // 99 NOK in øre

const ShippingRequestSchema = z.object({
  postalCode: z.string().length(4, 'Postal code must be 4 digits'),
  countryCode: z.string().length(2).default('NO'),
  totalWeightGrams: z.number().positive().optional(),
  locale: z.enum(['no', 'en']).default('no'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = ShippingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { locale } = parsed.data;
  const flatFeeOption = getFlatFeeShippingOption(locale);

  return NextResponse.json({ success: true, data: [flatFeeOption] });
}

function getFlatFeeShippingOption(locale: 'no' | 'en'): ShippingOption {
  const isNorwegian = locale === 'no';

  return {
    id: 'FLAT_FEE',
    name: isNorwegian ? 'Standardfrakt' : 'Standard Shipping',
    description: isNorwegian
      ? 'Leveres til valgt adresse eller hentested'
      : 'Delivered to your address or pickup point',
    deliveryType: 'pickup',
    estimatedDelivery: isNorwegian ? '2-5 virkedager' : '2-5 business days',
    workingDays: 4,
    priceWithVat: FLAT_SHIPPING_FEE,
    priceWithoutVat: Math.round(FLAT_SHIPPING_FEE * 0.8), // 20% VAT
  };
}
