import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserFollowing } from '@/hooks/useSocialFeatures';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Following() {
  const account = useCurrentAccount();
  const { following, loading } = useUserFollowing(account?.address);

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view who you're following.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">👥 Following</h1>
        <p className="text-gray-500 mt-1">Sellers you're following</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : following.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Not following anyone yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Follow sellers to get updates on their new products!
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {following.map((seller) => (
            <Link
              key={seller.address}
              href={`/seller/${seller.address}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6"
            >
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {seller.address.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-mono text-gray-600">
                    {seller.address.slice(0, 10)}...{seller.address.slice(-8)}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>💰 Revenue: {(Number(seller.total_revenue) / 1e9).toFixed(2)} SUI</p>
                    <p>📦 Sales: {seller.total_sales}</p>
                    <p>👥 Followers: {seller.follower_count}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}