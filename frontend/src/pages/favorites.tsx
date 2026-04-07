import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProductDetailModal from '@/components/ProductDetailModal';

interface Favorite {
  product_id: string;
  title: string;
  price: string;
  image_url: string;
  category: string;
  seller: string;
  favorited_at: string;
}

export default function Favorites() {
  const account = useCurrentAccount();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (account?.address) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [account?.address]);

  const fetchFavorites = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4000/api/users/${account.address}/favorites`
      );
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (productId: string) => {
    if (!account?.address) return;
    try {
      const response = await fetch('http://localhost:4000/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account.address,
          productId,
        }),
      });

      if (response.ok) {
        // Optimistically remove from UI immediately
        setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
        toast.success('Removed from favorites');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove favorite');
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const openProduct = (productId: string) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view your favorites.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">❤️ My Favorites</h1>
        <p className="text-gray-500 mt-1">Products you've saved</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-2 text-gray-600">Loading favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-sm font-medium text-gray-900">No favorites yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Browse the marketplace and save products you like
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div
              key={favorite.product_id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative">
                <img
                  src={favorite.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={favorite.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => openProduct(favorite.product_id)}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfavorite(favorite.product_id);
                  }}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-lg"
                  title="Remove from favorites"
                >
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <h3
                  className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-indigo-600"
                  onClick={() => openProduct(favorite.product_id)}
                >
                  {favorite.title}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{favorite.category}</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {(Number(favorite.price) / 1e9).toFixed(2)} SUI
                  </span>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Saved {new Date(favorite.favorited_at).toLocaleDateString()}
                </p>

                <button
                  onClick={() => openProduct(favorite.product_id)}
                  className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
                >
                  View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDetailModal
        productId={selectedProductId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProductId(null);
          fetchFavorites();
        }}
      />
    </div>
  );
}