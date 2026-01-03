import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

// Force dynamic rendering to ensure auth is checked on every request
export const dynamic = 'force-dynamic';

async function getUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Not needed for just reading auth state
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current path from headers
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';

  // Also check referer as fallback
  const referer = headersList.get('referer') || '';
  const isLoginPage = pathname.includes('/admin/login') ||
                      pathname.includes('/admin/reset-password') ||
                      referer.includes('/admin/login') ||
                      referer.includes('/admin/reset-password');

  // For login/reset pages, render without the admin layout wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For other admin pages, verify the user is logged in
  const user = await getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <AdminLayoutWrapper sidebar={<AdminSidebar />}>
      {children}
    </AdminLayoutWrapper>
  );
}
