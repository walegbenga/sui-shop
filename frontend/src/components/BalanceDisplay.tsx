// src/components/BalanceDisplay.tsx
// Shows wallet balance in the navbar: $24.50 (12.45 SUI)
// Clicking opens a small dropdown with deposit/withdraw links

import { useState, useRef, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import Link from 'next/link';

export default function BalanceDisplay() {
  const account = useCurrentAccount();
  const { suiFormatted, usdValue, loading, refresh } = useWalletBalance();
  const [open, setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!account) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Balance pill */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) refresh(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          transition: 'border-color .2s',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
      >
        {loading ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>…</span>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              ${usdValue}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({suiFormatted} SUI)
            </span>
          </>
        )}
        <svg style={{ width: 12, height: 12, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 260, zIndex: 100,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          overflow: 'hidden',
        }}>
          {/* Balance header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Wallet Balance</p>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--gold-light)', marginBottom: 2 }}>
              ${usdValue}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{suiFormatted} SUI</p>
          </div>

          {/* Wallet address */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Your Address</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border-subtle)' }}>
              <code style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {account.address}
              </code>
              <button onClick={copyAddress}
                style={{ fontSize: 10, color: copied ? '#34d399' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link href="/wallet/deposit" onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>💳</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add Funds</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Buy SUI with card or transfer</p>
              </div>
            </Link>

            <Link href="/wallet/withdraw" onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>📤</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Withdraw</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Send to wallet or cash out</p>
              </div>
            </Link>

            <button onClick={() => { refresh(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: 'none', width: '100%',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>🔄</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Refresh balance</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
