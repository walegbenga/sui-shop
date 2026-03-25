import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserFavorites } from '@/hooks/useSocialFeatures';
import { HeartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProductDetailModal from '@/components/ProductDetailModal';
import EmptyState from '@/components/EmptyState';
import { useRouter } from 'next/router';

export default function Favorites() {
  const account = useCurrentAccount();
  const router = useRouter();
  const { favorites, loading, refetch } = useUserFavorites(account?.address);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ ADDED: Listen for favorites changes and refetch
  useEffect(() => {
    const handleFavoritesChanged = () => {
      if (refetch) {
        refetch();
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChanged);
    };
  }, [refetch]);

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
        <p className="text-gray-500 mt-1">Products you've saved for later</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<HeartIcon className="h-12 w-12 text-gray-400" />}
          title="No favorites yet"
          description="Start adding products to your favorites by clicking the heart icon!"
          action={{
            label: 'Browse Products',
            onClick: () => router.push('/'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              onClick={() => {
                setSelectedProductId(fav.id);
                setIsModalOpen(true);
              }}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={fav.image_url}
                  alt={fav.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                  loading="lazy"
                />
                {!fav.is_available && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    SOLD
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{fav.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{fav.description}</p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-indigo-600">
                      {(Number(fav.price) / 1e9).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">SUI</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {fav.category}
                  </span>
                </div>
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
        }}
      />
    </div>
  );
}