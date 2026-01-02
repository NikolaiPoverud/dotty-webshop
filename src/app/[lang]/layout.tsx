import type { Locale, Collection } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CookieConsent } from '@/components/gdpr/cookie-consent';
import { PasswordGate } from '@/components/auth/password-gate';
import { createClient } from '@/lib/supabase/server';

// Disable caching to always fetch fresh collections for header
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

async function getCollections(): Promise<Collection[]> {
  try {
    const supabase = await createClient();
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch collections:', error);
      return [];
    }

    return collections || [];
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const collections = await getCollections();

  return (
    <PasswordGate>
      <div className="min-h-screen flex flex-col" lang={locale}>
        <Header lang={locale} collections={collections} />
        <main className="flex-1">{children}</main>
        <Footer lang={locale} />
        <CookieConsent lang={locale} />
      </div>
    </PasswordGate>
  );
}
