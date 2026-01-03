import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

// Force dynamic rendering to ensure auth is checked on every request
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The AdminLayoutWrapper (client component) handles:
  // - Showing/hiding sidebar based on pathname
  // The middleware handles:
  // - Auth check and redirect to login
  // The login/reset-password pages have their own layouts

  return (
    <AdminLayoutWrapper sidebar={<AdminSidebar />}>
      {children}
    </AdminLayoutWrapper>
  );
}
