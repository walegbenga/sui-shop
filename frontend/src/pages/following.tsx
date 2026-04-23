// ─────────────────────────────────────────────────────────────
// following.tsx
// ─────────────────────────────────────────────────────────────
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserFollowing } from '@/hooks/useSocialFeatures';
import Link from 'next/link';

export default function Following() {
  const account = useCurrentAccount();
  const { following, loading } = useUserFollowing(account?.address);

  if (!account) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Wallet Not Connected</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect your wallet to view who you're following.</p>
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 2 }}>Following</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sellers you're following</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div className="skeleton" style={{ height: 12, width: '60%' }} />
                <div className="skeleton" style={{ height: 10, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : following.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>👥</p>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Not following anyone yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Follow sellers to keep up with their new products</p>
          <Link href="/" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {following.map((seller: any) => (
            <Link key={seller.address} href={`/seller/${seller.address}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', gap: 14, alignItems: 'center', transition: 'border-color .2s,transform .2s', cursor: 'pointer' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-hover)'; el.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'DM Serif Display',serif", fontSize: 18, flexShrink: 0 }}>
                  {seller.address.slice(2,4).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {seller.address.slice(0,10)}…{seller.address.slice(-8)}
                  </p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>💰 {(Number(seller.total_revenue)/1e9).toFixed(2)} SUI</span>
                    <span>📦 {seller.total_sales} sales</span>
                    <span>👥 {seller.follower_count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
