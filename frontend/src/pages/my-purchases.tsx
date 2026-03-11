import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

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
}

export default function MyPurchases() {
  const account = useCurrentAccount();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account?.address) {
      fetchPurchases();
    }
  }, [account?.address]);

  const fetchPurchases = async () => {
    if (!account?.address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/purchases/${account.address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.price), 0);

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Purchases</h1>
        <p className="text-gray-500 mt-1">View all your purchased items</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Purchases</p>
          <p className="text-3xl font-bold text-gray-900">{purchases.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-3xl font-bold text-indigo-600">
            {(totalSpent / 1e9).toFixed(2)} <span className="text-lg">SUI</span>
          </p>
        </div>
      </div>

      {/* Purchases List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading purchases...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start shopping in the marketplace!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <li key={purchase.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">Product ID:</p>
                        <p className="text-xs text-gray-500 font-mono">{purchase.product_id.slice(0, 20)}...</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            Price: <span className="font-semibold text-indigo-600">{(Number(purchase.price) / 1e9).toFixed(2)} SUI</span>
                          </span>
                          <span>
                            {new Date(Number(purchase.created_at)).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      
                        <a href={`https://suiscan.xyz/testnet/tx/${purchase.tx_digest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        View TX →
                      </a>
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