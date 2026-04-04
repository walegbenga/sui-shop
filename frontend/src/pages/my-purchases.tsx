import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Purchase {
  id: string;
  product_id: string;
  buyer: string;
  seller: string;
  price: string;
  platform_fee: string;
  tx_digest: string;
  created_at: string;
  product_title?: string;
  product_image?: string;
  product_category?: string;
  product_file_cid?: string;
}

export default function MyPurchases() {
  const account = useCurrentAccount();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      fetchPurchases();
    }
  }, [account]);

  const fetchPurchases = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/purchases/${account.address}`);
      const data = await response.json();

      const purchasesWithProducts = await Promise.all(
        (data.purchases || []).map(async (purchase: Purchase) => {
          try {
            const productResponse = await fetch(
              `http://localhost:4000/api/products/${purchase.product_id}`
            );
            const productData = await productResponse.json();
            return {
              ...purchase,
              product_title: productData.title,
              product_image: productData.image_url,
              product_category: productData.category,
              product_file_cid: productData.file_cid,
            };
          } catch (error) {
            console.error('Error fetching product:', error);
            return purchase;
          }
        })
      );

      setPurchases(purchasesWithProducts);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string | number) => {
    const num = Number(timestamp);
    if (!num || isNaN(num)) return 'Unknown date';
    // Sui timestamps are in milliseconds
    return new Date(num).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDownload = async (productId: string) => {
    if (!account?.address) return;
    try {
      const response = await fetch(
        `http://localhost:4000/api/download/${productId}/${account.address}`
      );
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Download failed');
        return;
      }
      const data = await response.json();
      window.open(data.url, '_blank');
      toast.success('Download started! 📥');
    } catch (error: any) {
      toast.error(`Download error: ${error.message}`);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view your purchases.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">💰 My Purchases</h1>
        <p className="text-gray-500 mt-1">View your purchased products</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-2 text-gray-600">Loading purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-sm font-medium text-gray-900">No purchases yet</h3>
          <p className="mt-1 text-sm text-gray-500">Browse the marketplace to find products</p>
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <li key={purchase.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    {purchase.product_image && (
                      <img
                        src={purchase.product_image || 'https://via.placeholder.com/80x80?text=No+Image'}
                        alt={purchase.product_title || 'Product'}
                        className="h-20 w-20 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
                        }}
                      />
                    )}

                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {purchase.product_title || 'Unknown Product'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Purchased on {formatDate(purchase.created_at)}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-indigo-600">
                            {(Number(purchase.price) / 1e9).toFixed(2)} SUI
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {purchase.product_category && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {purchase.product_category}
                            </span>
                          )}
                          <span className="font-mono text-xs">
                            TX: {purchase.tx_digest?.slice(0, 8)}...
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {purchase.product_file_cid && (
                            <button
                              onClick={() => handleDownload(purchase.product_id)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-500 transition-colors"
                            >
                              📥 Download
                            </button>
                          )}
                          <Link
                            href={`/?product=${purchase.product_id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                          >
                            View Product
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}