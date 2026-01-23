import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_SIGNATURES = [
  { type: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { type: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },
] as const;

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50]; // "WEBP" at offset 8

function validateImageMagicBytes(buffer: Uint8Array): { type: string; ext: string } | null {
  for (const sig of IMAGE_SIGNATURES) {
    if (buffer.length < sig.bytes.length) continue;

    const matches = sig.bytes.every((byte, i) => buffer[i] === byte);
    if (!matches) continue;

    // WebP requires additional validation for "WEBP" marker at offset 8
    if (sig.type === 'image/webp') {
      if (buffer.length < 12) continue;
      const hasWebpMarker = WEBP_MARKER.every((byte, i) => buffer[8 + i] === byte);
      if (!hasWebpMarker) continue;
    }

    return { type: sig.type, ext: sig.ext };
  }
  return null;
}

function generateFilename(ext: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `products/${timestamp}-${randomId}.${ext}`;
}

function isValidProductPath(path: string): boolean {
  const normalized = String(path).trim();
  return (
    normalized.startsWith('products/') &&
    !normalized.includes('..') &&
    !normalized.includes('//') &&
    // Only allow ASCII alphanumeric, hyphens in filename, and common image extensions
    /^products\/[a-zA-Z0-9\-]+\.[a-zA-Z0-9]+$/.test(normalized)
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max size: 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const validation = validateImageMagicBytes(buffer);
    if (!validation) {
      // Log first bytes for debugging
      const firstBytes = Array.from(buffer.slice(0, 16))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      console.warn('Magic byte validation failed for file:', file.name, 'First bytes:', firstBytes);
      return NextResponse.json(
        { error: `Invalid file type. Expected JPEG, PNG, WebP, or GIF. Got: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }

    const path = generateFilename(validation.ext);
    const supabase = createAdminClient();

    const { error: uploadError } = await supabase.storage
      .from('artwork')
      .upload(path, buffer, {
        contentType: validation.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('artwork').getPublicUrl(path);

    return NextResponse.json({
      data: { path, url: urlData.publicUrl },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 });
    }

    if (!isValidProductPath(path)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.storage.from('artwork').remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
