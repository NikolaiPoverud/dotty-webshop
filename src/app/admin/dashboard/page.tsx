'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// Placeholder stats - replace with real data from Supabase
const stats = [
  {
    label: 'Salg denne måneden',
    value: 4250000, // 42,500 kr
    format: 'currency',
    icon: TrendingUp,
    change: '+12%',
  },
  {
    label: 'Ordrer denne måneden',
    value: 8,
    format: 'number',
    icon: ShoppingCart,
    change: '+3',
  },
  {
    label: 'Produkter',
    value: 24,
    format: 'number',
    icon: Package,
    change: '6 tilgjengelig',
  },
  {
    label: 'Nyhetsbrev-abonnenter',
    value: 156,
    format: 'number',
    icon: Users,
    change: '+28 denne måneden',
  },
];

const recentOrders = [
  {
    id: 'DOT-ABC123',
    customer: 'Kari Nordmann',
    total: 350000,
    status: 'paid',
    date: '2 timer siden',
  },
  {
    id: 'DOT-DEF456',
    customer: 'Ola Hansen',
    total: 150000,
    status: 'shipped',
    date: '1 dag siden',
  },
  {
    id: 'DOT-GHI789',
    customer: 'Lisa Berg',
    total: 450000,
    status: 'delivered',
    date: '3 dager siden',
  },
];

const topProducts = [
  { title: 'Neon Dreams', sold: 3, revenue: 1050000 },
  { title: 'Pink Explosion', sold: 5, revenue: 750000 },
  { title: 'Urban Pop', sold: 2, revenue: 900000 },
];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  shipped: 'bg-accent/10 text-accent',
  delivered: 'bg-muted-foreground/10 text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pending: 'Venter',
  paid: 'Betalt',
  shipped: 'Sendt',
  delivered: 'Levert',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Oversikt over butikken din</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-success">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold">
                {stat.format === 'currency'
                  ? formatPrice(stat.value)
                  : stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-muted rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">Nylige ordrer</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.id} · {order.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(order.total)}</p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-muted rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">Toppprodukter</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.title}
                className="flex items-center gap-4 py-3 border-b border-border last:border-0"
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sold} solgt
                  </p>
                </div>
                <p className="font-medium">{formatPrice(product.revenue)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
