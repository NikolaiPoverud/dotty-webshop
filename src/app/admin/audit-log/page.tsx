'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  User,
  Package,
  Mail,
  ShoppingCart,
  Database,
  Clock,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: string;
  actor_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterOptions {
  actions: string[];
  entityTypes: string[];
  actorTypes: string[];
}

const actionLabels: Record<string, string> = {
  contact_view: 'Kontakt vist',
  contact_delete: 'Kontakt slettet',
  contact_mark_read: 'Kontakt lest',
  order_view: 'Ordre vist',
  order_update: 'Ordre oppdatert',
  product_create: 'Produkt opprettet',
  product_update: 'Produkt oppdatert',
  product_delete: 'Produkt slettet',
  newsletter_unsubscribe: 'Nyhetsbrev avmeldt',
  newsletter_confirmed: 'Nyhetsbrev bekreftet',
  gdpr_export_completed: 'Data eksportert',
  gdpr_delete_completed: 'Data slettet',
  data_request_created: 'Data forespørsel opprettet',
  data_retention_cleanup: 'Dataopprydding kjørt',
};

const entityIcons: Record<string, typeof Package> = {
  product: Package,
  order: ShoppingCart,
  contact_submission: Mail,
  newsletter_subscriber: Mail,
  data_request: Database,
  system: Database,
};

const actorColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  customer: 'bg-blue-500/10 text-blue-500',
  system: 'bg-purple-500/10 text-purple-500',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    actions: [],
    entityTypes: [],
    actorTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity_type', entityFilter);
      if (actorFilter) params.set('actor_type', actorFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const response = await fetch(`/api/admin/audit-log?${params}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setLogs(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, entityFilter, actorFilter, dateFrom, dateTo]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'filters' }),
      });
      const result = await response.json();
      if (response.ok) {
        setFilterOptions(result);
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const clearFilters = () => {
    setActionFilter('');
    setEntityFilter('');
    setActorFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) return 'Nå';
    if (diff < 60 * 60 * 1000) return `${Math.round(diff / (60 * 1000))} min`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / (60 * 60 * 1000))}t`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.round(diff / (24 * 60 * 60 * 1000))}d`;
    return formatDate(dateStr);
  };

  const getEntityIcon = (entityType: string) => {
    const Icon = entityIcons[entityType] || Database;
    return <Icon className="w-4 h-4" />;
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  const hasActiveFilters = actionFilter || entityFilter || actorFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Revisjonslogg
          </h1>
          <p className="text-muted-foreground mt-1">
            Spor alle handlinger i admin-panelet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-background'
                : 'bg-muted hover:bg-muted-foreground/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-background rounded-full" />
            )}
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted rounded-lg p-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Handling</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Alle</option>
                {filterOptions.actions.map((action) => (
                  <option key={action} value={action}>
                    {actionLabels[action] || action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Entitetstype</label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Alle</option>
                {filterOptions.entityTypes.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Aktør</label>
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Alle</option>
                {filterOptions.actorTypes.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Fra dato</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Til dato</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:underline"
            >
              Nullstill filter
            </button>
          )}
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk i logger..."
          className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Viser {filteredLogs.length} av {pagination.total} logger
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Siste 2 år lagres
        </span>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Ingen logger funnet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Tidspunkt
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Handling
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Entitet
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Aktør
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  IP
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Detaljer
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {formatRelativeTime(log.created_at)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {getEntityIcon(log.entity_type)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.entity_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        actorColors[log.actor_type] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      {log.actor_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-mono text-muted-foreground">
                      {log.ip_address || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {Object.keys(log.details || {}).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-xs text-primary hover:underline">
                          Se detaljer
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto max-w-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchLogs(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground">
            Side {pagination.page} av {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchLogs(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
