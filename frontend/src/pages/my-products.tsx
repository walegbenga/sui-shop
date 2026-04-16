import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ListItemSkeleton from '@/components/skeletons/ListItemSkeleton';
import { API_BASE_URL } from '@/config/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  seller: string;
  isAvailable: boolean;
  totalSales: string;
  ratingSum: string;
  ratingCount: string;
  quantity: number;
  available_quantity: number;
  resellable: boolean;
  file_cid?: string;
}

export default function MyProducts() {
  const account = useCurrentAccount();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');

  useEffect(() => {
    if (account?.address) {
      fetchProducts();
    }
  }, [account]);

  const fetchProducts = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sellers/${account.address}/products`
      );
      const data = await response.json();

      const mappedProducts = (data.products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.image_url,
        category: p.category,
        seller: p.seller,
        isAvailable: p.is_available,
        totalSales: p.total_sales,
        ratingSum: p.rating_sum,
        ratingCount: p.rating_count,
        quantity: p.quantity || 0,
        available_quantity: p.available_quantity || 0,
        resellable: p.resellable || false,
        file_cid: p.file_cid || '',
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string, productTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller: account?.address }),
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete product');
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
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

  const filteredProducts = products.filter((product) => {
    if (filter === 'available') return product.isAvailable;
    if (filter === 'sold') return !product.isAvailable;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📦 My Products</h1>
        <p className="text-gray-500 mt-1">Manage your listed products</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'all', label: `All (${products.length})`, color: 'indigo' },
          { key: 'available', label: `Available (${products.filter((p) => p.isAvailable).length})`, color: 'green' },
          { key: 'sold', label: `Sold (${products.filter((p) => !p.isAvailable).length})`, color: 'red' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === key
                ? `bg-${color}-600 text-white`
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </ul>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all'
              ? "You haven't listed any products yet."
              : `You don't have any ${filter} products.`}
          </p>
          <div className="mt-6">
            <Link
              href="/list-product"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
            >
              + List New Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/80x80?text=No+Image'}
                      alt={product.title}
                      className="h-20 w-20 rounded-lg object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />

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
                          {product.quantity > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {product.available_quantity}/{product.quantity} available
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {product.category}
                          </span>
                          <span>Sales: {product.totalSales}</span>
                          {Number(product.ratingCount) > 0 && (
                            <span>
                              ⭐ {(Number(product.ratingSum) / Number(product.ratingCount)).toFixed(1)}
                            </span>
                          )}
                          {product.resellable && (
                            <span className="text-purple-600 text-xs font-medium">🔄 Resellable</span>
                          )}
                          {product.file_cid && (
                            <span className="text-green-600 text-xs font-medium">📁 Has File</span>
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

                          {product.isAvailable && (
                            <>
                              <Link
                                href={`/edit-product/${product.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(product.id, product.title)}
                                className="text-sm text-red-600 hover:text-red-500 font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </>
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