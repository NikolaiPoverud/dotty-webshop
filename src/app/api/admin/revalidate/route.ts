import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

/**
 * POST /api/admin/revalidate
 *
 * Manually trigger cache revalidation for all public pages.
 * Useful when data isn't appearing after updates.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    // Revalidate all main pages
    const paths = [
      '/no',
      '/en',
      '/no/shop',
      '/en/shop',
      '/no/solgt',
      '/en/sold',
    ];

    for (const path of paths) {
      revalidatePath(path);
    }

    // Also revalidate layouts
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Cache revalidated',
      paths,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}
