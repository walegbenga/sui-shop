import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

function AuthCallbackComponent() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    handleCallback();
  }, [router.isReady]);

  const handleCallback = async () => {
    try {
      // Enoki puts the JWT in the URL hash after Google redirects back
      // Format: /auth/callback#id_token=xxx OR ?id_token=xxx
      const hash   = window.location.hash.substring(1);
      const search = window.location.search.substring(1);

      const hashParams   = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(search);

      const idToken =
        hashParams.get('id_token') ||
        searchParams.get('id_token') ||
        hashParams.get('token') ||
        searchParams.get('token');

      if (!idToken) {
        // No token — could be a direct visit to /auth/callback, just redirect home
        console.warn('No id_token found in callback URL, redirecting home');
        router.replace('/');
        return;
      }

      // Let @mysten/enoki process the token automatically via the wallet connection
      // The dapp-kit WalletProvider with autoConnect handles this when the token
      // is present — we just need to store it in sessionStorage where Enoki looks
      sessionStorage.setItem('enoki:id_token', idToken);

      setStatus('success');

      // Small delay so Enoki wallet provider can pick up the token
      await new Promise(r => setTimeout(r, 800));

      router.replace('/');
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Authentication failed');
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 400, width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
            Authentication Failed
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button onClick={() => router.push('/')}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#0c0c0f', fontFamily: "'DM Sans', sans-serif" }}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(201,168,76,.2)', borderTopColor: 'var(--gold)', animation: 'spin .8s linear infinite', display: 'inline-block', marginBottom: 16 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {status === 'success' ? 'Logged in! Redirecting…' : 'Completing authentication…'}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AuthCallbackComponent), { ssr: false });
