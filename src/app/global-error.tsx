'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error: _error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#131316',
          color: '#fafafa',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h1 style={{ color: '#FE206A', fontSize: '2rem', marginBottom: '1rem' }}>
              Dotty.
            </h1>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Noe gikk galt
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>
              Vi beklager, men det oppstod en kritisk feil.
            </p>
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#FE206A',
                color: '#131316',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              Prøv igjen
            </button>
            <a
              href="/"
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem 1.5rem',
                border: '1px solid #3f3f46',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                color: '#fafafa',
              }}
            >
              Gå til forsiden
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
