'use client';

import { useState, useEffect } from 'react';

const SITE_PASSWORD = '1996';
const STORAGE_KEY = 'dotty-site-unlocked';

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Check if already unlocked
    const unlocked = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsUnlocked(unlocked);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setPassword('');
      // Remove shake after animation
      setTimeout(() => setShake(false), 500);
    }
  };

  // Show nothing while checking localStorage (prevents flash)
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show content if unlocked
  if (isUnlocked) {
    return <>{children}</>;
  }

  // Show password gate
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="gradient-text">Dotty.</span>
          </h1>
          <p className="text-gray-400 text-sm">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              autoFocus
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                error ? 'border-red-500' : 'border-gray-700'
              } ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
              style={shake ? {
                animation: 'shake 0.5s ease-in-out'
              } : undefined}
            />
            {error && (
              <p className="mt-2 text-red-400 text-sm">Incorrect password</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
