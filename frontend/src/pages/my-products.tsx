import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserProducts } from '@/hooks/useSuiTransactions';
import Link from 'next/link';

export default function MyProducts() {
  const account = useCurrentAccount();
  const { products, loading, error, refetch } = useUserProducts(account?.address);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');

  const filteredProducts = products.filter((p) => {
    if (filter === 'available') return p.isAvailable;
    if (filter === 'sold') return !p.isAvailable;
    return true;
  });

  const stats = {
    total: products.length,
    available: products.filter((p) => p.isAvailable).length,
    sold: products.filter((p) => !p.isAvailable).length,
    totalRevenue: products.reduce((sum, p) => sum + (p.isAvailable ? 0 : Number(p.price)), 0),
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view your products.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
        <Link
          href="/list-product"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          + List New Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Sold</p>
          <p className="text-3xl font-bold text-blue-600">{stats.sold}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-indigo-600">
            {(stats.totalRevenue / 1e9).toFixed(2)} <span className="text-lg">SUI</span>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { name: 'All', value: 'all', count: stats.total },
              { name: 'Available', value: 'available', count: stats.available },
              { name: 'Sold', value: 'sold', count: stats.sold },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`${
                  filter === tab.value
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                {tab.name}
                <span
                  className={`${
                    filter === tab.value ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
                  } ml-2 rounded-full py-0.5 px-2.5 text-xs font-medium`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading your products...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all'
              ? "You haven't listed any products yet."
              : `You have no ${filter} products.`}
          </p>
          {filter === 'all' && (
            <div className="mt-6">
              <Link
                href="/list-product"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
              >
                + List Your First Product
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center">
                    {/* Product Image */}
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />

                    {/* Product Info */}
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-indigo-600">
                            {(Number(product.price) / 1e9).toFixed(2)} SUI
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {product.category}
                          </span>
                          <span>Sales: {product.totalSales}</span>
                          {product.ratingCount !== '0' && (
                            <span>
                              ⭐ {(Number(product.ratingSum) / Number(product.ratingCount)).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {product.isAvailable ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">
                              Sold Out
                            </span>
                          )}
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