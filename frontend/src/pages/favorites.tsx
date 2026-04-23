// ─────────────────────────────────────────────────────────────
// favorites.tsx
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProductDetailModal from '@/components/ProductDetailModal';

interface Favorite {
  product_id: string; title: string; price: string;
  image_url: string; category: string; seller: string; favorited_at: string;
}

export default function Favorites() {
  const account = useCurrentAccount();
  const [favorites, setFavorites]           = useState<Favorite[]>([]);
  const [loading, setLoading]               = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);

  useEffect(() => { account?.address ? fetchFavorites() : setLoading(false); }, [account?.address]);

  const fetchFavorites = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:4000/api/users/${account.address}/favorites`);
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch { toast.error('Failed to fetch favorites'); }
    finally { setLoading(false); }
  };

  const handleUnfavorite = async (productId: string) => {
    if (!account?.address) return;
    try {
      const res = await fetch('http://localhost:4000/api/favorites', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: account.address, productId }),
      });
      if (res.ok) { setFavorites(prev => prev.filter(f => f.product_id !== productId)); toast.success('Removed'); }
      else { const e = await res.json(); toast.error(e.error || 'Failed'); }
    } catch (e: any) { toast.error(e.message); }
  };

  const open = (id: string) => { setSelectedProductId(id); setIsModalOpen(true); };

  if (!account) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Wallet Not Connected</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect your wallet to view your favorites.</p>
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 2 }}>Favorites</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Products you've saved</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 160 }} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 13, width: '70%' }} />
                <div className="skeleton" style={{ height: 11, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🤍</p>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No favorites yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Browse and save products you like</p>
          <Link href="/" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {favorites.map(fav => (
            <div key={fav.product_id}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'border-color .25s,box-shadow .25s,transform .2s', cursor: 'pointer' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-hover)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,.4)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'relative' }}>
                <img src={fav.image_url || 'https://via.placeholder.com/220x160'} alt={fav.title}
                  style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                  onClick={() => open(fav.product_id)}
                  onError={e => { e.currentTarget.src = 'https://via.placeholder.com/220x160'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(12,12,15,.5) 0%,transparent 50%)' }} />
                <button
                  onClick={e => { e.stopPropagation(); handleUnfavorite(fav.product_id); }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(12,12,15,.7)', border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ❤️
                </button>
              </div>
              <div style={{ padding: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  onClick={() => open(fav.product_id)}>
                  {fav.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fav.category}</span>
                  <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, color: 'var(--gold-light)' }}>
                    {(Number(fav.price)/1e9).toFixed(2)} <span style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-muted)' }}>SUI</span>
                  </span>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Saved {new Date(fav.favorited_at).toLocaleDateString()}
                </p>
                <button onClick={() => open(fav.product_id)}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', fontFamily: "'DM Sans',sans-serif" }}>
                  View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDetailModal productId={selectedProductId} isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProductId(null); fetchFavorites(); }} />
    </div>
  );
}
