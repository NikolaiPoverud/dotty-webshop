import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

interface ReorderItem {
  id: string;
  display_order: number;
}

function isValidReorderItem(item: unknown): item is ReorderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as ReorderItem).id === 'string' &&
    typeof (item as ReorderItem).display_order === 'number'
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 });
    }

    if (!products.every(isValidReorderItem)) {
      return NextResponse.json({ error: 'Each product must have id and display_order' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const results = await Promise.all(
      products.map((item) =>
        supabase
          .from('products')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
      )
    );

    const hasErrors = results.some((r) => r.error);
    if (hasErrors) {
      console.error('Reorder errors:', results.filter((r) => r.error));
      return NextResponse.json({ error: 'Failed to update some products' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
  }
}
