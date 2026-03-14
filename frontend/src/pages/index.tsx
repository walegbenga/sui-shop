import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useFavoriteProduct } from '@/hooks/useSocialFeatures';
import ProductDetailModal from '@/components/ProductDetailModal';
import { useFetchProducts } from '@/hooks/useSuiTransactions';
import { useCart } from '@/contexts/CartContext';


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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'under1' | '1to5' | 'over5'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'total_sales' | 'created_at'>('created_at');
  const [currentPage, setCurrentPage] = useState(1);

  const { addToCart } = useCart();

  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Sports'];

  // Calculate price range in MIST
  const getPriceRange = () => {
    switch (priceRange) {
      case 'under1':
        return { minPrice: 0, maxPrice: 1_000_000_000 }; // 0 to 1 SUI in MIST
      case '1to5':
        return { minPrice: 1_000_000_000, maxPrice: 5_000_000_000 }; // 1 to 5 SUI in MIST
      case 'over5':
        return { minPrice: 5_000_000_000, maxPrice: undefined }; // Over 5 SUI
      default:
        return { minPrice: undefined, maxPrice: undefined };
    }
  };

  const priceRangeValues = getPriceRange();

  // Fetch products with all filters applied on server-side
  const { products, loading, error, pagination } = useFetchProducts({
    category: selectedCategory,
    minPrice: priceRangeValues.minPrice,
    maxPrice: priceRangeValues.maxPrice,
    search: searchQuery,
    sortBy: sortBy,
    page: currentPage,
    limit: 20,
  });

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  const handleQuickBuy = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setSelectedProductId(product.id);
    setIsModalOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      seller: product.seller,
      category: product.category,
    });
  };

  const handleFilterChange = () => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search products by name, description, or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                handleFilterChange();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat === 'All' ? null : cat);
                    handleFilterChange();
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    (cat === 'All' && !selectedCategory) || selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => {
                setPriceRange(e.target.value as any);
                handleFilterChange();
              }}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="all">All Prices</option>
              <option value="under1">Under 1 SUI</option>
              <option value="1to5">1 - 5 SUI</option>
              <option value="over5">Over 5 SUI</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                handleFilterChange();
              }}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="created_at">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="total_sales">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery
              ? `Search Results`
              : selectedCategory
              ? `${selectedCategory} Products`
              : 'All Products'}
          </h2>
          <p className="text-sm text-gray-500">
            {!loading && `${pagination.totalCount} total product${pagination.totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setPriceRange('all');
                setSelectedCategory(null);
                handleFilterChange();
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Product Image */}
<div className="relative group">
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
  
  {/* Favorite Button */}
  <FavoriteButton productId={product.id} />
</div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate flex-1">
                        {product.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {product.description}
                    </p>

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

                    {/* Stats and Action Buttons */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Sales: {product.total_sales}</span>
                        {product.rating_count !== 0 && (
                          <span>
                            ⭐ {(Number(product.rating_sum) / Number(product.rating_count)).toFixed(1)}
                          </span>
                        )}
                      </div>

                      {product.is_available && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="flex-1 bg-white border border-indigo-600 text-indigo-600 text-xs font-semibold py-2 px-3 rounded hover:bg-indigo-50 transition-colors"
                          >
                            🛒 Add to Cart
                          </button>
                          <button
                            onClick={(e) => handleQuickBuy(e, product)}
                            className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-indigo-500 transition-colors"
                          >
                            Quick Buy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

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