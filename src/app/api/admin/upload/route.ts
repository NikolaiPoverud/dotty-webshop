import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

// SEC-005: Magic byte signatures for image validation
const IMAGE_SIGNATURES: { type: string; ext: string; bytes: number[]; offset?: number }[] = [
  { type: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { type: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { type: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header (WebP also has WEBP at offset 8)
];

// Validate file content matches image magic bytes
function validateImageMagicBytes(buffer: Uint8Array): { valid: boolean; type: string; ext: string } | null {
  for (const sig of IMAGE_SIGNATURES) {
    const offset = sig.offset || 0;
    if (buffer.length < offset + sig.bytes.length) continue;

    const matches = sig.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (matches) {
      // Extra validation for WebP: check for "WEBP" at offset 8
      if (sig.type === 'image/webp') {
        if (buffer.length < 12) continue;
        const webpMarker = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
        const hasWebp = webpMarker.every((byte, i) => buffer[8 + i] === byte);
        if (!hasWebp) continue;
      }
      return { valid: true, type: sig.type, ext: sig.ext };
    }
  }
  return null;
}

// POST /api/admin/upload - Upload image to Supabase storage
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('No file provided in upload request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file size first (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size: 10MB' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer for validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // SEC-005: Validate actual file content via magic bytes (not just MIME type)
    const imageValidation = validateImageMagicBytes(buffer);
    if (!imageValidation) {
      console.warn('Magic byte validation failed for file:', file.name);
      return NextResponse.json(
        { error: 'Invalid file type. File must be a valid JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      );
    }

    // Use the detected type and extension (ignore user-provided values which can be spoofed)
    const detectedType = imageValidation.type;
    const detectedExt = imageValidation.ext;

    // Generate unique filename with validated extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomId}.${detectedExt}`;
    const path = `products/${filename}`;

    // Upload to Supabase storage with detected content type
    const { error: uploadError } = await supabase.storage
      .from('artwork')
      .upload(path, buffer, {
        contentType: detectedType,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('File uploaded successfully to:', path);

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
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'No path provided' },
        { status: 400 }
      );
    }

    // SEC-006: Validate path to prevent traversal attacks
    const normalizedPath = String(path).trim();
    if (
      !normalizedPath.startsWith('products/') ||
      normalizedPath.includes('..') ||
      normalizedPath.includes('//') ||
      !/^products\/[\w\-]+\.\w+$/.test(normalizedPath)
    ) {
      return NextResponse.json(
        { error: 'Invalid file path' },
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
