import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

// Force dynamic rendering to ensure auth is checked on every request
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutWrapper sidebar={<AdminSidebar />}>
      {children}
    </AdminLayoutWrapper>
  );
}
