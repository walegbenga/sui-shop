import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProductDetailModal from '@/components/ProductDetailModal';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useFavoriteProduct } from '@/hooks/useSocialFeatures';
import { Transaction } from '@mysten/sui/transactions';
import VerifiedBadge from '@/components/VerifiedBadge';

const PACKAGE_ID    = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Books'];
const PRICE_RANGES = [
  { label: 'Any Price',      min: null,       max: null       },
  { label: '< 1 SUI',        min: null,       max: 1000000000 },
  { label: '1 – 5 SUI',      min: 1000000000, max: 5000000000 },
  { label: '> 5 SUI',        min: 5000000000, max: null       },
];
const SORT_OPTIONS = [
  { label: 'Newest',         value: 'created_at', order: 'DESC' },
  { label: 'Price ↑',        value: 'price',      order: 'ASC'  },
  { label: 'Price ↓',        value: 'price',      order: 'DESC' },
  { label: 'Top Sellers',    value: 'total_sales', order: 'DESC' },
];

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  seller: string;
  is_available: boolean;
  total_sales: string;
  quantity: number;
  available_quantity: number;
  resellable: boolean;
  file_cid?: string;
  seller_is_verified?: boolean;
}

interface ResaleListing {
  listing_id: string;
  token_id: string;
  seller: string;
  price: string;
  original_product_id: string;
  is_active: boolean;
  created_at: string;
  product_title?: string;
  product_image?: string;
  product_category?: string;
  product_description?: string;
  original_seller?: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// ── Favourite Button ──────────────────────────────────────────────────────────
function FavoriteButton({ productId }: { productId: string }) {
  const account = useCurrentAccount();
  const { isFavorited, loading, toggleFavorite } = useFavoriteProduct(productId, account?.address);
  if (!account) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
      disabled={loading}
      className="absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-sm transition-all"
      style={{ background: 'rgba(12,12,15,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {isFavorited
        ? <HeartIconSolid className="h-4 w-4" style={{ color: '#f87171' }} />
        : <HeartIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
    </button>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer animate-fade-up"
      style={{ overflow: 'hidden' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(12,12,15,0.6) 0%, transparent 50%)' }}
        />

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {!product.is_available && (
            <span className="badge badge-red text-xs">Sold Out</span>
          )}
          {product.is_available && product.quantity > 1 && (
            <span className="badge badge-gold text-xs">
              {product.available_quantity}/{product.quantity}
            </span>
          )}
          {product.resellable && (
            <span className="badge badge-purple text-xs">Resellable</span>
          )}
        </div>

        <FavoriteButton productId={product.id} />

        {/* Verified seller corner indicator */}
        {product.seller_is_verified && (
          <div className="absolute bottom-2 right-2">
            <VerifiedBadge type="seller" size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-semibold text-sm truncate flex-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.title}
          </h3>
          <span className="badge badge-blue flex-shrink-0">{product.category}</span>
        </div>

        <p
          className="text-xs line-clamp-2 mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-lg font-bold"
              style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--gold-light)' }}
            >
              {(Number(product.price) / 1e9).toFixed(2)}
            </span>
            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>SUI</span>
          </div>
          {Number(product.total_sales) > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {product.total_sales} sold
            </span>
          )}
        </div>

        <Link
  href={`/seller/${product.seller}`}
  onClick={(e) => e.stopPropagation()}
  className="mt-2 text-xs text-gray-500 hover:text-indigo-600 block truncate transition-colors flex items-center gap-1"
>
  By: {product.seller.slice(0, 10)}...{product.seller.slice(-8)}
  {product.seller_is_verified && <VerifiedBadge type="seller" size="sm" />}
</Link>
      </div>
    </div>
  );
}

// ── Resale Card ───────────────────────────────────────────────────────────────
function ResaleCard({
  listing,
  onBuy,
  onViewProduct,
}: {
  listing: ResaleListing;
  onBuy: (listing: ResaleListing) => void;
  onViewProduct: (productId: string) => void;
}) {
  const account = useCurrentAccount();
  const isOwner = account?.address === listing.seller;

  return (
    <div
      className="card cursor-pointer animate-fade-up"
      style={{ overflow: 'hidden' }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={listing.product_image || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={listing.product_title || 'Resale'}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
          onClick={() => onViewProduct(listing.original_product_id)}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(12,12,15,0.6) 0%, transparent 50%)' }}
        />
        <div className="absolute top-2 right-2">
          <span className="badge badge-purple">🔄 Resale</span>
        </div>
      </div>

      <div className="p-4">
        <h3
          className="font-semibold text-sm truncate mb-1"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => onViewProduct(listing.original_product_id)}
        >
          {listing.product_title || 'Unknown Product'}
        </h3>
        <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
          {listing.product_description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span
              className="text-lg font-bold"
              style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--gold-light)' }}
            >
              {(Number(listing.price) / 1e9).toFixed(2)}
            </span>
            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>SUI</span>
          </div>
          {listing.product_category && (
            <span className="badge badge-blue">{listing.product_category}</span>
          )}
        </div>

       <p className="text-xs text-gray-400 mb-3 truncate flex items-center gap-1">
  Seller: {listing.seller.slice(0, 8)}...{listing.seller.slice(-6)}
</p>

        {isOwner ? (
          <div
            className="w-full py-2 rounded-xl text-xs font-medium text-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            Your Listing
          </div>
        ) : (
          <button
            onClick={() => onBuy(listing)}
            className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              color: 'white',
              boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
            }}
          >
            Buy Resale
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [products, setProducts]           = useState<Product[]>([]);
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([]);
  const [loading, setLoading]             = useState(true);
  const [resaleLoading, setResaleLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [activeTab, setActiveTab]         = useState<'products' | 'resale'>('products');

  const [selectedCategory, setSelectedCategory]     = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);
  const [searchQuery, setSearchQuery]               = useState('');
  const [sortBy, setSortBy]                         = useState(SORT_OPTIONS[0]);
  const [currentPage, setCurrentPage]               = useState(1);
  const [pagination, setPagination]                 = useState<Pagination>({
    page: 1, limit: 12, totalCount: 0, totalPages: 0,
  });

  useEffect(() => { fetchProducts(); }, [selectedCategory, selectedPriceRange, searchQuery, sortBy, currentPage]);
  useEffect(() => { fetchResaleListings(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy.value,
        sortOrder: sortBy.order,
      });
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPriceRange.min !== null) params.append('minPrice', selectedPriceRange.min.toString());
      if (selectedPriceRange.max !== null) params.append('maxPrice', selectedPriceRange.max.toString());
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res  = await fetch(`http://localhost:4000/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 12, totalCount: 0, totalPages: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchResaleListings = async () => {
    setResaleLoading(true);
    try {
      const res  = await fetch('http://localhost:4000/api/resale-listings');
      const data = await res.json();
      setResaleListings(data.listings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setResaleLoading(false);
    }
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
    } catch {
      toast.error('Failed to build transaction', { id: 'resale-buy' });
    }
  };

  const openProduct = (id: string) => { setSelectedProductId(id); setIsModalOpen(true); };

  return (
    <div className="animate-fade-in">

      {/* ── Hero strip ── */}
      <div
        className="rounded-2xl mb-8 px-6 py-8 flex items-center justify-between overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }}
        />
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}
          >
            Digital Marketplace
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Buy, sell, and resell digital products on Sui blockchain
          </p>
        </div>
        {account && (
          <Link
            href="/list-product"
            className="btn-gold hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
          >
            + List Product
          </Link>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        {[
          { key: 'products', label: '🛍  Products',    count: pagination.totalCount },
          { key: 'resale',   label: '🔄  Resale',      count: resaleListings.length },
        ].map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(201,168,76,0.12)' : 'var(--bg-hover)',
                    color: active ? 'var(--gold)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Products Tab ── */}
      {activeTab === 'products' && (
        <>
          {/* Search + Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--text-muted)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search products…"
                className="input-dark w-full pl-11 pr-4 py-3 text-sm"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                    className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      background: active ? 'var(--gold)' : 'var(--bg-surface)',
                      color: active ? '#0c0c0f' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Price + Sort */}
            <div className="flex flex-wrap gap-2 items-center">
              {PRICE_RANGES.map((range) => {
                const active = selectedPriceRange.label === range.label;
                return (
                  <button
                    key={range.label}
                    onClick={() => { setSelectedPriceRange(range); setCurrentPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: active ? 'rgba(201,168,76,0.12)' : 'var(--bg-surface)',
                      color: active ? 'var(--gold-light)' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--border)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {range.label}
                  </button>
                );
              })}

              <div className="ml-auto flex-shrink-0">
                <select
                  value={sortBy.label}
                  onChange={(e) => {
                    const opt = SORT_OPTIONS.find((o) => o.label === e.target.value);
                    if (opt) { setSortBy(opt); setCurrentPage(1); }
                  }}
                  className="input-dark px-3 py-1.5 text-xs rounded-lg"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Count */}
          {!loading && pagination.totalCount > 0 && (
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {(currentPage - 1) * pagination.limit + 1}–{Math.min(currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} products
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)' }}
            >
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No products found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => openProduct(product.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-ghost px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: currentPage === page ? 'var(--gold)' : 'var(--bg-surface)',
                          color: currentPage === page ? '#0c0c0f' : 'var(--text-secondary)',
                          border: `1px solid ${currentPage === page ? 'var(--gold)' : 'var(--border-subtle)'}`,
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="btn-ghost px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Resale Tab ── */}
      {activeTab === 'resale' && (
        <>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Resellable NFT products listed by community members. Original creator receives 2.5% royalty on every sale.
          </p>

          {resaleLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : resaleListings.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)' }}
            >
              <p className="text-4xl mb-3">🔄</p>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No resale listings yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Purchase a resellable product to list it here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
              {resaleListings.map((listing) => (
                <ResaleCard
                  key={listing.listing_id}
                  listing={listing}
                  onBuy={handleBuyResale}
                  onViewProduct={openProduct}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProductId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProductId(null);
          fetchResaleListings();
        }}
      />
    </div>
  );
}
