import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ListItemSkeleton from '@/components/skeletons/ListItemSkeleton';
import ProductDetailModal from '@/components/ProductDetailModal';

interface Product {
  id: string; title: string; description: string; price: string;
  imageUrl: string; category: string; seller: string; isAvailable: boolean;
  totalSales: string; ratingSum: string; ratingCount: string;
  quantity: number; available_quantity: number; resellable: boolean; file_cid?: string;
}

const FILTERS = ['all', 'available', 'sold'] as const;

export default function MyProducts() {
  const account = useCurrentAccount();
  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<typeof FILTERS[number]>('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen]     = useState(false);

  useEffect(() => { if (account?.address) fetchProducts(); }, [account]);

  const fetchProducts = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:4000/api/sellers/${account.address}/products`);
      const data = await res.json();
      setProducts((data.products || []).map((p: any) => ({
        id: p.id, title: p.title, description: p.description, price: p.price,
        imageUrl: p.image_url, category: p.category, seller: p.seller,
        isAvailable: p.is_available, totalSales: p.total_sales,
        ratingSum: p.rating_sum, ratingCount: p.rating_count,
        quantity: p.quantity || 0, available_quantity: p.available_quantity || 0,
        resellable: p.resellable || false, file_cid: p.file_cid || '',
      })));
    } catch { toast.error('Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`http://localhost:4000/api/products/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller: account?.address }),
      });
      if (res.ok) { toast.success('Deleted'); fetchProducts(); }
      else { const e = await res.json(); toast.error(e.error || 'Failed'); }
    } catch (e: any) { toast.error(e.message); }
  };

  if (!account) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Wallet Not Connected</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connect your wallet to manage your products.</p>
      </div>
    </div>
  );

  const counts = { all: products.length, available: products.filter(p => p.isAvailable).length, sold: products.filter(p => !p.isAvailable).length };
  const filtered = products.filter(p => filter === 'all' || (filter === 'available' ? p.isAvailable : !p.isAvailable));

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'var(--text-primary)', marginBottom: 2 }}>My Products</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Manage your listed digital products</p>
        </div>
        <Link href="/list-product"
          style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 2px 12px rgba(201,168,76,.3)' }}>
          + List New Product
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, background: 'var(--bg-surface)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {FILTERS.map(f => {
          const labels = { all: 'All', available: 'Available', sold: 'Sold Out' };
          const colors = { all: 'var(--gold)', available: '#34d399', sold: '#f87171' };
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
                outline: active ? `1px solid var(--border)` : 'none',
              }}>
              {labels[f]}
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: active ? colors[f] : 'var(--text-muted)', background: active ? `rgba(0,0,0,.2)` : 'transparent', padding: '1px 5px', borderRadius: 999 }}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {Array.from({length: 5}).map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 18 }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>📦</p>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {filter === 'all' ? "You haven't listed any products yet" : `No ${filter} products`}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {filter === 'all' && 'Start selling your digital products on Sui blockchain'}
          </p>
          {filter === 'all' && (
            <Link href="/list-product" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: '#0c0c0f', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              + List Product
            </Link>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.map((product, idx) => (
            <div key={product.id}
              style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: idx < filtered.length-1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background .15s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              onClick={() => { setSelectedProductId(product.id); setIsModalOpen(true); }}
            >
              <img src={product.imageUrl || 'https://via.placeholder.com/72'} alt={product.title}
                style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                onError={e => { e.currentTarget.src = 'https://via.placeholder.com/72'; }} />

              <div style={{ marginLeft: 14, flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{product.description}</p>
                  </div>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'var(--gold-light)', flexShrink: 0 }}>
                    {(Number(product.price)/1e9).toFixed(2)} <span style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-muted)' }}>SUI</span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(96,165,250,.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,.2)' }}>
                    {product.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {product.totalSales} sold
                  </span>
                  {product.quantity > 1 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {product.available_quantity}/{product.quantity} left
                    </span>
                  )}
                  {product.resellable && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(139,92,246,.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,.2)' }}>
                      🔄 Resellable
                    </span>
                  )}
                  {product.file_cid && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,.08)', color: '#34d399', border: '1px solid rgba(52,211,153,.2)' }}>
                      📁 File
                    </span>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {product.isAvailable ? (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,.08)', color: '#34d399', border: '1px solid rgba(52,211,153,.2)' }}>Available</span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(239,68,68,.08)', color: '#f87171', border: '1px solid rgba(239,68,68,.2)' }}>Sold Out</span>
                    )}
                    {product.isAvailable && (
                      <>
                        <Link href={`/edit-product/${product.id}`} onClick={e => e.stopPropagation()}
                          style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
                          Edit
                        </Link>
                        <button onClick={e => { e.stopPropagation(); handleDelete(product.id, product.title); }}
                          style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDetailModal productId={selectedProductId} isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProductId(null); fetchProducts(); }} />
    </div>
  );
}
