import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useVerification } from '@/hooks/useVerification';

interface SellerProfile {
  address: string;
  total_sales: number;
  total_revenue: string;
  follower_count: number;
  is_banned: boolean;
  is_verified: boolean;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  totalProducts: number;
  availableProducts: number;
  soldProducts: number;
  totalPurchases: number;
  totalSpent: string;
  totalFavorites: number;
  totalFollowing: number;
  totalFollowers: number;
}

export default function Profile() {
  const account = useCurrentAccount();
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);

  const { isVerifiedSeller, isVerifiedBuyer } = useVerification(account?.address);

  useEffect(() => {
    if (account?.address) {
      fetchProfile();
      fetchStats();
    }
  }, [account?.address]);

  const fetchProfile = async () => {
    if (!account?.address) return;
    try {
      const response = await fetch(`http://localhost:4000/api/sellers/${account.address}`);
      if (response.ok) {
        const data = await response.json();
        setSellerProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const [productsRes, purchasesRes, favoritesRes, followingRes, followersRes] =
        await Promise.all([
          fetch(`http://localhost:4000/api/sellers/${account.address}/products`),
          fetch(`http://localhost:4000/api/purchases/${account.address}`),
          fetch(`http://localhost:4000/api/users/${account.address}/favorites`),
          fetch(`http://localhost:4000/api/users/${account.address}/following`),
          fetch(`http://localhost:4000/api/sellers/${account.address}/followers`),
        ]);

      const products  = (await productsRes.json()).products   || [];
      const purchases = (await purchasesRes.json()).purchases  || [];
      const favorites = (await favoritesRes.json()).favorites  || [];
      const following = (await followingRes.json()).following  || [];
      const followers = (await followersRes.json()).followers  || [];

      setStats({
        totalProducts:     products.length,
        availableProducts: products.filter((p: any) => p.is_available).length,
        soldProducts:      products.filter((p: any) => !p.is_available).length,
        totalPurchases:    purchases.length,
        totalSpent:        purchases.reduce((s: number, p: any) => s + Number(p.price), 0).toString(),
        totalFavorites:    favorites.length,
        totalFollowing:    following.length,
        totalFollowers:    followers.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {isVerifiedSeller && <VerifiedBadge type="seller" size="lg" showLabel />}
          {isVerifiedBuyer  && <VerifiedBadge type="buyer"  size="lg" showLabel />}
        </div>
        <p className="text-gray-500 mt-1">Manage your account and view your stats</p>
      </div>

      {/* ── Verification perks banner ── */}
      {(isVerifiedSeller || isVerifiedBuyer) && (
        <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
          isVerifiedSeller ? 'bg-blue-50 border border-blue-200' : 'bg-emerald-50 border border-emerald-200'
        }`}>
          <div className="text-2xl">✨</div>
          <div>
            <p className={`font-semibold ${isVerifiedSeller ? 'text-blue-800' : 'text-emerald-800'}`}>
              You have verified status!
            </p>
            <ul className={`mt-1 text-sm space-y-0.5 ${isVerifiedSeller ? 'text-blue-700' : 'text-emerald-700'}`}>
              <li>✓ 1.5% platform fee instead of 2% on all transactions</li>
              {isVerifiedSeller && <li>✓ Your products are ranked higher in search results</li>}
              {isVerifiedSeller && <li>✓ Verified badge shown on all your products</li>}
              {isVerifiedBuyer  && <li>✓ Verified badge shown on your reviews</li>}
              {isVerifiedBuyer  && <li>✓ Your reviews carry more weight in ratings</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ── Wallet Address Card ── */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Address</h2>
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <code className="text-sm font-mono text-gray-700 break-all">{account.address}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(account.address);
              alert('Address copied!');
            }}
            className="ml-4 text-indigo-600 hover:text-indigo-500 text-sm font-medium whitespace-nowrap"
          >
            Copy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

            {/* Seller Stats */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium opacity-90">Seller Stats</h3>
                {isVerifiedSeller && <VerifiedBadge type="seller" size="sm" />}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Total Sales:</span>
                  <span className="font-semibold">{sellerProfile?.total_sales || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Revenue:</span>
                  <span className="font-semibold">
                    {((Number(sellerProfile?.total_revenue) || 0) / 1e9).toFixed(2)} SUI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Followers:</span>
                  <span className="font-semibold">{sellerProfile?.follower_count || 0}</span>
                </div>
                {isVerifiedSeller && (
                  <div className="flex justify-between">
                    <span className="text-sm opacity-90">Platform Fee:</span>
                    <span className="font-semibold text-yellow-300">1.5% ✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* Products Stats */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">Products</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Total Listed:</span>
                  <span className="font-semibold">{stats?.totalProducts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Available:</span>
                  <span className="font-semibold">{stats?.availableProducts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Sold:</span>
                  <span className="font-semibold">{stats?.soldProducts || 0}</span>
                </div>
              </div>
            </div>

            {/* Buyer Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium opacity-90">Buyer Stats</h3>
                {isVerifiedBuyer && <VerifiedBadge type="buyer" size="sm" />}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Total Purchases:</span>
                  <span className="font-semibold">{stats?.totalPurchases || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Total Spent:</span>
                  <span className="font-semibold">
                    {((Number(stats?.totalSpent) || 0) / 1e9).toFixed(2)} SUI
                  </span>
                </div>
                {isVerifiedBuyer && (
                  <div className="flex justify-between">
                    <span className="text-sm opacity-90">Platform Fee:</span>
                    <span className="font-semibold text-yellow-300">1.5% ✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* Followers */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">Your Followers</h3>
              <div className="mt-4">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Total Followers:</span>
                  <span className="font-semibold">{stats?.totalFollowers || 0}</span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">Social</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Favorites:</span>
                  <span className="font-semibold">{stats?.totalFavorites || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Following:</span>
                  <span className="font-semibold">{stats?.totalFollowing || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Account Status ── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {sellerProfile ? 'Seller Account' : 'Buyer Account'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {sellerProfile
                    ? new Date(Number(sellerProfile.created_at)).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {sellerProfile?.is_banned ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-700/10">
                      Banned
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                      Active
                    </span>
                  )}
                  {isVerifiedSeller && <VerifiedBadge type="seller" size="sm" showLabel />}
                  {isVerifiedBuyer  && <VerifiedBadge type="buyer"  size="sm" showLabel />}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Network</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">Sui Testnet</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Platform Fee</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {(isVerifiedSeller || isVerifiedBuyer) ? (
                    <span className="text-emerald-600">1.5% <span className="text-sm text-gray-500 font-normal">(verified discount)</span></span>
                  ) : (
                    <span>2.0% <span className="text-sm text-gray-500 font-normal">(standard)</span></span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
