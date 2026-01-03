'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Cookie,
  Mail,
  Database,
  ShoppingCart,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  Trash2,
  Download,
  ExternalLink,
  Play,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-fetch';

interface GDPRStats {
  cookieConsent: {
    total: number;
    accepted: number;
    declined: number;
    acceptRate: number;
    last30Days: number;
  };
  newsletter: {
    total: number;
    confirmed: number;
    unconfirmed: number;
    unsubscribed: number;
    confirmRate: number;
    last30Days: number;
  };
  dataRequests: {
    total: number;
    pending: number;
    completed: number;
    exportRequests: number;
    deleteRequests: number;
    recent: Array<{
      id: string;
      email: string;
      request_type: string;
      status: string;
      created_at: string;
    }>;
  };
  orders: {
    total: number;
    withPrivacyConsent: number;
    withNewsletterOptIn: number;
    privacyConsentRate: number;
  };
  contacts: {
    total: number;
  };
  auditLog: {
    total: number;
    last30Days: number;
  };
  lastUpdated: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Shield;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    error: 'bg-red-500/10 text-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>+{trend.value} {trend.label}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

function ProgressBar({
  value,
  label,
  color = 'primary',
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-muted-foreground/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${
            color === 'primary' ? 'bg-primary' :
            color === 'success' ? 'bg-green-500' :
            color === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
      </div>
    </div>
  );
}

export default function GDPRDashboardPage() {
  const [stats, setStats] = useState<GDPRStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/admin/gdpr-stats');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const runDataRetentionCleanup = async () => {
    setIsRunningCleanup(true);
    setCleanupResult(null);
    try {
      const response = await adminFetch('/api/admin/data-cleanup', {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCleanupResult(result.message);
      fetchStats(); // Refresh stats after cleanup
    } catch (err) {
      setCleanupResult(`Feil: ${err instanceof Error ? err.message : 'Ukjent feil'}`);
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            GDPR Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overvåk GDPR-samsvar og databehandling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Oppdatert: {formatDate(stats.lastUpdated)}
          </span>
          <button
            onClick={fetchStats}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Cookie}
          title="Cookie-samtykke"
          value={`${stats.cookieConsent.acceptRate}%`}
          subtitle={`${stats.cookieConsent.accepted} godtatt av ${stats.cookieConsent.total}`}
          color="success"
          trend={{ value: stats.cookieConsent.last30Days, label: 'siste 30d' }}
        />
        <StatCard
          icon={Mail}
          title="Nyhetsbrev bekreftet"
          value={`${stats.newsletter.confirmRate}%`}
          subtitle={`${stats.newsletter.confirmed} av ${stats.newsletter.total} totalt`}
          color="primary"
          trend={{ value: stats.newsletter.last30Days, label: 'siste 30d' }}
        />
        <StatCard
          icon={Database}
          title="Data-forespørsler"
          value={stats.dataRequests.pending}
          subtitle={`${stats.dataRequests.completed} fullført totalt`}
          color={stats.dataRequests.pending > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={FileText}
          title="Revisjonslogger"
          value={stats.auditLog.total}
          subtitle="Siste 2 år lagret"
          color="primary"
          trend={{ value: stats.auditLog.last30Days, label: 'siste 30d' }}
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cookie Consent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Cookie-samtykke</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-green-500">{stats.cookieConsent.accepted}</p>
              <p className="text-xs text-muted-foreground">Godtatt</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-red-500">{stats.cookieConsent.declined}</p>
              <p className="text-xs text-muted-foreground">Avvist</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold">{stats.cookieConsent.total}</p>
              <p className="text-xs text-muted-foreground">Totalt</p>
            </div>
          </div>

          <ProgressBar
            value={stats.cookieConsent.acceptRate}
            label="Godkjenningsrate"
            color="success"
          />
        </motion.div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-muted rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Nyhetsbrev (Double Opt-In)</h2>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-green-500">{stats.newsletter.confirmed}</p>
              <p className="text-xs text-muted-foreground">Bekreftet</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-yellow-500">{stats.newsletter.unconfirmed}</p>
              <p className="text-xs text-muted-foreground">Venter</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-red-500">{stats.newsletter.unsubscribed}</p>
              <p className="text-xs text-muted-foreground">Avmeldt</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold">{stats.newsletter.total}</p>
              <p className="text-xs text-muted-foreground">Totalt</p>
            </div>
          </div>

          <ProgressBar
            value={stats.newsletter.confirmRate}
            label="Bekreftelsesrate"
            color="primary"
          />
        </motion.div>

        {/* Data Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-muted rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Data-forespørsler</h2>
            </div>
            {stats.dataRequests.pending > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs">
                <AlertCircle className="w-3 h-3" />
                {stats.dataRequests.pending} venter
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.dataRequests.exportRequests}</p>
                <p className="text-xs text-muted-foreground">Eksport</p>
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.dataRequests.deleteRequests}</p>
                <p className="text-xs text-muted-foreground">Sletting</p>
              </div>
            </div>
          </div>

          {stats.dataRequests.recent.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Nylige forespørsler:</p>
              <div className="space-y-2">
                {stats.dataRequests.recent.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-2 bg-background rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {req.request_type === 'export' ? (
                        <Download className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                      <span className="truncate max-w-[150px]">{req.email}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        req.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : req.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                      }`}
                    >
                      {req.status === 'completed' ? 'Fullført' : req.status === 'pending' ? 'Venter' : req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Orders & Consent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-muted rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Ordresamtykke</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold">{stats.orders.total}</p>
              <p className="text-xs text-muted-foreground">Totalt</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-green-500">{stats.orders.withPrivacyConsent}</p>
              <p className="text-xs text-muted-foreground">Med samtykke</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xl font-bold text-primary">{stats.orders.withNewsletterOptIn}</p>
              <p className="text-xs text-muted-foreground">Nyhetsbrev</p>
            </div>
          </div>

          <ProgressBar
            value={stats.orders.privacyConsentRate}
            label="Samtykke-rate"
            color="success"
          />
        </motion.div>
      </div>

      {/* Actions & Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-muted rounded-xl p-6 space-y-4"
      >
        <h2 className="font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Dataopprydding
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={runDataRetentionCleanup}
            disabled={isRunningCleanup}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {isRunningCleanup ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Kjør manuell opprydding
          </button>

          <Link
            href="/admin/audit-log"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted-foreground/10 rounded-lg hover:bg-muted-foreground/20 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Se revisjonslogg
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {cleanupResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              cleanupResult.startsWith('Feil')
                ? 'bg-error/10 text-error'
                : 'bg-green-500/10 text-green-500'
            }`}
          >
            {cleanupResult}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Automatiske regler:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Avmeldte nyhetsbrev-abonnenter: slettes etter 30 dager</li>
            <li>Kontaktskjema-meldinger: slettes etter 2 år</li>
            <li>Fullførte data-forespørsler: slettes etter 90 dager</li>
            <li>Cookie-samtykker: slettes etter 1 år</li>
            <li>Revisjonslogger: slettes etter 2 år</li>
            <li>Ordrer: anonymiseres etter 7 år (regnskapskrav)</li>
          </ul>
        </div>
      </motion.div>

      {/* Compliance Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-muted rounded-xl p-6"
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          GDPR-sjekkliste
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Cookie-samtykke banner', done: true },
            { label: 'Nyhetsbrev double opt-in', done: true },
            { label: 'Avmelding fra nyhetsbrev', done: true },
            { label: 'Personvernerklæring', done: true },
            { label: 'Data-eksport funksjon', done: true },
            { label: 'Data-sletting funksjon', done: true },
            { label: 'Samtykke ved checkout', done: true },
            { label: 'Revisjonslogging', done: true },
            { label: 'Rate limiting', done: true },
            { label: 'Dataopprydding', done: true },
            { label: 'Datatilsynet kontaktinfo', done: true },
            { label: 'Behandlerliste dokumentert', done: true },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-background rounded-lg"
            >
              {item.done ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
