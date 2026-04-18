import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { API_URL } from '@/lib/api';

interface AnalyticsData {
  stats: {
    total_products: string;
    available_products: string;
    sold_products: string;
    avg_price: string;
    total_sales_count: string;
  };
  revenueByMonth: Array<{ month: string; sales: string; revenue: string; }>;
  topProducts: Array<{ id: string; title: string; total_sales: string; price: string; rating_sum: string; rating_count: string; }>;
  recentSales: Array<{ id: string; title: string; price: string; created_at: string; buyer: string; }>;
}

const EMPTY: AnalyticsData = {
  stats: { total_products: '0', available_products: '0', sold_products: '0', avg_price: '0', total_sales_count: '0' },
  revenueByMonth: [], topProducts: [], recentSales: [],
};

export default function Analytics() {
  const account   = useCurrentAccount();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (account?.address) fetchAnalytics();
    else setLoading(false);
  }, [account?.address]);

  const fetchAnalytics = async () => {
    if (!account?.address) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/sellers/${account.address}/analytics`);
      const data = await res.json();
      if (data.error) { setAnalytics(EMPTY); return; }
      setAnalytics({
        stats:          data.stats          || EMPTY.stats,
        revenueByMonth: Array.isArray(data.revenueByMonth) ? data.revenueByMonth : [],
        topProducts:    Array.isArray(data.topProducts)    ? data.topProducts    : [],
        recentSales:    Array.isArray(data.recentSales)    ? data.recentSales    : [],
      });
    } catch (e: any) { setError(e.message); setAnalytics(EMPTY); }
    finally { setLoading(false); }
  };

  if (!account) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Wallet Not Connected</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect your wallet to view analytics.</p>
      </div>
    </div>
  );

  const d = analytics ?? EMPTY;
  const totalRevenue = d.revenueByMonth.reduce((s, m) => s + Number(m.revenue || 0), 0);

  const cards = [
    { label: 'Total Revenue',   value: `${(totalRevenue/1e9).toFixed(2)} SUI`, sub: 'All time',          icon: '💰', g: 'linear-gradient(135deg,#065f46,#059669)' },
    { label: 'Total Sales',     value: d.stats.total_sales_count || '0',      sub: 'Products sold',    icon: '📦', g: 'linear-gradient(135deg,#1e3a5f,#2563eb)' },
    { label: 'Products Listed', value: d.stats.total_products || '0',         sub: `${d.stats.available_products||0} available`, icon: '🛍️', g: 'linear-gradient(135deg,#4c1d95,#7c3aed)' },
    { label: 'Avg Price',       value: `${d.stats.avg_price ? (Number(d.stats.avg_price)/1e9).toFixed(2) : '0.00'} SUI`, sub: 'Per product', icon: '📈', g: 'linear-gradient(135deg,#7c2d12,#ea580c)' },
  ];

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 4 }}>Sales Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Track your performance and revenue</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#f87171' }}>⚠️ Could not load analytics: {error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: c.g, borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{c.label}</p>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
            </div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'white', marginBottom: 4 }}>
              {loading ? '—' : c.value}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, gridColumn: '1 / -1' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginBottom: 16 }}>Revenue by Month</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
            </div>
          ) : d.revenueByMonth.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>No revenue data yet</p>
          ) : d.revenueByMonth.map(m => {
            const pct = totalRevenue > 0 ? Math.min((Number(m.revenue)/totalRevenue)*100, 100) : 0;
            return (
              <div key={m.month} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{m.month}</span>
                  <span style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--gold-light)', fontFamily: "'DM Serif Display',serif" }}>{(Number(m.revenue)/1e9).toFixed(2)} SUI</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({m.sales} sales)</span>
                  </span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 999, height: 8 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--gold-dim),var(--gold))' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginBottom: 16 }}>🏆 Top Products</h2>
          {loading ? <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
          : d.topProducts.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No products yet</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.topProducts.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-dim),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c0c0f', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.total_sales} sales{Number(p.rating_count)>0 ? ` · ⭐ ${(Number(p.rating_sum)/Number(p.rating_count)).toFixed(1)}` : ''}</p>
                  </div>
                  <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 13, color: 'var(--gold-light)', flexShrink: 0 }}>{(Number(p.price)/1e9).toFixed(2)} SUI</span>
                </div>
              ))}
            </div>}
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginBottom: 16 }}>🕒 Recent Sales</h2>
          {loading ? <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
          : d.recentSales.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No sales yet</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.recentSales.map(s => (
                <div key={`${s.id}-${s.created_at}`} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{s.title}</p>
                    <span style={{ fontSize: 13, color: '#34d399', flexShrink: 0, fontFamily: "'DM Serif Display',serif" }}>+{(Number(s.price)/1e9).toFixed(2)} SUI</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'monospace' }}>{s.buyer.slice(0,10)}…{s.buyer.slice(-6)}</span>
                    <span>{new Date(Number(s.created_at)).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>}
        </div>

      </div>
    </div>
  );
}
