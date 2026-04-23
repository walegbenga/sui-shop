import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { API_URL } from '@/lib/api';

interface AnalyticsData {
  stats: { total_products: string; available_products: string; sold_products: string; avg_price: string; total_sales_count: string; };
  revenueByMonth: Array<{ month: string; sales: string; revenue: string; }>;
  topProducts:    Array<{ id: string; title: string; total_sales: string; price: string; rating_sum: string; rating_count: string; }>;
  recentSales:    Array<{ id: string; title: string; price: string; created_at: string; buyer: string; }>;
}

const EMPTY: AnalyticsData = {
  stats: { total_products: '0', available_products: '0', sold_products: '0', avg_price: '0', total_sales_count: '0' },
  revenueByMonth: [], topProducts: [], recentSales: [],
};

export default function Analytics() {
  const account = useCurrentAccount();
  const [data,    setData]    = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (account?.address) fetchAnalytics();
    else setLoading(false);
  }, [account?.address]);

  const fetchAnalytics = async () => {
    if (!account?.address) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/sellers/${account.address}/analytics`);
      const json = await res.json();
      if (json.error) { setData(EMPTY); return; }
      setData({
        stats:          json.stats          || EMPTY.stats,
        revenueByMonth: Array.isArray(json.revenueByMonth) ? json.revenueByMonth : [],
        topProducts:    Array.isArray(json.topProducts)    ? json.topProducts    : [],
        recentSales:    Array.isArray(json.recentSales)    ? json.recentSales    : [],
      });
    } catch (e: any) { setError(e.message); setData(EMPTY); }
    finally { setLoading(false); }
  };

  if (!account) return (
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
        <p className="text-gray-500 text-sm">Connect your wallet to view analytics.</p>
      </div>
    </div>
  );

  const totalRevenue = data.revenueByMonth.reduce((s, m) => s + Number(m.revenue || 0), 0);

  const cards = [
    { label: 'Total Revenue',   value: `${(totalRevenue/1e9).toFixed(2)} SUI`, sub: 'All time',          icon: '💰', bg: 'linear-gradient(135deg,#065f46,#059669)' },
    { label: 'Total Sales',     value: data.stats.total_sales_count || '0',    sub: 'Products sold',     icon: '📦', bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)' },
    { label: 'Products Listed', value: data.stats.total_products    || '0',    sub: `${data.stats.available_products||0} available`, icon: '🛍️', bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)' },
    { label: 'Avg Price',       value: `${data.stats.avg_price ? (Number(data.stats.avg_price)/1e9).toFixed(2) : '0.00'} SUI`, sub: 'Per product', icon: '📈', bg: 'linear-gradient(135deg,#7c2d12,#ea580c)' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📊 Sales Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Track your performance and revenue</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm">⚠️ Could not load analytics: {error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} style={{ background: c.bg }} className="rounded-xl p-5 text-white">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium opacity-80">{c.label}</p>
              <span className="text-xl">{c.icon}</span>
            </div>
            <p className="text-2xl font-bold mb-1">{loading ? '—' : c.value}</p>
            <p className="text-xs opacity-70">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue by month */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Revenue by Month</h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : data.revenueByMonth.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">No revenue data yet</p>
        ) : (
          <div className="space-y-4">
            {data.revenueByMonth.map(m => {
              const pct = totalRevenue > 0 ? Math.min((Number(m.revenue)/totalRevenue)*100, 100) : 0;
              return (
                <div key={m.month}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{m.month}</span>
                    <span className="text-sm">
                      <span className="font-bold text-indigo-600">{(Number(m.revenue)/1e9).toFixed(2)} SUI</span>
                      <span className="text-gray-400 ml-2">({m.sales} sales)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Products</h2>
          {loading ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
          : data.topProducts.length === 0 ? <p className="text-gray-400 text-center py-8 text-sm">No products yet</p>
          : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.total_sales} sales{Number(p.rating_count)>0 ? ` · ⭐ ${(Number(p.rating_sum)/Number(p.rating_count)).toFixed(1)}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 shrink-0">{(Number(p.price)/1e9).toFixed(2)} SUI</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sales */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🕒 Recent Sales</h2>
          {loading ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
          : data.recentSales.length === 0 ? <p className="text-gray-400 text-center py-8 text-sm">No sales yet</p>
          : (
            <div className="space-y-3">
              {data.recentSales.map(s => (
                <div key={`${s.id}-${s.created_at}`} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">{s.title}</p>
                    <span className="text-sm font-bold text-green-600 shrink-0">+{(Number(s.price)/1e9).toFixed(2)} SUI</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="font-mono">{s.buyer.slice(0,10)}…{s.buyer.slice(-6)}</span>
                    <span>{new Date(Number(s.created_at)).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
