'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Filter,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShoppingCart,
  User,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

// Types
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

interface Filters {
  action: string;
  entity: string;
  actor: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

// Constants
const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

const ACTION_LABELS: Record<string, string> = {
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
  data_retention_cleanup: 'Dataopprydding kjort',
};

const ENTITY_ICONS: Record<string, typeof Package> = {
  product: Package,
  order: ShoppingCart,
  contact_submission: Mail,
  newsletter_subscriber: Mail,
  data_request: Database,
  system: Database,
};

const ACTOR_COLORS: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  customer: 'bg-blue-500/10 text-blue-500',
  system: 'bg-purple-500/10 text-purple-500',
};

const INITIAL_FILTERS: Filters = {
  action: '',
  entity: '',
  actor: '',
  dateFrom: '',
  dateTo: '',
  search: '',
};

const INITIAL_PAGINATION: Pagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
};

// Utility functions
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const { MINUTE, HOUR, DAY, WEEK } = TIME_CONSTANTS;

  if (diff < MINUTE) return 'Na';
  if (diff < HOUR) return `${Math.round(diff / MINUTE)} min`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}t`;
  if (diff < WEEK) return `${Math.round(diff / DAY)}d`;
  return formatFullDate(dateStr);
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEntityIcon(entityType: string): React.ReactElement {
  const Icon = ENTITY_ICONS[entityType] || Database;
  return <Icon className="w-4 h-4" />;
}

function hasActiveFilters(filters: Filters): boolean {
  return Boolean(
    filters.action || filters.entity || filters.actor || filters.dateFrom || filters.dateTo
  );
}

function filterLogs(logs: AuditLogEntry[], search: string): AuditLogEntry[] {
  if (!search) return logs;

  const searchLower = search.toLowerCase();
  return logs.filter((log) => {
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });
}

// Reusable filter select component
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  getLabel?: (value: string) => string;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  getLabel,
}: FilterSelectProps): React.ReactElement {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Alle</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel ? getLabel(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
}

// Reusable date input component
interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function DateInput({ label, value, onChange }: DateInputProps): React.ReactElement {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

// Table row component
interface LogRowProps {
  log: AuditLogEntry;
}

function LogRow({ log }: LogRowProps): React.ReactElement {
  const actorColorClass = ACTOR_COLORS[log.actor_type] || 'bg-muted text-muted-foreground';
  const hasDetails = Object.keys(log.details || {}).length > 0;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{formatRelativeTime(log.created_at)}</span>
          <span className="text-xs text-muted-foreground">{formatFullDate(log.created_at)}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">{ACTION_LABELS[log.action] || log.action}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{getEntityIcon(log.entity_type)}</span>
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
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${actorColorClass}`}>
          <User className="w-3 h-3" />
          {log.actor_type}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs font-mono text-muted-foreground">{log.ip_address || '-'}</span>
      </td>
      <td className="py-3 px-4">
        {hasDetails ? (
          <details className="cursor-pointer">
            <summary className="text-xs text-primary hover:underline">Se detaljer</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto max-w-xs">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </details>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
    </tr>
  );
}

// Main component
export default function AuditLogPage(): React.ReactElement {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>(INITIAL_PAGINATION);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    actions: [],
    entityTypes: [],
    actorTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (filters.action) params.set('action', filters.action);
      if (filters.entity) params.set('entity_type', filters.entity);
      if (filters.actor) params.set('actor_type', filters.actor);
      if (filters.dateFrom) params.set('date_from', filters.dateFrom);
      if (filters.dateTo) params.set('date_to', filters.dateTo);

      const response = await adminFetch(`/api/admin/audit-log?${params}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to load');
        setIsLoading(false);
        return;
      }

      setLogs(result.data || []);
      setPagination(result.pagination);
      setIsLoading(false);
    },
    [filters.action, filters.entity, filters.actor, filters.dateFrom, filters.dateTo]
  );

  const fetchFilterOptions = useCallback(async () => {
    const response = await adminFetch('/api/admin/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'filters' }),
    });

    if (response.ok) {
      const result = await response.json();
      setFilterOptions(result);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const filteredLogs = filterLogs(logs, filters.search);
  const showActiveFilterIndicator = hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Revisjonslogg
          </h1>
          <p className="text-muted-foreground mt-1">Spor alle handlinger i admin-panelet</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || showActiveFilterIndicator
                ? 'bg-primary text-background'
                : 'bg-muted hover:bg-muted-foreground/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {showActiveFilterIndicator && <span className="w-2 h-2 bg-background rounded-full" />}
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">{error}</div>
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
            <FilterSelect
              label="Handling"
              value={filters.action}
              onChange={(v) => updateFilter('action', v)}
              options={filterOptions.actions}
              getLabel={(action) => ACTION_LABELS[action] || action}
            />
            <FilterSelect
              label="Entitetstype"
              value={filters.entity}
              onChange={(v) => updateFilter('entity', v)}
              options={filterOptions.entityTypes}
            />
            <FilterSelect
              label="Aktor"
              value={filters.actor}
              onChange={(v) => updateFilter('actor', v)}
              options={filterOptions.actorTypes}
            />
            <DateInput
              label="Fra dato"
              value={filters.dateFrom}
              onChange={(v) => updateFilter('dateFrom', v)}
            />
            <DateInput
              label="Til dato"
              value={filters.dateTo}
              onChange={(v) => updateFilter('dateTo', v)}
            />
          </div>

          {showActiveFilterIndicator && (
            <button onClick={clearFilters} className="text-sm text-primary hover:underline">
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
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Sok i logger..."
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
          Siste 2 ar lagres
        </span>
      </div>

      {/* Content */}
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
                  Aktor
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
              {filteredLogs.map((log) => (
                <LogRow key={log.id} log={log} />
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
