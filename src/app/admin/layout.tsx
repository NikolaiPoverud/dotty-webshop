import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

export const dynamic = 'force-dynamic';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps): React.ReactNode {
  return (
    <AdminLayoutWrapper sidebar={<AdminSidebar />}>
      {children}
    </AdminLayoutWrapper>
  );
}
