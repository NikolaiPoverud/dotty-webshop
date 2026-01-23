'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bold,
  CheckCircle,
  Edit3,
  Eye,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Mail,
  Newspaper,
  Send,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { adminFetch } from '@/lib/admin-fetch';

interface Customer {
  email: string;
  source: 'newsletter' | 'order';
  name?: string;
}

interface CustomerStats {
  total: number;
  newsletterOnly: number;
  orderCustomers: number;
}

interface SendResult {
  success: boolean;
  message: string;
}

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorClass: string;
  delay?: number;
}

function StatCard({ icon: Icon, value, label, colorClass, delay = 0 }: StatCardProps): React.ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-muted rounded-xl p-6 border border-border"
    >
      <div className="flex items-center gap-3">
        <div className={`p-3 ${colorClass} rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  title: string;
}

function ToolbarButton({ onClick, icon: Icon, title }: ToolbarButtonProps): React.ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 hover:bg-muted rounded transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function SourceBadge({ source }: { source: Customer['source'] }): React.ReactNode {
  const isOrder = source === 'order';
  const Icon = isOrder ? ShoppingBag : Newspaper;
  const label = isOrder ? 'Ordre' : 'Nyhetsbrev';
  const colorClass = isOrder ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ResultMessage({ result }: { result: SendResult }): React.ReactNode {
  const Icon = result.success ? CheckCircle : AlertCircle;
  const colorClass = result.success
    ? 'bg-success/10 border-success/20 text-success'
    : 'bg-error/10 border-error/20 text-error';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-4 rounded-lg mb-6 border ${colorClass}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">{result.message}</p>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Email composer state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // SEC-004: Sanitize HTML content to prevent XSS attacks in preview
  // DOMPurify requires window, so we only use it on the client
  const sanitizedContent = useMemo(() => {
    if (!content) {
      return '<p class="text-gray-400">Ingen innhold enda...</p>';
    }
    // Only sanitize on client-side where DOMPurify can access window
    if (typeof window === 'undefined') {
      return content;
    }
    // Dynamic import workaround - use the already loaded module
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
    });
  }, [content]);

  useEffect(() => {
    async function loadCustomers(): Promise<void> {
      const response = await adminFetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setStats(data.stats);
      }
      setIsLoading(false);
    }
    loadCustomers();
  }, []);

  // SEC-013: URL validation for createLink command to prevent XSS
  function isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow https and mailto protocols
      return parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
    } catch {
      return false;
    }
  }

  function applyFormatting(command: string, value?: string): void {
    // SEC-013: Validate URLs before creating links
    if (command === 'createLink' && value) {
      if (!isValidUrl(value)) {
        alert('Ugyldig URL. Bruk en gyldig https:// eller mailto: adresse.');
        return;
      }
    }
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }

  function handleEditorInput(): void {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }

  function handleInsertLink(): void {
    const url = prompt('Skriv inn URL:');
    if (url) {
      applyFormatting('createLink', url);
    }
  }

  async function handleSendTest(): Promise<void> {
    if (!testEmail || !subject || !content) return;

    setIsSending(true);
    setSendResult(null);

    const response = await adminFetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content, testEmail }),
    });

    const data = await response.json();
    setIsSending(false);

    if (!response.ok) {
      setSendResult({ success: false, message: data.error || 'Failed to send test email' });
      return;
    }

    setSendResult({ success: true, message: data.message });
  }

  async function handleSendToAll(): Promise<void> {
    if (!subject || !content) return;

    setIsSending(true);
    setSendResult(null);
    setShowConfirmDialog(false);

    const response = await adminFetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content }),
    });

    const data = await response.json();
    setIsSending(false);

    if (!response.ok) {
      setSendResult({ success: false, message: data.error || 'Failed to send newsletter' });
      return;
    }

    const failedNote = data.failed > 0 ? ` (${data.failed} feilet)` : '';
    setSendResult({ success: true, message: `${data.message}${failedNote}` });

    // Clear form on success
    setSubject('');
    setContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kunder</h1>
          <p className="text-muted-foreground mt-1">
            Send nyhetsbrev til kunder og abonnenter
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          value={stats?.total || 0}
          label="Totalt"
          colorClass="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Newspaper}
          value={stats?.newsletterOnly || 0}
          label="Nyhetsbrev"
          colorClass="bg-accent/10 text-accent"
          delay={0.1}
        />
        <StatCard
          icon={ShoppingBag}
          value={stats?.orderCustomers || 0}
          label="Kunder (ordre)"
          colorClass="bg-success/10 text-success"
          delay={0.2}
        />
      </div>

      {/* Email Composer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-muted rounded-xl p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Skriv nyhetsbrev
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showPreview
                  ? 'bg-primary text-background'
                  : 'bg-background hover:bg-background/80'
              }`}
            >
              {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Rediger' : 'Forhåndsvis'}
            </button>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium">Emne</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="F.eks: Nye kunstverk i shoppen!"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Content Editor / Preview */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium">Innhold</label>

          {!showPreview ? (
            <>
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 bg-background border border-border rounded-t-lg border-b-0">
                <ToolbarButton onClick={() => applyFormatting('bold')} icon={Bold} title="Fet" />
                <ToolbarButton onClick={() => applyFormatting('italic')} icon={Italic} title="Kursiv" />
                <ToolbarButton onClick={handleInsertLink} icon={LinkIcon} title="Lenke" />
                <ToolbarButton onClick={() => applyFormatting('insertUnorderedList')} icon={List} title="Punktliste" />
                <ToolbarButton onClick={() => applyFormatting('formatBlock', 'h2')} icon={Heading2} title="Overskrift" />
              </div>

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="w-full min-h-[300px] px-4 py-3 bg-background border border-border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary/50 prose prose-invert max-w-none"
                style={{ outline: 'none' }}
              />
            </>
          ) : (
            /* Preview */
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="max-w-lg mx-auto">
                <div className="bg-[#1a1a1f] rounded-lg p-6 text-white">
                  <div className="text-center mb-6">
                    <span className="text-2xl font-bold text-[#FE206A]">Dotty.</span>
                    <span className="text-2xl font-bold">.</span>
                    <p className="text-sm text-gray-400 mt-1">Nyhetsbrev</p>
                  </div>
                  <hr className="border-gray-700 mb-6" />
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Result Message */}
        {sendResult && <ResultMessage result={sendResult} />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Test Email */}
          <div className="flex-1 flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test e-postadresse"
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSendTest}
              disabled={isSending || !testEmail || !subject || !content}
              className="flex items-center gap-2 px-4 py-3 bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
              Test
            </button>
          </div>

          {/* Send to All */}
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSending || !subject || !content}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sender...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send til alle ({stats?.total || 0})
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Customer List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-muted rounded-xl border border-border overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Alle mottakere</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Ingen kunder funnet
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-background sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    E-post
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Navn
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Kilde
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.email} className="hover:bg-background/50">
                    <td className="px-4 py-3 text-sm">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {customer.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={customer.source} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-muted rounded-xl p-6 max-w-md w-full border border-border"
          >
            <h3 className="text-xl font-bold mb-4">Bekreft utsending</h3>
            <p className="text-muted-foreground mb-6">
              Du er i ferd med å sende nyhetsbrev til <strong>{stats?.total || 0}</strong> mottakere.
              Dette kan ikke angres.
            </p>
            <div className="bg-background rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Emne:</p>
              <p className="font-medium">{subject}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSendToAll}
                className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
              >
                Send til alle
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
