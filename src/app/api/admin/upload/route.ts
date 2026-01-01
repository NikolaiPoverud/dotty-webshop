import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/upload - Upload image to Supabase storage
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size: 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomId}.${ext}`;
    const path = `products/${filename}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('artwork')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('artwork')
      .getPublicUrl(path);

    return NextResponse.json({
      data: {
        path,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/upload - Delete image from storage
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'No path provided' },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage
      .from('artwork')
      .remove([path]);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
