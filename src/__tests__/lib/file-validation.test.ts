import { describe, it, expect } from 'vitest'

interface ImageSignature {
  type: string
  ext: string
  bytes: number[]
  offset?: number
}

const IMAGE_SIGNATURES: ImageSignature[] = [
  { type: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { type: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

function validateImageMagicBytes(buffer: Uint8Array): { valid: boolean; type: string; ext: string } | null {
  for (const sig of IMAGE_SIGNATURES) {
    const offset = sig.offset ?? 0
    if (buffer.length < offset + sig.bytes.length) continue

    const matches = sig.bytes.every((byte, i) => buffer[offset + i] === byte)
    if (!matches) continue

    if (sig.type === 'image/webp') {
      if (buffer.length < 12) continue
      const webpMarker = [0x57, 0x45, 0x42, 0x50]
      const hasWebp = webpMarker.every((byte, i) => buffer[8 + i] === byte)
      if (!hasWebp) continue
    }

    return { valid: true, type: sig.type, ext: sig.ext }
  }
  return null
}

describe('File Magic Byte Validation', () => {
  describe('validateImageMagicBytes', () => {
    const validImages = [
      { name: 'JPEG', bytes: [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10], expected: { type: 'image/jpeg', ext: 'jpg' } },
      { name: 'PNG', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], expected: { type: 'image/png', ext: 'png' } },
      { name: 'GIF', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], expected: { type: 'image/gif', ext: 'gif' } },
      {
        name: 'WebP',
        bytes: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
        expected: { type: 'image/webp', ext: 'webp' },
      },
    ]

    it.each(validImages)('should detect $name files', ({ bytes, expected }) => {
      const result = validateImageMagicBytes(new Uint8Array(bytes))

      expect(result).not.toBeNull()
      expect(result?.type).toBe(expected.type)
      expect(result?.ext).toBe(expected.ext)
    })

    const invalidFiles = [
      { name: 'invalid bytes', bytes: [0x00, 0x00, 0x00, 0x00] },
      { name: 'text files pretending to be images', bytes: [0x48, 0x54, 0x4D, 0x4C] },
      { name: 'executable files', bytes: [0x4D, 0x5A] },
      { name: 'empty files', bytes: [] as number[] },
      { name: 'truncated JPEG header', bytes: [0xFF, 0xD8] },
      { name: 'RIFF without WEBP marker (WAV)', bytes: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45] },
    ]

    it.each(invalidFiles)('should reject $name', ({ bytes }) => {
      const result = validateImageMagicBytes(new Uint8Array(bytes))
      expect(result).toBeNull()
    })
  })
})
