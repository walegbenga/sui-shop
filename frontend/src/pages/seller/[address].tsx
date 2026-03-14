import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useFollowSeller } from '@/hooks/useSocialFeatures';
import ProductDetailModal from '@/components/ProductDetailModal';
import { UserIcon } from '@heroicons/react/24/outline';

export default function SellerProfile() {
  const router = useRouter();
  const { address } = router.query;
  const account = useCurrentAccount();

  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isFollowing, loading: followLoading, toggleFollow } = useFollowSeller(
    address as string,
    account?.address
  );

  useEffect(() => {
    if (address) {
      fetchSellerData();
    }
  }, [address]);

  const fetchSellerData = async () => {
    setLoading(true);

    try {
      // Fetch seller info
      const sellerRes = await fetch(`http://localhost:4000/api/sellers/${address}`);
      const sellerData = await sellerRes.json();
      setSeller(sellerData);

      // Fetch seller products
      const productsRes = await fetch(`http://localhost:4000/api/sellers/${address}/products`);
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">Loading seller profile...</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600">Seller not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Seller Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {seller.address.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Profile</h1>
              <p className="text-sm font-mono text-gray-500 mt-1">
                {seller.address}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <span>👥 {seller.follower_count} followers</span>
                <span>📦 {seller.total_sales} sales</span>
                <span>💰 {(Number(seller.total_revenue) / 1e9).toFixed(2)} SUI revenue</span>
              </div>
            </div>
          </div>

          {account && account.address !== address && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Seller Products */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Products ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No products listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setIsModalOpen(true);
                }}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="relative">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {!product.is_available && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      SOLD
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-indigo-600">
                        {(Number(product.price) / 1e9).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">SUI</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {product.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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