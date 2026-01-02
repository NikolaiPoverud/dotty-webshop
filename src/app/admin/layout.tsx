import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

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
