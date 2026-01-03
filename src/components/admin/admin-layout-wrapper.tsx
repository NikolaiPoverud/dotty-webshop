'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { ToastProvider } from './toast';

interface AdminLayoutWrapperProps {
  children: ReactNode;
  sidebar: ReactNode;
}

// Pages that should not show the admin sidebar
const publicAdminPages = ['/admin/login', '/admin/reset-password'];

export function AdminLayoutWrapper({ children, sidebar }: AdminLayoutWrapperProps) {
  const pathname = usePathname();

  // Don't show sidebar on login/reset-password pages
  const isPublicPage = publicAdminPages.some(page => pathname === page || pathname?.startsWith(`${page}/`));

  if (isPublicPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex">
        {sidebar}
        <main className="flex-1 min-h-screen overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
