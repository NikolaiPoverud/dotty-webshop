import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
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

  return (
    <div className="min-h-screen flex flex-col" lang={locale}>
      <Header lang={locale} />
      <main className="flex-1">{children}</main>
      <Footer lang={locale} />
    </div>
  );
}
