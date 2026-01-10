'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { ToastProvider } from './toast';

interface Props {
  children: ReactNode;
  sidebar: ReactNode;
}

const PUBLIC_ADMIN_PAGES = ['/admin/login', '/admin/reset-password'];

function isPublicAdminPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_ADMIN_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );
}

export function AdminLayoutWrapper({ children, sidebar }: Props): ReactNode {
  const pathname = usePathname();

  if (isPublicAdminPage(pathname)) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        {sidebar}
        <main className="min-h-screen flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
