'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Eye, ShoppingCart, TrendingUp, Users } from 'lucide-react';

interface PopularProduct {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  views: number;
  cart_adds: number;
  purchases: number;
}

interface AnalyticsSummary {
  today: { visitors: number; product_views: number; cart_adds: number };
  week: { visitors: number; product_views: number; cart_adds: number };
  month: { visitors: number; product_views: number; cart_adds: number };
  popular_products: PopularProduct[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  subValue,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  subValue?: string;
}): React.ReactElement {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );
}

export function AnalyticsDashboard(): React.ReactElement {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    async function fetchAnalytics(): Promise<void> {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-background border border-border rounded-lg p-6">
        <p className="text-muted-foreground text-center">Kunne ikke laste statistikk</p>
      </div>
    );
  }

  const stats = data[period];

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Statistikk
        </h2>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                period === p
                  ? 'bg-primary text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'today' ? 'I dag' : p === 'week' ? 'Uke' : 'Måned'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Besøkende"
          value={stats.visitors}
          icon={Users}
          subValue="Unike besøk"
        />
        <StatCard
          label="Produktvisninger"
          value={stats.product_views}
          icon={Eye}
          subValue="Klikk på kunstverk"
        />
        <StatCard
          label="Lagt i handlekurv"
          value={stats.cart_adds}
          icon={ShoppingCart}
          subValue="Produkter lagt til"
        />
      </div>

      {data.popular_products.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Mest populære kunstverk</h3>
          <div className="space-y-2">
            {data.popular_products.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-bold text-muted-foreground w-5">
                  {index + 1}.
                </span>
                {product.image_url && (
                  <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.views} visninger · {product.cart_adds} i handlekurv
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.popular_products.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Ingen data ennå. Statistikk vises når folk besøker butikken.
        </p>
      )}
    </div>
  );
}
