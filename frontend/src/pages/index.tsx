import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import ProductDetailModal from '@/components/ProductDetailModal';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useFavoriteProduct } from '@/hooks/useSocialFeatures';
import Link from 'next/link';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Books'];
const PRICE_RANGES = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Under 1 SUI', min: null, max: 1000000000 },
  { label: '1 - 5 SUI', min: 1000000000, max: 5000000000 },
  { label: 'Over 5 SUI', min: 5000000000, max: null },
];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at', order: 'DESC' },
  { label: 'Price: Low to High', value: 'price', order: 'ASC' },
  { label: 'Price: High to Low', value: 'price', order: 'DESC' },
  { label: 'Most Popular', value: 'total_sales', order: 'DESC' },
];

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  seller: string;
  is_available: boolean;
  total_sales: string;
  quantity: number;
  available_quantity: number;
  resellable: boolean;
  file_cid?: string;        // ✅ ADD
  file_name?: string;       // ✅ ADD
  file_size?: number;       // ✅ ADD
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

function FavoriteButton({ productId }: { productId: string }) {
  const account = useCurrentAccount();
  const { isFavorited, loading, toggleFavorite } = useFavoriteProduct(productId, account?.address);

  if (!account) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={loading}
      className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
    >
      {isFavorited ? (
        <HeartIconSolid className="h-5 w-5 text-red-500" />
      ) : (
        <HeartIcon className="h-5 w-5 text-gray-600" />
      )}
    </button>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedPriceRange, searchQuery, sortBy, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy.value,
        sortOrder: sortBy.order,
      });

      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      if (selectedPriceRange.min !== null) {
        params.append('minPrice', selectedPriceRange.min.toString());
      }

      if (selectedPriceRange.max !== null) {
        params.append('maxPrice', selectedPriceRange.max.toString());
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`http://localhost:4000/api/products?${params}`);
      const data = await response.json();

      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: typeof PRICE_RANGES[0]) => {
    setSelectedPriceRange(range);
    setCurrentPage(1);
  };

  const handleSortChange = (option: typeof SORT_OPTIONS[0]) => {
    setSortBy(option);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🛍️ Marketplace</h1>
        <p className="text-gray-500 mt-1">Discover digital products on Sui blockchain</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range & Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePriceRangeChange(range)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriceRange.label === range.label
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy.label}
              onChange={(e) => {
                const option = SORT_OPTIONS.find((opt) => opt.label === e.target.value);
                if (option) handleSortChange(option);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {!loading && pagination.totalCount > 0 && (
            <>
              Showing {(currentPage - 1) * pagination.limit + 1} -{' '}
              {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} product{pagination.totalCount !== 1 ? 's' : ''}
            </>
          )}
        </p>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setIsModalOpen(true);
                }}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 animate-fade-in"
              >
                {/* Product Image */}
                <div className="relative group">
                  <img
  src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
  alt={product.title}
  className="w-full h-48 object-cover rounded-t-lg"
  loading="lazy"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
  }}
/>
                  
                  {/* SOLD Badge */}
                  {!product.is_available && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      SOLD
                    </div>
                  )}

                  {/* Stock Badge */}
                  {product.is_available && product.quantity > 1 && (
                    <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      {product.available_quantity}/{product.quantity} Left
                    </div>
                  )}

                  {/* Resellable Badge */}
                  {product.resellable && (
                    <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      🔄 Resellable
                    </div>
                  )}

                  {/* Favorite Button */}
                  <FavoriteButton productId={product.id} />
                </div>

                {/* Product Info */}
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

                  {/* Seller Link */}
                  <Link
                    href={`/seller/${product.seller}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 text-xs text-gray-500 hover:text-indigo-600 block truncate transition-colors"
                  >
                    By: {product.seller.slice(0, 10)}...{product.seller.slice(-8)}
                  </Link>

                  {/* Sales Info */}
                  {Number(product.total_sales) > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {product.total_sales} sale{Number(product.total_sales) !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
{pagination.totalPages > 1 && (
  <div className="flex items-center justify-center gap-2 mt-8">
    {/* Previous Button */}
    <button
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
    >
      Previous
    </button>

    {/* Page Numbers - Show limited range */}
    {(() => {
      const maxVisible = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
      
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      const pages = [];
      
      // First page
      if (startPage > 1) {
        pages.push(
          <button
            key={1}
            onClick={() => setCurrentPage(1)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            1
          </button>
        );
        if (startPage > 2) {
          pages.push(<span key="dots1" className="px-2">...</span>);
        }
      }

      // Visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              currentPage === i
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'hover:bg-gray-50'
            }`}
          >
            {i}
          </button>
        );
      }

      // Last page
      if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
          pages.push(<span key="dots2" className="px-2">...</span>);
        }
        pages.push(
          <button
            key={pagination.totalPages}
            onClick={() => setCurrentPage(pagination.totalPages)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {pagination.totalPages}
          </button>
        );
      }

      return pages;
    })()}

    {/* Next Button */}
    <button
      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
      disabled={currentPage === pagination.totalPages}
      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
    >
      Next
    </button>
  </div>
)}
        </>
      )}

      {/* Product Detail Modal */}
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