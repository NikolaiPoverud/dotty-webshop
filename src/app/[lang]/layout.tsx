import type { Locale, Collection } from '@/types';
import { locales, getDictionary } from '@/lib/i18n/get-dictionary';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CookieConsent } from '@/components/gdpr/cookie-consent';
import { PasswordGate } from '@/components/auth/password-gate';
import { createPublicClient } from '@/lib/supabase/public';

// Revalidate every 5 minutes - collections change infrequently
export const revalidate = 300;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

async function getCollections(): Promise<Collection[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }

  return data ?? [];
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

  const [collections, dictionary] = await Promise.all([
    getCollections(),
    getDictionary(locale),
  ]);

  return (
    <PasswordGate>
      <div className="min-h-screen flex flex-col" lang={locale}>
        <Header lang={locale} collections={collections} />
        <main className="flex-1">{children}</main>
        <Footer lang={locale} collections={collections} dictionary={dictionary} />
        <CookieConsent lang={locale} dictionary={dictionary} />
      </div>
    </PasswordGate>
  );
}
