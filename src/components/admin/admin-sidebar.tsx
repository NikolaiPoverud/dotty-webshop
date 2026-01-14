'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  FileImage,
  FileText,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  Mail,
  MessageSquareQuote,
  Package,
  Send,
  Shield,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react';

import { adminFetch } from '@/lib/admin-fetch';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/admin/user-menu';

const THROTTLE_MS = 30000;
const POLL_INTERVAL_MS = 60000;

const navItems = [
  { href: '/admin/dashboard', label: 'Oversikt', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Ordre', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produkter', icon: Package },
  { href: '/admin/collections', label: 'Samlinger', icon: FolderOpen },
  { href: '/admin/customers', label: 'Kunder', icon: Users },
  { href: '/admin/contact', label: 'Meldinger', icon: Mail },
  { href: '/admin/discounts', label: 'Rabattkoder', icon: Tag },
  { href: '/admin/testimonials', label: 'Tilbakemeldinger', icon: MessageSquareQuote },
  { href: '/admin/email-test', label: 'Test e-post', icon: Send },
  { href: '/admin/pdf-converter', label: 'PDF til PNG', icon: FileImage },
  { href: '/admin/webp-converter', label: 'WebP Converter', icon: ImageIcon },
  { href: '/admin/gdpr', label: 'Personvern', icon: Shield },
  { href: '/admin/audit-log', label: 'Aktivitetslogg', icon: FileText },
];

export function AdminSidebar(): React.ReactNode {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastFetchRef = useRef<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    const now = Date.now();
    const isThrottled = now - lastFetchRef.current < THROTTLE_MS;
    if (isThrottled) return;

    lastFetchRef.current = now;

    try {
      const response = await adminFetch('/api/admin/contact/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }

    const interval = setInterval(handleVisibilityChange, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  function isActiveRoute(href: string): boolean {
    return pathname === href || pathname?.startsWith(`${href}/`) || false;
  }

  function formatBadgeCount(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  return (
    <aside className="w-64 min-w-64 h-screen sticky top-0 bg-muted border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/admin/dashboard" className="text-xl font-bold">
          <span className="text-primary">Dotty</span>
          <span>.</span>
          <span className="text-sm font-normal text-muted-foreground ml-2">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);
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
                <span
                  className={cn(
                    'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full',
                    isActive ? 'bg-background text-primary' : 'bg-primary text-background'
                  )}
                >
                  {formatBadgeCount(unreadCount)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <Link
          href="/no"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted-foreground/10 transition-colors text-muted-foreground"
        >
          <ExternalLink className="w-5 h-5" />
          <span>Se shop</span>
        </Link>

        <div className="pt-3 border-t border-border">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}
