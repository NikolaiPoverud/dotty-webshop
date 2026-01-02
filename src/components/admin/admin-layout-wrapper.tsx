'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { ToastProvider } from './toast';

interface AdminLayoutWrapperProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function AdminLayoutWrapper({ children, sidebar }: AdminLayoutWrapperProps) {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex">
        {sidebar}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
