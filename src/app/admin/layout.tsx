'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  FolderOpen,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produkter', icon: Package },
  { href: '/admin/collections', label: 'Samlinger', icon: FolderOpen },
  { href: '/admin/orders', label: 'Ordrer', icon: ShoppingCart },
  { href: '/admin/discounts', label: 'Rabattkoder', icon: Tag },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-muted border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/admin/dashboard" className="text-xl font-bold">
            <span className="text-primary">Dotty</span>
            <span>.</span>
            <span className="text-sm font-normal text-muted-foreground ml-2">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-background'
                    : 'hover:bg-muted-foreground/10'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link
            href="/no"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted-foreground/10 transition-colors text-muted-foreground"
          >
            <LogOut className="w-5 h-5" />
            <span>Tilbake til butikk</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
