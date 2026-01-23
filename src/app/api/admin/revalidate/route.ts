import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

const REVALIDATION_PATHS = [
  '/no',
  '/en',
  '/no/shop',
  '/en/shop',
  '/no/solgt',
  '/en/sold',
] as const;

export async function POST(): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    for (const path of REVALIDATION_PATHS) {
      revalidatePath(path);
    }
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Cache revalidated',
      paths: REVALIDATION_PATHS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ error: 'Failed to revalidate cache' }, { status: 500 });
  }
}
