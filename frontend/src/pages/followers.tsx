import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface Follower {
  follower_address: string;
  created_at: string;
}

export default function Followers() {
  const account = useCurrentAccount();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      fetchFollowers();
    }
  }, [account]);

  const fetchFollowers = async () => {
    if (!account?.address) return;

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:4000/api/sellers/${account.address}/followers`
      );
      const data = await response.json();
      setFollowers(data.followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view your followers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">👥 My Followers</h1>
        <p className="text-gray-500 mt-1">People following your products</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading followers...</p>
        </div>
      ) : followers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No followers yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            When users follow you, they'll appear here!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Total Followers: {followers.length}
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {followers.map((follower) => (
              <li key={follower.follower_address} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {follower.follower_address.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Follower</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {follower.follower_address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Followed on
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(follower.created_at).toLocaleDateString()}
                    </p>
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