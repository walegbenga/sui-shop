// src/components/LicenseKeyDisplay.tsx
// Reusable component — shows a buyer's license for a product
// Use compact=true for inline list rows, compact=false for full card

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import toast from 'react-hot-toast';

const PACKAGE_ID     = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

interface License {
  license_id: string;
  license_type: number;
  max_activations: number;
  current_activations: number;
  expiry_timestamp: number;
  renewal_price: number;
  status: string;
  renewal_count: number;
  issue_timestamp: number;
  active_devices?: number;
  product_title?: string;
}

interface LicenseKeyDisplayProps {
  productId: string;
  compact?: boolean;
}

export default function LicenseKeyDisplay({ productId, compact = false }: LicenseKeyDisplayProps) {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [license,   setLicense]   = useState<License | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);
  const [renewing,  setRenewing]  = useState(false);

  useEffect(() => {
    if (productId && account?.address) fetchLicense();
  }, [productId, account?.address]);

  const fetchLicense = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/licenses/product/${productId}/buyer/${account!.address}`
      );
      if (res.ok) {
        const data = await res.json();
        setLicense(data.license || null);
      }
    } catch { /* no license */ }
    finally { setLoading(false); }
  };

  const copyKey = () => {
    if (!license) return;
    navigator.clipboard.writeText(license.license_id);
    setCopied(true);
    toast.success('License key copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRenew = async () => {
    if (!license || !account) return;
    setRenewing(true);
    toast.loading('Processing renewal…', { id: 'renew' });

    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(BigInt(license.renewal_price)),
      ]);
      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::renew_license`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.object(license.license_id),  // the SoftwareLicense object
          tx.object(productId),           // the Product object
          coin,
          tx.object('0x6'),
        ],
      });

      signAndExecuteTransaction({ transaction: tx }, {
        onSuccess: () => {
          toast.success('License renewed! ✅', { id: 'renew' });
          fetchLicense(); // refresh
        },
        onError: (e: any) => {
          toast.error(e.message || 'Renewal failed', { id: 'renew' });
        },
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to build transaction', { id: 'renew' });
    } finally {
      setRenewing(false);
    }
  };

  if (loading) return (
    <div className="skeleton" style={{ height: compact ? 32 : 80, borderRadius: 8 }} />
  );

  if (!license) return null;

  const now       = Date.now();
  const isExpired = license.expiry_timestamp > 0 && now > license.expiry_timestamp;
  const isActive  = license.status === 'active' && !isExpired;
  const canRenew  = license.renewal_price > 0 && (
    isExpired ||
    (license.expiry_timestamp > 0 && license.expiry_timestamp - now <= 30 * 24 * 60 * 60 * 1000)
  );

  const statusColor = license.status === 'revoked'
    ? { bg: 'rgba(239,68,68,.08)', color: '#f87171', border: 'rgba(239,68,68,.2)', label: 'Revoked' }
    : isExpired
    ? { bg: 'rgba(251,191,36,.08)', color: '#fbbf24', border: 'rgba(251,191,36,.2)', label: 'Expired' }
    : { bg: 'rgba(52,211,153,.08)', color: '#34d399', border: 'rgba(52,211,153,.2)', label: 'Active' };

  const formatExpiry = (ts: number) => {
    if (ts === 0) return 'Lifetime ♾️';
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const shortKey = `${license.license_id.slice(0, 8)}…${license.license_id.slice(-6)}`;

  // ── Compact mode (inline in purchase rows) ──────────────────────
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border-subtle)', marginTop: 6 }}>
        <span style={{ fontSize: 12 }}>🔑</span>
        <code style={{ fontSize: 10, fontFamily: 'monospace', color: isActive ? 'var(--gold-light)' : 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortKey}
        </code>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}`, flexShrink: 0 }}>
          {statusColor.label}
        </span>
        <button onClick={copyKey}
          style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: copied ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
          {copied ? '✓' : 'Copy'}
        </button>
        {canRenew && (
          <button onClick={handleRenew} disabled={renewing}
            style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#0c0c0f', cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
            Renew
          </button>
        )}
      </div>
    );
  }

  // ── Full card mode ──────────────────────────────────────────────
  return (
    <div style={{ background: 'rgba(201,168,76,.04)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>🔑</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Your License Key</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}` }}>
          {statusColor.label}
        </span>
      </div>

      {/* Key display */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <code style={{ fontSize: 11, fontFamily: 'monospace', color: isActive ? 'var(--gold-light)' : 'var(--text-muted)', flex: 1, wordBreak: 'break-all', letterSpacing: '0.04em' }}>
          {license.license_id}
        </code>
        <button onClick={copyKey}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: copied ? 'rgba(52,211,153,.1)' : 'transparent', color: copied ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", flexShrink: 0, transition: 'all .2s' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Type', value: ['None', 'Single Device', 'Multi Device', 'Unlimited'][license.license_type] || 'Unknown' },
          { label: 'Activations', value: license.max_activations === 0 ? `${license.current_activations} / ∞` : `${license.current_activations} / ${license.max_activations}` },
          { label: 'Valid Until', value: formatExpiry(license.expiry_timestamp) },
          { label: 'Renewals', value: String(license.renewal_count) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Expired banner + renew button */}
      {isExpired && (
        <div style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#fbbf24', marginBottom: canRenew ? 8 : 0 }}>
            ⚠️ This license has expired
          </p>
          {canRenew && (
            <button onClick={handleRenew} disabled={renewing}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', fontFamily: "'DM Sans',sans-serif", width: '100%' }}>
              {renewing ? 'Renewing…' : `🔄 Renew for ${(license.renewal_price / 1e9).toFixed(2)} SUI`}
            </button>
          )}
        </div>
      )}

      {/* Approaching expiry warning */}
      {!isExpired && canRenew && (
        <div style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#fbbf24', marginBottom: 8 }}>
            ⏳ Expires soon — renew now to avoid interruption
          </p>
          <button onClick={handleRenew} disabled={renewing}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', fontFamily: "'DM Sans',sans-serif", width: '100%' }}>
            {renewing ? 'Renewing…' : `🔄 Renew for ${(license.renewal_price / 1e9).toFixed(2)} SUI`}
          </button>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        This key is tied to your wallet address and is your proof of purchase.
      </p>
    </div>
  );
}
