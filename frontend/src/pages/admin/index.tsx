import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { API_URL } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Overview {
  stats: {
    total_products: string; active_products: string;
    total_sellers: string; total_purchases: string;
    total_volume: string; total_disputes: string;
    open_disputes: string; total_messages: string;
    open_messages: string; total_reviews: string;
  };
  revenue:     Array<{ month: string; sales: string; revenue: string }>;
  recentSales: Array<{ id: string; title: string; price: string; buyer: string; created_at: string }>;
  topSellers:  Array<{ address: string; display_name: string; total_sales: number; total_revenue: string; is_banned: boolean; product_count: string }>;
}
interface Seller   { address: string; display_name: string; total_sales: number; total_revenue: string; is_banned: boolean; product_count: string; created_at: string }
interface Product  { id: string; title: string; price: string; seller: string; seller_name: string; is_available: boolean; total_sales: number; category: string; created_at: string }
interface Dispute  { id: number; tx_digest: string; buyer_address: string; reason: string; description: string; status: string; resolution: string; product_title: string; created_at: string }
interface Message  { id: number; name: string; email: string; subject: string; message: string; status: string; wallet_address: string; created_at: string }

type Tab = 'overview' | 'sellers' | 'products' | 'disputes' | 'messages';

// ── Auth gate ─────────────────────────────────────────────────────────────────
function useAdminKey() {
  const [key, setKey]     = useState('');
  const [authed, setAuthed] = useState(false);
  const [input, setInput]   = useState('');
  const [error, setError]   = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_key');
    if (saved) { setKey(saved); setAuthed(true); }
  }, []);

  const login = async () => {
    setError('');
    const res = await fetch(`${API_URL}/api/admin/overview`, {
      headers: { 'x-admin-key': input }
    });
    if (res.ok) {
      sessionStorage.setItem('admin_key', input);
      setKey(input); setAuthed(true);
    } else {
      setError('Invalid admin key');
    }
  };

  return { key, authed, input, setInput, login, error };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sui    = (n: string | number) => (Number(n) / 1e9).toFixed(3);
const fmtDate = (n: string | number) => new Date(Number(n)).toLocaleDateString();
const short  = (addr: string) => `${addr.slice(0,8)}…${addr.slice(-6)}`;

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    green:  'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red:    'from-red-500 to-red-600',
    blue:   'from-blue-500 to-blue-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-semibold opacity-80">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-black mb-0.5">{value}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { key, authed, input, setInput, login, error } = useAdminKey();
  const [tab, setTab]         = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sellers, setSellers]   = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search,  setSearch]    = useState('');
  const [resolveId,   setResolveId]   = useState<number | null>(null);
  const [resolution,  setResolution]  = useState('');

  const apiFetch = useCallback(async (path: string, opts?: RequestInit) => {
    return fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { 'x-admin-key': key, 'Content-Type': 'application/json', ...opts?.headers },
    });
  }, [key]);

  useEffect(() => {
    if (!authed) return;
    loadTab(tab);
  }, [authed, tab]);

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'overview') {
        const r = await apiFetch('/api/admin/overview');
        setOverview(await r.json());
      } else if (t === 'sellers') {
        const r = await apiFetch(`/api/admin/sellers?search=${search}`);
        const d = await r.json();
        setSellers(d.sellers || []);
      } else if (t === 'products') {
        const r = await apiFetch(`/api/admin/products?search=${search}`);
        const d = await r.json();
        setProducts(d.products || []);
      } else if (t === 'disputes') {
        const r = await apiFetch('/api/admin/disputes');
        const d = await r.json();
        setDisputes(d.disputes || []);
      } else if (t === 'messages') {
        const r = await apiFetch('/api/admin/messages');
        const d = await r.json();
        setMessages(d.messages || []);
      }
    } finally { setLoading(false); }
  };

  const banSeller = async (address: string, ban: boolean) => {
    await apiFetch(`/api/admin/sellers/${address}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_banned: ban }),
    });
    setSellers(s => s.map(x => x.address === address ? { ...x, is_banned: ban } : x));
  };

  const toggleProduct = async (id: string, available: boolean) => {
    await apiFetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: available }),
    });
    setProducts(p => p.map(x => x.id === id ? { ...x, is_available: available } : x));
  };

  const resolveDispute = async (id: number, status: string) => {
    await apiFetch(`/api/admin/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution }),
    });
    setDisputes(d => d.map(x => x.id === id ? { ...x, status, resolution } : x));
    setResolveId(null); setResolution('');
  };

  const markMessageRead = async (id: number) => {
    await apiFetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    setMessages(m => m.map(x => x.id === id ? { ...x, status: 'resolved' } : x));
  };

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Digi ChainStore</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Enter admin key..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={login}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors border-none cursor-pointer">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );

  const tabs: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: 'overview',  icon: '📊', label: 'Overview' },
    { id: 'sellers',   icon: '👤', label: 'Sellers' },
    { id: 'products',  icon: '📦', label: 'Products' },
    { id: 'disputes',  icon: '⚖️',  label: 'Disputes', badge: disputes.filter(d => d.status === 'open').length || undefined },
    { id: 'messages',  icon: '✉️',  label: 'Messages', badge: messages.filter(m => m.status === 'open').length || undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <div>
              <h1 className="text-base font-black text-gray-900 leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Digi ChainStore</p>
            </div>
          </div>
          <button onClick={() => { sessionStorage.removeItem('admin_key'); window.location.reload(); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors bg-transparent cursor-pointer ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {t.icon} {t.label}
              {t.badge ? (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        )}

        {/* ── Overview ── */}
        {!loading && tab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon="📦" label="Products"    value={overview.stats.total_products}  sub={`${overview.stats.active_products} active`} color="indigo" />
              <StatCard icon="👤" label="Sellers"     value={overview.stats.total_sellers}   color="purple" />
              <StatCard icon="🛒" label="Sales"       value={overview.stats.total_purchases} color="green" />
              <StatCard icon="💰" label="Volume"      value={`${sui(overview.stats.total_volume)} SUI`} color="orange" />
              <StatCard icon="⚖️"  label="Open Issues" value={Number(overview.stats.open_disputes) + Number(overview.stats.open_messages)} sub={`${overview.stats.open_disputes} disputes · ${overview.stats.open_messages} msgs`} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by month */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">📈 Revenue by Month</h2>
                {overview.revenue.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-6">No data yet</p>
                  : (
                    <div className="space-y-3">
                      {overview.revenue.map(r => {
                        const maxRev = Math.max(...overview.revenue.map(x => Number(x.revenue)));
                        const pct = maxRev > 0 ? (Number(r.revenue) / maxRev) * 100 : 0;
                        return (
                          <div key={r.month}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700">{r.month}</span>
                              <span className="text-indigo-600 font-bold">{sui(r.revenue)} SUI <span className="text-gray-400 font-normal">({r.sales} sales)</span></span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                }
              </div>

              {/* Top sellers */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">🏆 Top Sellers</h2>
                <div className="space-y-2">
                  {overview.topSellers.map((s, i) => (
                    <div key={s.address} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{s.display_name || short(s.address)}</p>
                        <p className="text-xs text-gray-400">{s.total_sales} sales · {s.product_count} products</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-indigo-600">{sui(s.total_revenue)} SUI</p>
                        {s.is_banned && <Badge label="Banned" color="red" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent sales */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">🕒 Recent Sales</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-semibold">Product</th>
                      <th className="text-left pb-2 font-semibold">Buyer</th>
                      <th className="text-right pb-2 font-semibold">Price</th>
                      <th className="text-right pb-2 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentSales.map(s => (
                      <tr key={`${s.id}-${s.created_at}`} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 font-medium text-gray-900 max-w-[180px] truncate">{s.title}</td>
                        <td className="py-2.5 font-mono text-xs text-gray-400">{short(s.buyer)}</td>
                        <td className="py-2.5 text-right text-indigo-600 font-bold">{sui(s.price)} SUI</td>
                        <td className="py-2.5 text-right text-gray-400 text-xs">{fmtDate(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Sellers ── */}
        {!loading && tab === 'sellers' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadTab('sellers')}
                placeholder="Search by address or name..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <button onClick={() => loadTab('sellers')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 border-none cursor-pointer">
                Search
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left p-4 font-semibold">Seller</th>
                    <th className="text-center p-4 font-semibold">Sales</th>
                    <th className="text-center p-4 font-semibold">Revenue</th>
                    <th className="text-center p-4 font-semibold">Products</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                    <th className="text-center p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map(s => (
                    <tr key={s.address} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{s.display_name || '—'}</p>
                        <p className="font-mono text-xs text-gray-400 mt-0.5">{short(s.address)}</p>
                      </td>
                      <td className="p-4 text-center font-medium">{s.total_sales}</td>
                      <td className="p-4 text-center text-indigo-600 font-bold">{sui(s.total_revenue)} SUI</td>
                      <td className="p-4 text-center">{s.product_count}</td>
                      <td className="p-4 text-center">
                        <Badge label={s.is_banned ? 'Banned' : 'Active'} color={s.is_banned ? 'red' : 'green'} />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => banSeller(s.address, !s.is_banned)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
                            s.is_banned
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}>
                          {s.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sellers.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No sellers found</p>
              )}
            </div>
          </div>
        )}

        {/* ── Products ── */}
        {!loading && tab === 'products' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadTab('products')}
                placeholder="Search by title or seller..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <button onClick={() => loadTab('products')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 border-none cursor-pointer">
                Search
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left p-4 font-semibold">Product</th>
                    <th className="text-left p-4 font-semibold">Seller</th>
                    <th className="text-center p-4 font-semibold">Price</th>
                    <th className="text-center p-4 font-semibold">Sales</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                    <th className="text-center p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-semibold text-gray-900 max-w-[200px] truncate">{p.title}</p>
                        <Badge label={p.category} color="blue" />
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">{p.seller_name || short(p.seller)}</td>
                      <td className="p-4 text-center text-indigo-600 font-bold">{sui(p.price)} SUI</td>
                      <td className="p-4 text-center">{p.total_sales}</td>
                      <td className="p-4 text-center">
                        <Badge label={p.is_available ? 'Active' : 'Hidden'} color={p.is_available ? 'green' : 'gray'} />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleProduct(p.id, !p.is_available)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
                            p.is_available
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}>
                          {p.is_available ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No products found</p>
              )}
            </div>
          </div>
        )}

        {/* ── Disputes ── */}
        {!loading && tab === 'disputes' && (
          <div className="space-y-3">
            {disputes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-500 text-sm">No disputes yet</p>
              </div>
            )}
            {disputes.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        label={d.status}
                        color={d.status === 'open' ? 'red' : d.status === 'resolved' ? 'green' : 'yellow'}
                      />
                      <span className="text-xs text-gray-400">{fmtDate(d.created_at)}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{d.reason.replace(/_/g, ' ')}</p>
                    <p className="font-mono text-xs text-gray-400 mt-0.5">Buyer: {short(d.buyer_address)}</p>
                    {d.product_title && <p className="text-xs text-gray-500 mt-0.5">Product: {d.product_title}</p>}
                  </div>
                  {d.status === 'open' && (
                    <button onClick={() => setResolveId(resolveId === d.id ? null : d.id)}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 border-none cursor-pointer shrink-0">
                      Resolve
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{d.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">TX:</p>
                  <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{d.tx_digest.slice(0,20)}…</code>
                </div>

                {d.resolution && (
                  <div className="mt-2 bg-green-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                    <p className="text-sm text-green-800">{d.resolution}</p>
                  </div>
                )}

                {resolveId === d.id && (
                  <div className="mt-3 space-y-2">
                    <textarea value={resolution} onChange={e => setResolution(e.target.value)}
                      placeholder="Enter resolution notes..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => resolveDispute(d.id, 'resolved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-500 border-none cursor-pointer">
                        Mark Resolved
                      </button>
                      <button onClick={() => resolveDispute(d.id, 'rejected')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 border-none cursor-pointer">
                        Reject
                      </button>
                      <button onClick={() => setResolveId(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 border-none cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Messages ── */}
        {!loading && tab === 'messages' && (
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No support messages yet</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${m.status === 'open' ? 'border-indigo-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge label={m.status} color={m.status === 'open' ? 'blue' : 'gray'} />
                      <span className="text-xs text-gray-400">{fmtDate(m.created_at)}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{m.subject || 'Support Request'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.name || 'Anonymous'} · {m.email}</p>
                    {m.wallet_address && (
                      <p className="font-mono text-xs text-gray-400 mt-0.5">{short(m.wallet_address)}</p>
                    )}
                  </div>
                  {m.status === 'open' && (
                    <button onClick={() => markMessageRead(m.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 border-none cursor-pointer shrink-0">
                      Mark Done
                    </button>
                  )}
                </div>
                <div className="mt-3 bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                </div>
                <a href={`mailto:${m.email}?subject=Re: ${m.subject || 'Your support request'}`}
                  className="inline-block mt-2 text-xs text-indigo-600 font-semibold hover:underline">
                  Reply via email →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
