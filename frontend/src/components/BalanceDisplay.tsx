import { useState, useRef, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import Link from 'next/link';

export default function BalanceDisplay() {
  const account               = useCurrentAccount();
  const { suiFormatted, usdValue, loading, refresh } = useWalletBalance();
  const [open,   setOpen]     = useState(false);
  const [copied, setCopied]   = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);

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

  const short = `${account.address.slice(0, 10)}...${account.address.slice(-6)}`;

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 50 }}>

      {/* ── Balance pill ── */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) refresh(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? (
          <span style={{ fontSize: 12, color: '#6b7280' }}>…</span>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              ${usdValue}
            </span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              ({suiFormatted} SUI)
            </span>
          </>
        )}
        <svg
          style={{ width: 12, height: 12, color: '#9ca3af', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 270,
          zIndex: 9999,
          background: '#ffffff',           /* solid white — no transparency */
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>

          {/* Balance header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f3f4f6', background: '#ffffff' }}>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Wallet Balance</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#4f46e5', marginBottom: 2, fontFamily: 'inherit' }}>
              ${usdValue}
            </p>
            <p style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{suiFormatted} SUI</p>
          </div>

          {/* Wallet address */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#ffffff' }}>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Your Address</p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f9fafb', borderRadius: 8,
              padding: '6px 10px', border: '1px solid #e5e7eb',
            }}>
              <code style={{ fontSize: 10, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {short}
              </code>
              <button
                onClick={copyAddress}
                style={{
                  fontSize: 11, fontWeight: 600,
                  color: copied ? '#059669' : '#6366f1',
                  background: 'none', border: 'none', cursor: 'pointer',
                  flexShrink: 0, fontFamily: 'inherit', padding: '2px 4px',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: 8, background: '#ffffff' }}>
            <ActionRow
              href="/wallet/deposit"
              icon="💳"
              title="Add Funds"
              sub="Buy SUI with card or transfer"
              onClick={() => setOpen(false)}
            />
            <ActionRow
              href="/wallet/withdraw"
              icon="📤"
              title="Withdraw"
              sub="Send to wallet or cash out"
              onClick={() => setOpen(false)}
            />
            <button
              onClick={() => { refresh(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: 'none', width: '100%',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔄</span>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Refresh balance</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

function ActionRow({ href, icon, title, sub, onClick }: {
  href: string; icon: string; title: string; sub: string; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{sub}</p>
      </div>
    </Link>
  );
}
