import { describe, it, expect } from 'vitest'

// Magic byte signatures for image validation (copied from upload route)
const IMAGE_SIGNATURES: { type: string; ext: string; bytes: number[]; offset?: number }[] = [
  { type: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { type: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

// Validate file content matches image magic bytes
function validateImageMagicBytes(buffer: Uint8Array): { valid: boolean; type: string; ext: string } | null {
  for (const sig of IMAGE_SIGNATURES) {
    const offset = sig.offset || 0
    if (buffer.length < offset + sig.bytes.length) continue

    const matches = sig.bytes.every((byte, i) => buffer[offset + i] === byte)
    if (matches) {
      // Extra validation for WebP: check for "WEBP" at offset 8
      if (sig.type === 'image/webp') {
        if (buffer.length < 12) continue
        const webpMarker = [0x57, 0x45, 0x42, 0x50] // "WEBP"
        const hasWebp = webpMarker.every((byte, i) => buffer[8 + i] === byte)
        if (!hasWebp) continue
      }
      return { valid: true, type: sig.type, ext: sig.ext }
    }
  }
  return null
}

describe('File Magic Byte Validation', () => {
  describe('validateImageMagicBytes', () => {
    it('should detect JPEG files', () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
      const result = validateImageMagicBytes(jpegBytes)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('image/jpeg')
      expect(result?.ext).toBe('jpg')
    })

    it('should detect PNG files', () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      const result = validateImageMagicBytes(pngBytes)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('image/png')
      expect(result?.ext).toBe('png')
    })

    it('should detect GIF files', () => {
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
      const result = validateImageMagicBytes(gifBytes)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('image/gif')
      expect(result?.ext).toBe('gif')
    })

    it('should detect WebP files', () => {
      // RIFF....WEBP format
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size (placeholder)
        0x57, 0x45, 0x42, 0x50, // WEBP
      ])
      const result = validateImageMagicBytes(webpBytes)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('image/webp')
      expect(result?.ext).toBe('webp')
    })

    it('should reject invalid files', () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      const result = validateImageMagicBytes(invalidBytes)

      expect(result).toBeNull()
    })

    it('should reject text files pretending to be images', () => {
      const textBytes = new Uint8Array([0x48, 0x54, 0x4D, 0x4C]) // "HTML"
      const result = validateImageMagicBytes(textBytes)

      expect(result).toBeNull()
    })

    it('should reject executable files', () => {
      const exeBytes = new Uint8Array([0x4D, 0x5A]) // MZ (Windows executable)
      const result = validateImageMagicBytes(exeBytes)

      expect(result).toBeNull()
    })

    it('should reject empty files', () => {
      const emptyBytes = new Uint8Array([])
      const result = validateImageMagicBytes(emptyBytes)

      expect(result).toBeNull()
    })

    it('should reject truncated JPEG header', () => {
      const truncatedJpeg = new Uint8Array([0xFF, 0xD8]) // Missing third byte
      const result = validateImageMagicBytes(truncatedJpeg)

      expect(result).toBeNull()
    })

    it('should reject RIFF without WEBP marker', () => {
      // RIFF file but not WebP (e.g., WAV audio)
      const riffBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size
        0x57, 0x41, 0x56, 0x45, // WAVE (not WEBP)
      ])
      const result = validateImageMagicBytes(riffBytes)

      expect(result).toBeNull()
    })
  })
})
