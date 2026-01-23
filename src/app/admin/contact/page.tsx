'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Mail, MailOpen, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { adminFetch } from '@/lib/admin-fetch';
import { cn } from '@/lib/utils';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

type FilterStatus = 'all' | 'unread' | 'read';

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: 'Alle',
  unread: 'Uleste',
  read: 'Leste',
};

const FILTER_STATUSES: FilterStatus[] = ['all', 'unread', 'read'];

function formatRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.round(diffMs / (60 * 60 * 1000));
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (minutes < 60) return `${minutes} min siden`;
  if (hours < 24) return `${hours} timer siden`;
  if (days < 7) return `${days} dager siden`;

  return new Date(dateStr).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function LoadingSpinner(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function AdminContactPage(): React.ReactElement {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await adminFetch('/api/admin/contact');
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Failed to load');
    } else {
      setSubmissions(result.data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'unread' && sub.is_read) return false;
    if (filter === 'read' && !sub.is_read) return false;
    if (!search) return true;

    const searchLower = search.toLowerCase();
    return (
      sub.name.toLowerCase().includes(searchLower) ||
      sub.email.toLowerCase().includes(searchLower) ||
      sub.message.toLowerCase().includes(searchLower)
    );
  });

  const unreadCount = submissions.filter((s) => !s.is_read).length;

  async function handleToggleRead(id: string, currentlyRead: boolean): Promise<void> {
    const response = await adminFetch(`/api/admin/contact/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: !currentlyRead }),
    });

    if (!response.ok) {
      setError('Failed to update');
      return;
    }

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, is_read: !currentlyRead, read_at: !currentlyRead ? new Date().toISOString() : null }
          : s
      )
    );
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Er du sikker på at du vil slette denne meldingen?')) return;

    setDeletingId(id);
    const response = await adminFetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
    setDeletingId(null);

    if (!response.ok) {
      setError('Failed to delete');
      return;
    }

    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Meldinger
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-primary text-background text-sm font-bold rounded-full">
                {unreadCount} nye
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Kontaktskjema-meldinger</p>
        </div>
        <button onClick={fetchSubmissions} className="p-2 hover:bg-muted rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk i meldinger..."
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {FILTER_STATUSES.map((status) => {
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-primary text-background' : 'bg-muted hover:bg-muted-foreground/10'
                )}
              >
                {FILTER_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <EmptyState hasSubmissions={submissions.length > 0} />
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <MessageCard
              key={submission.id}
              submission={submission}
              isExpanded={expandedId === submission.id}
              isDeleting={deletingId === submission.id}
              onToggleExpand={() => {
                setExpandedId(expandedId === submission.id ? null : submission.id);
                if (!submission.is_read) {
                  handleToggleRead(submission.id, false);
                }
              }}
              onToggleRead={() => handleToggleRead(submission.id, submission.is_read)}
              onDelete={() => handleDelete(submission.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  hasSubmissions: boolean;
}

function EmptyState({ hasSubmissions }: EmptyStateProps): React.ReactElement {
  const message = hasSubmissions ? 'Ingen meldinger matcher søket.' : 'Ingen meldinger ennå.';

  return (
    <div className="text-center py-12">
      <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

interface MessageCardProps {
  submission: ContactSubmission;
  isExpanded: boolean;
  isDeleting: boolean;
  onToggleExpand: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
}

function MessageCard({
  submission,
  isExpanded,
  isDeleting,
  onToggleExpand,
  onToggleRead,
  onDelete,
}: MessageCardProps): React.ReactElement {
  const isUnread = !submission.is_read;

  return (
    <div
      className={cn(
        'bg-muted rounded-lg overflow-hidden transition-all',
        isUnread && 'border-l-4 border-l-primary'
      )}
    >
      <div
        className="p-4 cursor-pointer hover:bg-muted-foreground/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                isUnread ? 'bg-primary/10' : 'bg-muted-foreground/10'
              )}
            >
              {isUnread ? (
                <Mail className="w-5 h-5 text-primary" />
              ) : (
                <MailOpen className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn('font-semibold', isUnread && 'text-primary')}>
                  {submission.name}
                </p>
                {isUnread && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground truncate">{submission.email}</p>
              <p className="text-sm text-foreground mt-1 line-clamp-1">{submission.message}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">{formatRelativeDate(submission.created_at)}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <MessageExpandedContent
          submission={submission}
          isDeleting={isDeleting}
          onToggleRead={onToggleRead}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

interface MessageExpandedContentProps {
  submission: ContactSubmission;
  isDeleting: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
}

function MessageExpandedContent({
  submission,
  isDeleting,
  onToggleRead,
  onDelete,
}: MessageExpandedContentProps): React.ReactElement {
  const ReadIcon = submission.is_read ? Mail : CheckCircle;
  const readLabel = submission.is_read ? 'Merk som ulest' : 'Merk som lest';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border"
    >
      <div className="p-4 bg-background/50">
        <p className="whitespace-pre-wrap text-foreground">{submission.message}</p>
      </div>
      <div className="p-4 flex items-center justify-between border-t border-border">
        <a
          href={`mailto:${submission.email}?subject=Re: Din melding til Dotty.`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
        >
          <Mail className="w-4 h-4" />
          Svar på e-post
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRead}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-muted-foreground/10 rounded-lg hover:bg-muted-foreground/20 transition-colors"
          >
            <ReadIcon className="w-4 h-4" />
            {readLabel}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Slett
          </button>
        </div>
      </div>
    </motion.div>
  );
}
