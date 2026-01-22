'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface IdleTimeoutProps {
  timeoutMs?: number;
  warningMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_MS = 14 * 60 * 1000; // 14 minutes (1 minute before timeout)

export function IdleTimeout({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
}: IdleTimeoutProps): React.ReactNode {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Use refs to track state without triggering re-renders
  const lastActivityRef = useRef<number>(0);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const showWarningRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const clearAllTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push('/admin/login?reason=timeout');
  }, [clearAllTimers, router]);

  // Setup timers - separated to avoid lint warnings about setState in effects
  const setupTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearAllTimers();

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      const remainingMs = timeoutMs - warningMs;
      setSecondsRemaining(Math.ceil(remainingMs / 1000));
      setShowWarning(true);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    // Set logout timer
    logoutTimeoutRef.current = setTimeout(() => {
      performLogout();
    }, timeoutMs);
  }, [clearAllTimers, performLogout, timeoutMs, warningMs]);

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    setupTimers();
  }, [setupTimers]);

  useEffect(() => {
    // Initialize on mount
    lastActivityRef.current = Date.now();
    setupTimers();

    // Activity events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle activity detection
    let lastEventTime = 0;
    const throttleMs = 1000;

    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastEventTime > throttleMs) {
        lastEventTime = now;
        // Only reset if we're not in the warning state
        if (!showWarningRef.current) {
          setupTimers();
        }
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const idleTime = Date.now() - lastActivityRef.current;

        if (idleTime >= timeoutMs) {
          performLogout();
        } else if (idleTime >= warningMs) {
          const remainingMs = timeoutMs - idleTime;
          setSecondsRemaining(Math.ceil(remainingMs / 1000));
          setShowWarning(true);

          // Recalculate logout timer
          clearAllTimers();
          logoutTimeoutRef.current = setTimeout(() => {
            performLogout();
          }, remainingMs);

          countdownIntervalRef.current = setInterval(() => {
            setSecondsRemaining((prev) => {
              if (prev <= 1) {
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        document.removeEventListener(event, throttledHandler);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Timer setup should only run on mount
  }, []);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-muted rounded-xl border border-border p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-full">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <h2 className="text-lg font-semibold">Økt utløper snart</h2>
              </div>
              <button
                onClick={handleStayLoggedIn}
                className="p-1 hover:bg-background rounded transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6">
              Du har vært inaktiv en stund. For sikkerheten din vil du bli logget ut om{' '}
              <span className="font-mono font-semibold text-foreground">
                {secondsRemaining}
              </span>{' '}
              {secondsRemaining === 1 ? 'sekund' : 'sekunder'}.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
              >
                Fortsett å jobbe
              </button>
              <button
                onClick={performLogout}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted-foreground/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logg ut
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
