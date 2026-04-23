import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface Follower { follower_address: string; created_at: string; }

export default function Followers() {
  const account = useCurrentAccount();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { if (account?.address) fetchFollowers(); }, [account]);

  const fetchFollowers = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:4000/api/sellers/${account.address}/followers`);
      const data = await res.json();
      setFollowers(data.followers || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (!account) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Wallet Not Connected</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect your wallet to view your followers.</p>
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 2 }}>My Followers</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>People following your products</p>
      </div>

      {loading ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {Array.from({length:4}).map((_,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', gap: 14 }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 12, width: '55%' }} /></div>
              <div className="skeleton" style={{ height: 11, width: 80 }} />
            </div>
          ))}
        </div>
      ) : followers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>👥</p>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No followers yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>When users follow you, they'll appear here</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Total Followers</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(201,168,76,.1)', color: 'var(--gold)' }}>
              {followers.length}
            </span>
          </div>
          {followers.map((f, idx) => (
            <div key={f.follower_address}
              style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: idx < followers.length-1 ? '1px solid var(--border-subtle)' : 'none', gap: 14, transition: 'background .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'DM Serif Display',serif", fontSize: 14, flexShrink: 0 }}>
                {f.follower_address.slice(2,4).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.follower_address}
                </p>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {new Date(f.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
