import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Test environment variables
Object.assign(process.env, {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  STRIPE_SECRET_KEY: 'sk_test_123',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
  RESEND_API_KEY: 're_test_123',
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}))
