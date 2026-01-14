import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getShippingOptionsForCart, isValidNorwegianPostalCode } from '@/lib/bring';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';
import type { ShippingOption } from '@/lib/bring';

// Rate limit: 30 requests per minute per IP
const RATE_LIMIT = { maxRequests: 30, windowMs: 60000 };

const ShippingRequestSchema = z.object({
  postalCode: z.string().length(4, 'Postal code must be 4 digits'),
  countryCode: z.string().length(2).default('NO'),
  totalWeightGrams: z.number().positive().optional(),
  locale: z.enum(['no', 'en']).default('no'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`shipping:${clientIp}`, RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest('Invalid request body');
  }

  // Validate request
  const parsed = ShippingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errors.badRequest(parsed.error.issues[0].message);
  }

  const { postalCode, countryCode, totalWeightGrams, locale } = parsed.data;

  // Validate Norwegian postal codes
  if (countryCode === 'NO' && !isValidNorwegianPostalCode(postalCode)) {
    return errors.badRequest('Invalid Norwegian postal code');
  }

  try {
    const options = await getShippingOptionsForCart({
      toPostalCode: postalCode,
      toCountryCode: countryCode,
      totalWeightGrams,
      language: locale === 'en' ? 'EN' : 'NO',
    });

    return NextResponse.json(
      { success: true, data: options },
      { headers: getRateLimitHeaders(rateLimitResult) },
    );
  } catch (error) {
    console.error('Failed to fetch shipping options:', error);

    // Return fallback static options if Bring API fails
    const fallbackOptions = getFallbackShippingOptions(locale);
    return NextResponse.json(
      { success: true, data: fallbackOptions },
      {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          'X-Shipping-Fallback': 'true',
        },
      },
    );
  }
}

/**
 * Fallback shipping options when Bring API is unavailable
 * These are approximate prices for Norwegian domestic shipping
 */
function getFallbackShippingOptions(locale: 'no' | 'en'): ShippingOption[] {
  const isNorwegian = locale === 'no';

  return [
    {
      id: 'SERVICEPAKKE',
      name: isNorwegian ? 'Hentested' : 'Pickup Point',
      description: isNorwegian
        ? 'Hent pakken på nærmeste post i butikk eller pakkeboks'
        : 'Pick up at your nearest store or parcel locker',
      deliveryType: 'pickup',
      estimatedDelivery: isNorwegian ? '2-4 virkedager' : '2-4 business days',
      workingDays: 3,
      priceWithVat: 9900, // 99 NOK
      priceWithoutVat: 7920,
    },
    {
      id: '5800',
      name: isNorwegian ? 'Pakke til hentested' : 'Parcel to Pickup',
      description: isNorwegian
        ? 'Pakken leveres til valgt hentested'
        : 'Package delivered to selected pickup point',
      deliveryType: 'pickup',
      estimatedDelivery: isNorwegian ? '2-4 virkedager' : '2-4 business days',
      workingDays: 3,
      priceWithVat: 11900, // 119 NOK
      priceWithoutVat: 9520,
    },
    {
      id: '5600',
      name: isNorwegian ? 'Hjemlevering' : 'Home Delivery',
      description: isNorwegian
        ? 'Pakken leveres hjem til deg'
        : 'Package delivered to your door',
      deliveryType: 'home_delivery',
      estimatedDelivery: isNorwegian ? '2-5 virkedager' : '2-5 business days',
      workingDays: 4,
      priceWithVat: 19900, // 199 NOK
      priceWithoutVat: 15920,
    },
  ];
}
