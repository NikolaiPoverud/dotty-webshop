'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ChevronDown, Loader2, Mail, Send } from 'lucide-react';

interface EmailType {
  id: string;
  label: string;
  subject: string;
}

interface SendResult {
  success: boolean;
  message: string;
}

export default function EmailTestPage(): React.ReactElement {
  const [emailTypes, setEmailTypes] = useState<EmailType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('test');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchEmailTypes = async () => {
      try {
        const response = await fetch('/api/admin/test-email');
        const data = await response.json();
        if (data.types) {
          setEmailTypes(data.types);
        }
      } catch (error) {
        console.error('Failed to fetch email types:', error);
      }
    };

    fetchEmailTypes();
  }, []);

  const selectedTypeData = emailTypes.find((t) => t.id === selectedType);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: selectedType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setResult({
        success: true,
        message: `"${data.label}" sendt til ${email}`,
      });
      setEmail('');
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Kunne ikke sende e-post',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Test E-post</h1>
        <p className="text-muted-foreground mt-1">
          Send test-e-poster for å verifisere at e-postsystemet fungerer
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted rounded-xl p-6 border border-border"
      >
        <form onSubmit={handleSend} className="space-y-6">
          {/* Email Type Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">E-posttype</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-left flex items-center justify-between"
              >
                <span>{selectedTypeData?.label || 'Velg type...'}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {emailTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(type.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${
                        selectedType === type.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground truncate">{type.subject}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            {selectedTypeData && (
              <p className="text-xs text-muted-foreground">
                Emne: {selectedTypeData.subject}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Mottaker
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-4 rounded-lg ${
                result.success
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-error/10 border border-error/20 text-error'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{result.message}</p>
            </motion.div>
          )}

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sender...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send test-epost
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Info Box */}
      <div className="bg-muted/50 rounded-xl p-6 border border-border">
        <h3 className="font-medium mb-3">Om test-e-poster</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Test E-post</strong> - Enkel e-post for å verifisere at systemet fungerer</li>
          <li>• <strong>Ordrebekreftelse</strong> - Eksempel på ordrebekreftelse med produkter og priser</li>
          <li>• <strong>Sendingsvarsel</strong> - Eksempel på e-post når en ordre er sendt</li>
          <li>• <strong>Nyhetsbrev-bekreftelse</strong> - Double opt-in e-post for nyhetsbrev</li>
        </ul>
      </div>
    </div>
  );
}
