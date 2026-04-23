// src/pages/my-licenses.tsx
import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import Link from 'next/link';
import toast from 'react-hot-toast';

const PACKAGE_ID     = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

interface License {
  id: number;
  license_id: string;
  product_id: string;
  product_title?: string;
  product_image?: string;
  product_category?: string;
  license_type: number;
  max_activations: number;
  current_activations: number;
  expiry_timestamp: number;
  renewal_price: number;
  status: string;
  renewal_count: number;
  issue_timestamp: number;
  active_devices: number;
}

const LICENSE_TYPE_LABELS = ['None', 'Single Device', 'Multi Device', 'Unlimited'];

export default function MyLicenses() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [licenses,  setLicenses]  = useState<License[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState<string | null>(null);
  const [renewing,  setRenewing]  = useState<string | null>(null);
  const [filter,    setFilter]    = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  // Verify tool
  const [verifyKey,    setVerifyKey]    = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying,    setVerifying]    = useState(false);

  useEffect(() => {
    if (account?.address) fetchLicenses();
    else setLoading(false);
  }, [account?.address]);

  const fetchLicenses = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:4000/api/licenses/buyer/${account.address}`);
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch { toast.error('Failed to fetch licenses'); }
    finally { setLoading(false); }
  };

  const copyKey = (licenseId: string) => {
    navigator.clipboard.writeText(licenseId);
    setCopied(licenseId);
    toast.success('License key copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRenew = async (license: License) => {
    if (!account) return;
    setRenewing(license.license_id);
    toast.loading('Processing renewal…', { id: 'renew' });
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(license.renewal_price))]);
      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::renew_license`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.object(license.license_id),
          tx.object(license.product_id),
          coin,
          tx.object('0x6'),
        ],
      });
      signAndExecuteTransaction({ transaction: tx }, {
        onSuccess: () => {
          toast.success('License renewed! ✅', { id: 'renew' });
          fetchLicenses();
        },
        onError: (e: any) => toast.error(e.message || 'Renewal failed', { id: 'renew' }),
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to build transaction', { id: 'renew' });
    } finally {
      setRenewing(null);
    }
  };

  const verifyLicense = async () => {
    if (!verifyKey.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res  = await fetch('http://localhost:4000/api/licenses/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: verifyKey.trim() }),
      });
      setVerifyResult(await res.json());
    } catch { toast.error('Verification failed'); }
    finally { setVerifying(false); }
  };

  const formatDate = (ts: number) => {
    if (!ts || ts === 0) return 'Lifetime ♾️';
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getLicenseStatus = (l: License) => {
    const now = Date.now();
    if (l.status === 'revoked') return 'revoked';
    if (l.expiry_timestamp > 0 && now > l.expiry_timestamp) return 'expired';
    return 'active';
  };

  const canRenew = (l: License) => {
    if (l.renewal_price === 0) return false;
    const status = getLicenseStatus(l);
    if (status === 'revoked') return false;
    if (status === 'expired') return true;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return l.expiry_timestamp > 0 && l.expiry_timestamp - Date.now() <= thirtyDays;
  };

  const statusStyle = (status: string) => ({
    revoked: { bg: 'rgba(239,68,68,.08)', color: '#f87171', border: 'rgba(239,68,68,.2)', label: 'Revoked' },
    expired: { bg: 'rgba(251,191,36,.08)', color: '#fbbf24', border: 'rgba(251,191,36,.2)', label: 'Expired' },
    active:  { bg: 'rgba(52,211,153,.08)', color: '#34d399', border: 'rgba(52,211,153,.2)', label: 'Active'  },
  }[status] || { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'var(--border-subtle)', label: status });

  const filtered = licenses.filter(l => {
    if (filter === 'all') return true;
    return getLicenseStatus(l) === filter;
  });

  const counts = {
    all:     licenses.length,
    active:  licenses.filter(l => getLicenseStatus(l) === 'active').length,
    expired: licenses.filter(l => getLicenseStatus(l) === 'expired').length,
    revoked: licenses.filter(l => getLicenseStatus(l) === 'revoked').length,
  };

  if (!account) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Wallet Not Connected</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect your wallet to view your licenses.</p>
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 4 }}>My Licenses</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          License keys for your purchased software products
        </p>
      </div>

      {/* Verify tool */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, marginBottom: 12, color: 'var(--text-primary)' }}>
          🔍 Verify a License Key
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={verifyKey} onChange={e => setVerifyKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyLicense()}
            placeholder="Paste a license key (on-chain object ID) to verify…"
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12, outline: 'none' }} />
          <button onClick={verifyLicense} disabled={verifying}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
            {verifying ? '…' : 'Verify'}
          </button>
        </div>
        {verifyResult && (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: verifyResult.valid ? 'rgba(52,211,153,.06)' : 'rgba(239,68,68,.06)', border: `1px solid ${verifyResult.valid ? 'rgba(52,211,153,.2)' : 'rgba(239,68,68,.2)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: verifyResult.valid ? 6 : 0 }}>
              <span style={{ fontSize: 16 }}>{verifyResult.valid ? '✅' : '❌'}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: verifyResult.valid ? '#34d399' : '#f87171' }}>
                {verifyResult.message}
              </span>
            </div>
            {verifyResult.valid && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginLeft: 24 }}>
                {verifyResult.product_title && <span>Product: {verifyResult.product_title}</span>}
                {verifyResult.buyer_address  && <span>Owner: {verifyResult.buyer_address.slice(0,12)}…</span>}
                <span>Expires: {formatDate(verifyResult.expiry_timestamp)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, background: 'var(--bg-surface)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {(['all', 'active', 'expired', 'revoked'] as const).map(f => {
          const labels = { all: 'All', active: 'Active', expired: 'Expired', revoked: 'Revoked' };
          const colors = { all: 'var(--gold)', active: '#34d399', expired: '#fbbf24', revoked: '#f87171' };
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: active ? 'var(--bg-elevated)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif", outline: active ? '1px solid var(--border)' : 'none' }}>
              {labels[f]}
              <span style={{ marginLeft: 5, fontSize: 11, fontWeight: 700, color: active ? colors[f] : 'var(--text-muted)', background: 'rgba(0,0,0,.2)', padding: '1px 5px', borderRadius: 999 }}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* License cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20, display: 'flex', gap: 14 }}>
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 13, width: '45%' }} />
                <div className="skeleton" style={{ height: 32, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🔑</p>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {filter === 'all' ? 'No licenses yet' : `No ${filter} licenses`}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {filter === 'all' && 'Purchase licensed products to see your keys here'}
          </p>
          {filter === 'all' && (
            <Link href="/" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              Browse Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(license => {
            const status = getLicenseStatus(license);
            const sc     = statusStyle(status);
            const renewable = canRenew(license);

            return (
              <div key={license.id}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, transition: 'border-color .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  {license.product_image ? (
                    <img src={license.product_image} alt=""
                      style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🔑</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {license.product_title || 'Unknown Product'}
                      </h3>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {sc.label}
                      </span>
                      {license.product_category && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(96,165,250,.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,.2)' }}>
                          {license.product_category}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>{LICENSE_TYPE_LABELS[license.license_type] || 'Unknown'}</span>
                      <span>Activations: {license.max_activations === 0 ? `${license.current_activations}/∞` : `${license.current_activations}/${license.max_activations}`}</span>
                      <span>Expires: {formatDate(license.expiry_timestamp)}</span>
                      {license.renewal_count > 0 && <span>Renewed {license.renewal_count}×</span>}
                    </div>
                  </div>
                </div>

                {/* Key */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <code style={{ fontSize: 11, fontFamily: 'monospace', color: status === 'active' ? 'var(--gold-light)' : 'var(--text-muted)', flex: 1, wordBreak: 'break-all', letterSpacing: '0.02em' }}>
                    {license.license_id}
                  </code>
                  <button onClick={() => copyKey(license.license_id)}
                    style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: copied === license.license_id ? 'rgba(52,211,153,.1)' : 'transparent', color: copied === license.license_id ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", flexShrink: 0, transition: 'all .2s' }}>
                    {copied === license.license_id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                {/* Renew button */}
                {renewable && (
                  <button onClick={() => handleRenew(license)} disabled={renewing === license.license_id}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 2px 10px rgba(201,168,76,.25)' }}>
                    {renewing === license.license_id
                      ? '⏳ Renewing…'
                      : status === 'expired'
                      ? `🔄 Renew Now — ${(license.renewal_price / 1e9).toFixed(2)} SUI`
                      : `⚡ Renew Early — ${(license.renewal_price / 1e9).toFixed(2)} SUI`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
