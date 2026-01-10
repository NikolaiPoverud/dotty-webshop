import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactNode> {
  return (
    <AdminLayoutWrapper sidebar={<AdminSidebar />}>
      {children}
    </AdminLayoutWrapper>
  );
}
