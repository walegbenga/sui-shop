import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import StatsCardSkeleton from '@/components/skeletons/StatsCardSkeleton';

interface AnalyticsData {
  stats: {
    total_products: string;
    available_products: string;
    sold_products: string;
    avg_price: string;
    total_sales_count: string;
  };
  revenueByMonth: Array<{
    month: string;
    sales: string;
    revenue: string;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    total_sales: string;
    price: string;
    rating_sum: string;
    rating_count: string;
  }>;
  recentSales: Array<{
    id: string;
    title: string;
    price: string;
    created_at: string;
    buyer: string;
  }>;
}

export default function Analytics() {
  const account = useCurrentAccount();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      fetchAnalytics();
    }
  }, [account]);

  const fetchAnalytics = async () => {
    if (!account?.address) return;

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:4000/api/sellers/${account.address}/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 Sales Analytics</h1>
          <p className="text-gray-500 mt-1">Track your performance and insights</p>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600">Failed to load analytics</p>
      </div>
    );
  }

  const totalRevenue = analytics.revenueByMonth.reduce(
    (sum, month) => sum + Number(month.revenue),
    0
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 Sales Analytics</h1>
        <p className="text-gray-500 mt-1">Track your performance and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">
                {(totalRevenue / 1e9).toFixed(2)}
              </p>
              <p className="text-xs opacity-75 mt-1">SUI</p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 opacity-80" />
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Sales</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.stats.total_sales_count || 0}
              </p>
              <p className="text-xs opacity-75 mt-1">Products Sold</p>
            </div>
            <ShoppingBagIcon className="h-12 w-12 opacity-80" />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Products</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.stats.total_products || 0}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {analytics.stats.available_products || 0} Available
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 opacity-80" />
          </div>
        </div>

        {/* Average Price */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Average Price</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.stats.avg_price 
                  ? (Number(analytics.stats.avg_price) / 1e9).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-xs opacity-75 mt-1">SUI</p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {analytics.revenueByMonth.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Revenue by Month</h2>
          <div className="space-y-4">
            {analytics.revenueByMonth.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-indigo-600">
                      {(Number(month.revenue) / 1e9).toFixed(2)} SUI
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({month.sales} sales)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min((Number(month.revenue) / totalRevenue) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Products</h2>
          {analytics.topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales yet</p>
          ) : (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.title}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                        <span>{product.total_sales} sales</span>
                        {Number(product.rating_count) > 0 && (
                          <span>
                            ⭐ {(Number(product.rating_sum) / Number(product.rating_count)).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">
                      {(Number(product.price) / 1e9).toFixed(2)} SUI
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🕒 Recent Sales</h2>
          {analytics.recentSales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales yet</p>
          ) : (
            <div className="space-y-4">
              {analytics.recentSales.map((sale) => (
                <div
                  key={`${sale.id}-${sale.created_at}`}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1 mr-4">
                      {sale.title}
                    </h3>
                    <span className="text-lg font-bold text-green-600">
                      {(Number(sale.price) / 1e9).toFixed(2)} SUI
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono truncate mr-2">
                      {sale.buyer.slice(0, 10)}...{sale.buyer.slice(-8)}
                    </span>
                    <span>
                      {new Date(Number(sale.created_at)).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}