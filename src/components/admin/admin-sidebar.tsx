'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  FolderOpen,
  ExternalLink,
  MessageSquareQuote,
  Mail,
  Shield,
  FileText,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/admin/user-menu';

const navItems = [
  { href: '/admin/dashboard', label: 'Oversikt', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Ordrer', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produkter', icon: Package },
  { href: '/admin/collections', label: 'Samlinger', icon: FolderOpen },
  { href: '/admin/contact', label: 'Meldinger', icon: Mail },
  { href: '/admin/discounts', label: 'Rabattkoder', icon: Tag },
  { href: '/admin/testimonials', label: 'Tilbakemeldinger', icon: MessageSquareQuote },
  { href: '/admin/email-test', label: 'Test e-post', icon: Send },
  { href: '/admin/gdpr', label: 'Personvern', icon: Shield },
  { href: '/admin/audit-log', label: 'Aktivitetslogg', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/admin/contact/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
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
          const showBadge = item.href === '/admin/contact' && unreadCount > 0;

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
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className={cn(
                  'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full',
                  isActive ? 'bg-background text-primary' : 'bg-primary text-background'
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* View Shop Link */}
        <Link
          href="/no"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted-foreground/10 transition-colors text-muted-foreground"
        >
          <ExternalLink className="w-5 h-5" />
          <span>Se shop</span>
        </Link>

        {/* User Menu */}
        <div className="pt-3 border-t border-border">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}
