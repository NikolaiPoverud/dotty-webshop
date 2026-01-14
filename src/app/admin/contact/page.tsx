'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Mail, MailOpen, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { adminFetch } from '@/lib/admin-fetch';

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

export default function AdminContactPage() {
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

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;

    if (diffMs < HOUR) {
      return `${Math.round(diffMs / MINUTE)} min siden`;
    }
    if (diffMs < DAY) {
      return `${Math.round(diffMs / HOUR)} timer siden`;
    }
    if (diffMs < WEEK) {
      return `${Math.round(diffMs / DAY)} dager siden`;
    }
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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

      {/* Filters */}
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
          {(['all', 'unread', 'read'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === status
                  ? 'bg-primary text-background'
                  : 'bg-muted hover:bg-muted-foreground/10'
              }`}
            >
              {status === 'all' ? 'Alle' : status === 'unread' ? 'Uleste' : 'Leste'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {submissions.length === 0
              ? 'Ingen meldinger ennå.'
              : 'Ingen meldinger matcher søket.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={`bg-muted rounded-lg overflow-hidden transition-all ${
                !submission.is_read ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              {/* Header Row */}
              <div
                className="p-4 cursor-pointer hover:bg-muted-foreground/5 transition-colors"
                onClick={() => {
                  setExpandedId(expandedId === submission.id ? null : submission.id);
                  if (!submission.is_read) {
                    handleToggleRead(submission.id, false);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        submission.is_read ? 'bg-muted-foreground/10' : 'bg-primary/10'
                      }`}
                    >
                      {submission.is_read ? (
                        <MailOpen className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Mail className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${!submission.is_read ? 'text-primary' : ''}`}>
                          {submission.name}
                        </p>
                        {!submission.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {submission.email}
                      </p>
                      <p className="text-sm text-foreground mt-1 line-clamp-1">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDate(submission.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === submission.id && (
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
                      href={`mailto:${submission.email}?subject=Re: Din melding til Dotty`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Svar på e-post
                    </a>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRead(submission.id, submission.is_read)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-muted-foreground/10 rounded-lg hover:bg-muted-foreground/20 transition-colors"
                      >
                        {submission.is_read ? (
                          <>
                            <Mail className="w-4 h-4" />
                            Merk som ulest
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Merk som lest
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(submission.id)}
                        disabled={deletingId === submission.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50"
                      >
                        {deletingId === submission.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Slett
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
