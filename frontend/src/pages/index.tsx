import { useState } from 'react';
import ProductDetailModal from '@/components/ProductDetailModal';
import { useFetchProductsByCategory } from '@/hooks/useSuiTransactions';
import { useCart } from '@/contexts/CartContext';

export default function Home() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { products, loading, error } = useFetchProductsByCategory(selectedCategory);
  const { addToCart } = useCart();

  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Sports'];

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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

      {/* Category Filter */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Categories</h2>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat === 'All' ? null : cat);
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (cat === 'All' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
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
            {!loading && `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
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
        {!loading && !error && filteredProducts.length === 0 && (
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
              {searchQuery
                ? `No products match "${searchQuery}". Try a different search term.`
                : selectedCategory
                ? `No products available in the ${selectedCategory} category.`
                : 'Get started by listing your first product!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {!product.isAvailable && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      SOLD
                    </div>
                  )}
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
                      <span>Sales: {product.totalSales}</span>
                      {product.ratingCount !== '0' && (
                        <span>
                          ⭐ {(Number(product.ratingSum) / Number(product.ratingCount)).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {product.isAvailable && (
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