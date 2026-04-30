import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ProductDetailModal from '@/components/ProductDetailModal';
import { API_URL } from '@/lib/api';

const PACKAGE_ID     = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string; seller: string; title: string; description: string;
  price: number; image_url: string; category: string;
  is_available: boolean; total_sales: number; rating_sum: number;
  rating_count: number; quantity: number; available_quantity: number;
  resellable: boolean; file_cid: string;
}
interface ResaleListing {
  listing_id: string; token_id: string; seller: string; price: string;
  original_product_id: string; product_title: string; product_image: string;
  product_category: string;
}
interface Stats { total_products: number; total_sellers: number; total_purchases: number; }
interface Pagination { page: number; limit: number; totalCount: number; totalPages: number; }

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'All',             icon: '✨', label: 'All' },
  { id: 'Ebook',           icon: '📚', label: 'Ebooks' },
  { id: 'Evideo',          icon: '🎬', label: 'Videos' },
  { id: 'Stickers',        icon: '🎨', label: 'Stickers' },
  { id: 'Software Plugin', icon: '🔌', label: 'Plugins' },
  { id: 'Music',           icon: '🎵', label: 'Music' },
  { id: 'Other',           icon: '📦', label: 'Other' },
];
const SORT_OPTIONS = [
  { label: 'Newest First',    value: 'created_at', order: 'DESC' },
  { label: 'Oldest First',    value: 'created_at', order: 'ASC'  },
  { label: 'Price: Low–High', value: 'price',      order: 'ASC'  },
  { label: 'Price: High–Low', value: 'price',      order: 'DESC' },
  { label: 'Best Rated',      value: 'rating',     order: 'DESC' },
  { label: 'Best Selling',    value: 'total_sales', order: 'DESC' },
];
const PRICE_RANGES = [
  { label: 'All Prices', min: null,  max: null },
  { label: 'Under 1 SUI',min: 0,     max: 1000000000 },
  { label: '1 – 5 SUI',  min: 1000000000, max: 5000000000 },
  { label: 'Over 5 SUI', min: 5000000000, max: null },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const VIDEO_EXT = ['.mp4','.avi','.mov','.mkv','.webm','.wmv','.mpeg'];
const isVideo   = (url: string) => url && VIDEO_EXT.some(e => url.toLowerCase().includes(e));

function Stars({ sum, count }: { sum: number; count: number }) {
  const r = count > 0 ? Math.round(sum / count) : 0;
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3 h-3 ${s <= r ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <article onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
      <div className="relative overflow-hidden bg-gray-50 h-44">
        {product.available_quantity > 0 && product.available_quantity < product.quantity && (
          <span className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {product.available_quantity}/{product.quantity} Left
          </span>
        )}
        {isVideo(product.image_url) ? (
          <>
            <video ref={videoRef} src={product.image_url} className="w-full h-44 object-cover"
              muted preload="metadata"
              onMouseEnter={() => videoRef.current?.play()}
              onMouseLeave={() => { if(videoRef.current){ videoRef.current.pause(); videoRef.current.currentTime=0; }}}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 rounded-full p-2 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </>
        ) : (
          <img src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} alt={product.title}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-indigo-500 mb-1">{product.category}</p>
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{product.title}</h3>
        <p className="text-xs text-gray-400 mb-3 line-clamp-1">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-extrabold text-indigo-600">{(product.price / 1e9).toFixed(2)}</span>
            <span className="text-xs text-gray-400 ml-1">SUI</span>
          </div>
          {product.rating_count > 0 && (
            <div className="flex items-center gap-1">
              <Stars sum={product.rating_sum} count={product.rating_count} />
              <span className="text-xs text-gray-400">({product.rating_count})</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Resale Card ───────────────────────────────────────────────────────────────
function ResaleCard({ listing, onBuy }: { listing: ResaleListing; onBuy: (l: ResaleListing) => void }) {
  return (
    <article className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        <img src={listing.product_image || 'https://via.placeholder.com/400x300?text=Resale'}
          alt={listing.product_title}
          className="w-full h-44 object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Resale'; }}
        />
        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          🔄 Resale
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-purple-500 mb-1">{listing.product_category}</p>
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-3 line-clamp-2">{listing.product_title}</h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-extrabold text-purple-600">{(Number(listing.price) / 1e9).toFixed(2)}</span>
            <span className="text-xs text-gray-400 ml-1">SUI</span>
          </div>
          <button onClick={() => onBuy(listing)}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-500 transition-colors border-none cursor-pointer">
            Buy
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function useTicker(products: Product[]) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!products.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % Math.min(products.length, 8)), 3500);
    return () => clearInterval(id);
  }, [products.length]);
  return products[idx] ?? null;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [products,       setProducts]       = useState<Product[]>([]);
  const [resaleListings, setResaleListings]  = useState<ResaleListing[]>([]);
  const [stats,          setStats]           = useState<Stats | null>(null);
  const [loading,        setLoading]         = useState(true);
  const [resaleLoading,  setResaleLoading]   = useState(true);
  const [selectedId,     setSelectedId]      = useState<string | null>(null);
  const [modalOpen,      setModalOpen]       = useState(false);
  const [activeTab,      setActiveTab]       = useState<'products' | 'resale'>('products');
  const [category,       setCategory]        = useState('All');
  const [priceRange,     setPriceRange]      = useState(PRICE_RANGES[0]);
  const [sort,           setSort]            = useState(SORT_OPTIONS[0]);
  const [search,         setSearch]          = useState('');
  const [searchInput,    setSearchInput]     = useState('');
  const [page,           setPage]            = useState(1);
  const [pagination,     setPagination]      = useState<Pagination>({ page:1, limit:12, totalCount:0, totalPages:0 });
  const marketRef = useRef<HTMLDivElement>(null);
  const ticker = useTicker(products);

  useEffect(() => { fetchProducts(); }, [category, priceRange, sort, search, page]);
  useEffect(() => { fetchResaleListings(); fetchStats(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '12', sortBy: sort.value, sortOrder: sort.order });
      if (category !== 'All')   p.set('category', category);
      if (priceRange.min)       p.set('minPrice', String(priceRange.min));
      if (priceRange.max)       p.set('maxPrice', String(priceRange.max));
      if (search)               p.set('search', search);
      const res  = await fetch(`${API_URL}/api/products?${p}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page:1, limit:12, totalCount:0, totalPages:0 });
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const fetchResaleListings = async () => {
    setResaleLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/resale-listings`);
      const data = await res.json();
      setResaleListings(data.listings || []);
    } catch { setResaleListings([]); }
    finally { setResaleLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch {}
  };

  const handleBuyResale = async (listing: ResaleListing) => {
    if (!account) { toast.error('Please connect your wallet'); return; }
    if (listing.seller === account.address) { toast.error('You cannot buy your own listing'); return; }
    toast.loading(`Buying for ${(Number(listing.price) / 1e9).toFixed(2)} SUI…`, { id: 'resale-buy' });
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(listing.price))]);
      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::purchase_resale`,
        arguments: [tx.object(MARKETPLACE_ID), tx.object(listing.listing_id), coin, tx.object('0x6')],
      });
      signAndExecuteTransaction({ transaction: tx }, {
        onSuccess: () => { toast.success('Resale purchase successful! 🎉', { id: 'resale-buy' }); fetchResaleListings(); },
        onError:  (e: any) => toast.error(e.message || 'Purchase failed', { id: 'resale-buy' }),
      });
    } catch { toast.error('Failed to build transaction', { id: 'resale-buy' }); }
  };

  const openProduct  = (id: string) => { setSelectedId(id); setModalOpen(true); };
  const scrollToMarket = () => {
    setTimeout(() => marketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Ticker */}
        {ticker && (
          <div className="relative bg-white/10 border-b border-white/10 py-2 px-4">
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
              <p className="text-xs text-white/80 truncate">
                <span className="font-semibold text-white">"{ticker.title}"</span>
                {' '}— {(ticker.price / 1e9).toFixed(2)} SUI
              </p>
            </div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 mb-6 border border-white/20">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Built on Sui Blockchain
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 tracking-tight">
              Buy & Sell{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                Digital Products
              </span>
              <br />with Crypto
            </h1>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              The first digital marketplace on Sui where anyone can buy with a credit card.
              No wallet setup needed — just sign in with Google.
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              <button onClick={() => { setActiveTab('products'); scrollToMarket(); }}
                className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-yellow-300 transition-all shadow-lg text-sm border-none cursor-pointer">
                🛍️ Start Shopping
              </button>
              <Link href="/list-product"
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm no-underline">
                💰 Start Selling
              </Link>
            </div>
            {stats && (
              <div className="grid grid-cols-3 gap-4 max-w-sm">
                {[
                  { n: stats.total_products,  label: 'Products' },
                  { n: stats.total_sellers,   label: 'Sellers' },
                  { n: stats.total_purchases, label: 'Sales' },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                    <p className="text-xl font-black text-white">{s.n ?? 0}</p>
                    <p className="text-xs text-white/60 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-10 fill-gray-50" preserveAspectRatio="none">
            <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 Z"/>
          </svg>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-2">How it works</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Buy or sell in minutes — no crypto experience needed</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-indigo-500 mb-3 uppercase tracking-widest">For Buyers</p>
              {[
                { n:'1', icon:'👤', t:'Sign in with Google',  s:'A crypto wallet is created for you automatically.' },
                { n:'2', icon:'💳', t:'Add funds',            s:'Buy SUI with your card via MoonPay or Ramp.' },
                { n:'3', icon:'📦', t:'Buy & download',       s:'Purchase any product. File delivered instantly via IPFS.' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 mb-4 last:mb-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">{s.n}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{s.icon} {s.t}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.s}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-purple-500 mb-3 uppercase tracking-widest">For Sellers</p>
              {[
                { n:'1', icon:'🔑', t:'Create your account',  s:'Sign in with Google or your Sui wallet.' },
                { n:'2', icon:'📤', t:'Upload your product',  s:'Upload any digital file — ebook, plugin, music, video.' },
                { n:'3', icon:'💰', t:'Earn SUI',             s:'Get paid directly. Withdraw to your bank anytime.' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 mb-4 last:mb-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0">{s.n}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{s.icon} {s.t}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CATEGORY CARDS ══════════════════════════════════════════════════ */}
      <section className="bg-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-5">Browse by Category</h2>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => { setCategory(cat.id); setActiveTab('products'); scrollToMarket(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer group bg-white">
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-indigo-700 text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MARKETPLACE ═════════════════════════════════════════════════════ */}
      <section ref={marketRef} className="bg-gray-50 py-10 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Tabs */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
              {[
                { key: 'products', label: '🛍️ Products', count: pagination.totalCount },
                { key: 'resale',   label: '🔄 Resale',   count: resaleListings.length  },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${
                    activeTab === t.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 bg-transparent'
                  }`}>
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
            {account && (
              <Link href="/list-product"
                className="hidden sm:inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors no-underline">
                + List Product
              </Link>
            )}
          </div>

          {/* ── Products tab ── */}
          {activeTab === 'products' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                      <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 border-none cursor-pointer">Search</button>
                  </form>
                  <select value={`${sort.value}-${sort.order}`}
                    onChange={e => { const [v,o] = e.target.value.split('-'); setSort(SORT_OPTIONS.find(s => s.value===v && s.order===o) || SORT_OPTIONS[0]); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none">
                    {SORT_OPTIONS.map(o => <option key={o.label} value={`${o.value}-${o.order}`}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => { setCategory(cat.id); setPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                        category === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRICE_RANGES.map(r => (
                    <button key={r.label} onClick={() => { setPriceRange(r); setPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                        priceRange.label === r.label ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {!loading && pagination.totalCount > 0 && (
                <p className="text-xs text-gray-400 mb-4">
                  Showing {(page-1)*12+1}–{Math.min(page*12, pagination.totalCount)} of {pagination.totalCount} products
                </p>
              )}

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({length:8}).map((_,i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                      <div className="h-44 bg-gray-100 animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                        <div className="h-5 bg-gray-100 rounded animate-pulse w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
                  <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                  <button onClick={() => { setCategory('All'); setPriceRange(PRICE_RANGES[0]); setSearch(''); setSearchInput(''); }}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-indigo-500">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(p => <ProductCard key={p.id} product={p} onClick={() => openProduct(p.id)} />)}
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 bg-white cursor-pointer">← Prev</button>
                      <span className="px-4 py-2 text-sm text-gray-500">{page} / {pagination.totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(pagination.totalPages,p+1))} disabled={page===pagination.totalPages}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 bg-white cursor-pointer">Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Resale tab ── */}
          {activeTab === 'resale' && (
            <>
              <p className="text-sm text-gray-500 mb-6 bg-purple-50 rounded-xl p-3 border border-purple-100">
                🔄 Resellable products listed by community members. Original creators receive royalties on every resale automatically.
              </p>
              {resaleLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({length:4}).map((_,i) => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
                </div>
              ) : resaleListings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-4">🔄</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No resale listings yet</h3>
                  <p className="text-gray-400 text-sm">Purchase a resellable product to list it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {resaleListings.map(l => <ResaleCard key={l.listing_id} listing={l} onBuy={handleBuyResale} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 py-14 px-4 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to start selling?</h2>
        <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
          Zero listing fees — we only take 2% when you make a sale.
        </p>
        <Link href="/list-product"
          className="inline-block px-8 py-3 bg-white text-indigo-700 font-black rounded-xl hover:bg-yellow-300 hover:text-indigo-900 transition-all shadow-lg no-underline text-sm">
          Upload Your First Product →
        </Link>
      </section>

      {/* Modal */}
      {modalOpen && selectedId && (
        <ProductDetailModal
          productId={selectedId}
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedId(null); fetchResaleListings(); }}
        />
      )}
    </div>
  );
}
