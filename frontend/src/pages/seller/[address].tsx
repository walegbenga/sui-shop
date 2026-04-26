import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useFollowSeller } from '@/hooks/useSocialFeatures';
import ProductDetailModal from '@/components/ProductDetailModal';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Seller {
  address: string; display_name: string; bio: string;
  avatar_url: string; twitter_handle: string; website_url: string;
  total_sales: number; total_revenue: string; follower_count: number;
  products_listed: number; is_banned: boolean; created_at: string;
}
interface Product {
  id: string; title: string; description: string; price: string;
  image_url: string; category: string; is_available: boolean;
  total_sales: number; rating_sum: number; rating_count: number;
  available_quantity: number; quantity: number;
}
interface Review {
  product_id: string; reviewer: string; rating: number;
  comment: string; created_at: string; product_title: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const short  = (a: string) => `${a.slice(0,8)}…${a.slice(-6)}`;
const fmtDate = (n: string | number) =>
  new Date(Number(n)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ seller, size = 'lg' }: { seller: Seller; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-24 h-24 text-2xl' : 'w-10 h-10 text-sm';
  if (seller.avatar_url) {
    return (
      <img src={seller.avatar_url} alt={seller.display_name}
        className={`${dim} rounded-full object-cover border-4 border-white shadow-md`}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black border-4 border-white shadow-md`}>
      {(seller.display_name || seller.address).slice(0,2).toUpperCase()}
    </div>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────────
function EditProfileModal({ seller, onSave, onClose }: {
  seller: Seller;
  onSave: (data: Partial<Seller>) => Promise<void>;
  onClose: () => void;
}) {
  const [name,    setName]    = useState(seller.display_name || '');
  const [bio,     setBio]     = useState(seller.bio || '');
  const [avatar,  setAvatar]  = useState(seller.avatar_url || '');
  const [twitter, setTwitter] = useState(seller.twitter_handle || '');
  const [website, setWebsite] = useState(seller.website_url || '');
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ display_name: name, bio, avatar_url: avatar, twitter_handle: twitter, website_url: website });
    setSaving(false);
    onClose();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none bg-transparent border-none cursor-pointer">×</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Avatar URL */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Profile Picture URL</label>
            <input value={avatar} onChange={e => setAvatar(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className={inputCls} />
            {avatar && (
              <div className="mt-2 flex items-center gap-3">
                <img src={avatar} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                <p className="text-xs text-gray-400">Preview</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Paste a URL to your profile photo (Imgur, Google Photos etc.)</p>
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Display Name <span className="text-gray-400">(max 50 chars)</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={50}
              placeholder="Your store name"
              className={inputCls} />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Bio <span className="text-gray-400">(max 500 chars)</span>
            </label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500}
              placeholder="Tell buyers about yourself and what you sell..."
              rows={4}
              className={`${inputCls} resize-none`} />
            <p className="text-xs text-gray-300 text-right mt-0.5">{bio.length}/500</p>
          </div>

          {/* Twitter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Twitter / X Handle</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
              <input value={twitter} onChange={e => setTwitter(e.target.value.replace('@',''))} maxLength={50}
                placeholder="yourhandle"
                className={`${inputCls} pl-8`} />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} maxLength={200}
              placeholder="https://yourwebsite.com"
              className={inputCls} />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors border-none cursor-pointer ${
              saving ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerProfilePage() {
  const router  = useRouter();
  const { address } = router.query as { address: string };
  const account = useCurrentAccount();

  const [seller,   setSeller]   = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [modalProductId, setModalProductId] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const isOwner = account?.address === address;

  const { isFollowing, loading: followLoading, toggleFollow } =
    useFollowSeller(address, account?.address);

  useEffect(() => { if (address) fetchAll(); }, [address]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sellerRes, productsRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/api/sellers/${address}`),
        fetch(`${API_URL}/api/sellers/${address}/products`),
        fetch(`${API_URL}/api/sellers/${address}/reviews`),
      ]);
      const [sellerData, productsData, reviewsData] = await Promise.all([
        sellerRes.json(), productsRes.json(), reviewsRes.json(),
      ]);
      setSeller(sellerData.seller || sellerData);
      setProducts(productsData.products || []);
      setReviews(reviewsData.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (data: Partial<Seller>) => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/api/sellers/${address}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.seller) {
        setSeller(json.seller);
        toast.success('Profile updated!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse border-4 border-white" />
          </div>
          <div className="h-6 bg-gray-100 rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-100" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!seller) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Seller not found</h2>
      <p className="text-gray-400 text-sm">This seller doesn't exist or has been removed.</p>
    </div>
  );

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Profile card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="px-6 pb-6">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar seller={seller} size="lg" />

            <div className="flex gap-2 pb-1">
              {isOwner ? (
                <button onClick={() => setShowEdit(true)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                  ✏️ Edit Profile
                </button>
              ) : account && (
                <button onClick={toggleFollow} disabled={followLoading}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors border-none cursor-pointer shadow-sm ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}>
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Name + address */}
          <div className="mb-3">
            <h1 className="text-2xl font-black text-gray-900">
              {seller.display_name || 'Anonymous Seller'}
            </h1>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{seller.address}</p>
          </div>

          {/* Bio */}
          {seller.bio && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 max-w-xl">
              {seller.bio}
            </p>
          )}

          {/* Social links */}
          {(seller.twitter_handle || seller.website_url) && (
            <div className="flex gap-3 mb-4 flex-wrap">
              {seller.twitter_handle && (
                <a href={`https://twitter.com/${seller.twitter_handle}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors no-underline">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  @{seller.twitter_handle}
                </a>
              )}
              {seller.website_url && (
                <a href={seller.website_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors no-underline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  Website
                </a>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '📦', label: 'Sales',     value: seller.total_sales },
              { icon: '💰', label: 'Revenue',   value: `${(Number(seller.total_revenue)/1e9).toFixed(2)} SUI` },
              { icon: '👥', label: 'Followers', value: seller.follower_count },
              { icon: '⭐', label: 'Avg Rating',value: reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : 'No reviews' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-base font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{s.icon} {s.label}</p>
              </div>
            ))}
          </div>

          {/* Member since */}
          {seller.created_at && Number(seller.created_at) > 0 && (
            <p className="text-xs text-gray-300 mt-3">
              Member since {fmtDate(seller.created_at)}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-2xl p-1.5">
        <button onClick={() => setActiveTab('products')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${
            activeTab === 'products' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 bg-transparent hover:text-gray-700'
          }`}>
          📦 Products ({products.length})
        </button>
        <button onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${
            activeTab === 'reviews' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 bg-transparent hover:text-gray-700'
          }`}>
          ⭐ Reviews ({reviews.length})
        </button>
      </div>

      {/* ── Products tab ─────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📦</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products yet</h3>
            <p className="text-gray-400 text-sm">This seller hasn't listed any products.</p>
            {isOwner && (
              <a href="/list-product"
                className="inline-block mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors no-underline">
                + List Your First Product
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map(p => (
              <article key={p.id}
                onClick={() => setModalProductId(p.id)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
                <div className="relative h-40 overflow-hidden bg-gray-50">
                  {!p.is_available && (
                    <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
                    </div>
                  )}
                  <img src={p.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={p.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-indigo-500 mb-0.5">{p.category}</p>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-2">{p.title}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-indigo-600">{(Number(p.price)/1e9).toFixed(2)}</span>
                      <span className="text-xs text-gray-400 ml-1">SUI</span>
                    </div>
                    {p.rating_count > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Stars rating={Math.round(p.rating_sum / p.rating_count)} />
                        <span className="text-xs text-gray-400">({p.rating_count})</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {/* ── Reviews tab ──────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">⭐</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No reviews yet</h3>
            <p className="text-gray-400 text-sm">Reviews appear here after buyers rate purchases.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Rating summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-4">
                <div className="text-center shrink-0">
                  <p className="text-4xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                  <Stars rating={Math.round(avgRating)} />
                  <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-3 shrink-0">{star}</span>
                        <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-400 w-4 text-right shrink-0">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual reviews */}
            {reviews.map((r, i) => (
              <div key={`${r.product_id}-${r.reviewer}-${i}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {r.reviewer.slice(2,4).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 font-mono">{short(r.reviewer)}</p>
                      <p className="text-xs text-gray-400">{fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.product_title && (
                  <p className="text-xs text-indigo-500 font-semibold mb-2">re: {r.product_title}</p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Edit modal */}
      {showEdit && seller && (
        <EditProfileModal
          seller={seller}
          onSave={handleSaveProfile}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Product modal */}
      {modalProductId && (
        <ProductDetailModal
          productId={modalProductId}
          isOpen={!!modalProductId}
          onClose={() => setModalProductId(null)}
        />
      )}
    </div>
  );
}
