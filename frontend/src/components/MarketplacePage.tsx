import React, { useState } from 'react';
import { ShoppingBag, Plus, Star, TrendingUp, Users, Shield } from 'lucide-react';
import { useFetchProducts, useListProduct, usePurchaseProduct } from '../hooks/useSuiTransactions';
import { mistToSui } from '../utils/security';
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function MarketplacePage() {
  const { products, loading, refetch } = useFetchProducts();
  const { purchaseProduct, loading: purchasing } = usePurchaseProduct();
  const account = useCurrentAccount();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showListModal, setShowListModal] = useState(false);

  const categories = ['all', 'art', 'collectibles', 'gaming', 'fashion', 'tech'];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handlePurchase = async (productId: string, price: string) => {
    const priceInSui = mistToSui(price);
    await purchaseProduct(productId, priceInSui);
    refetch();
  };

  const calculateRating = (ratingSum: string, ratingCount: string) => {
    const sum = parseInt(ratingSum);
    const count = parseInt(ratingCount);
    return count > 0 ? (sum / count / 100).toFixed(1) : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Sui Shop</h1>
              <p className="text-xs text-slate-400">Decentralized Social Commerce</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Secured by Sui</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{products.length} Products</span>
              </div>
            </div>
            
            {account && (
              <button
                onClick={() => setShowListModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25"
              >
                <Plus className="w-4 h-4" />
                List Product
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No products found</h3>
            <p className="text-slate-500">Be the first to list a product!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
                purchasing={purchasing}
                calculateRating={calculateRating}
              />
            ))}
          </div>
        )}
      </div>

      {/* List Product Modal */}
      {showListModal && (
        <ListProductModal onClose={() => setShowListModal(false)} onSuccess={refetch} />
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onPurchase, purchasing, calculateRating }: any) {
  const account = useCurrentAccount();
  const isOwner = account?.address === product.seller;
  const priceInSui = mistToSui(product.price);
  const rating = calculateRating(product.ratingSum, product.ratingCount);

  return (
    <div className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl overflow-hidden border border-white/10 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-slate-900/50">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{product.title}</h3>
            <p className="text-sm text-slate-400 line-clamp-2">{product.description}</p>
          </div>
          <span className="ml-3 px-3 py-1 bg-violet-500/20 text-violet-300 text-xs font-medium rounded-lg border border-violet-500/30">
            {product.category}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium">{rating}</span>
            <span className="text-slate-500">({product.ratingCount})</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{product.totalSales} sold</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-500">Price</p>
            <p className="text-2xl font-bold text-white">{priceInSui.toFixed(4)} <span className="text-sm text-slate-400">SUI</span></p>
          </div>

          {!isOwner && product.isActive && (
            <button
              onClick={() => onPurchase(product.id, product.price)}
              disabled={purchasing}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {purchasing ? 'Processing...' : 'Buy Now'}
            </button>
          )}

          {isOwner && (
            <span className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl text-sm font-medium">
              Your Product
            </span>
          )}

          {!product.isActive && (
            <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-sm font-medium border border-red-500/30">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// List Product Modal
function ListProductModal({ onClose, onSuccess }: any) {
  const { listProduct, loading } = useListProduct();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'art',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await listProduct({
      ...formData,
      price: parseFloat(formData.price),
    });

    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">List New Product</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors h-32 resize-none"
              placeholder="Describe your product..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Price (SUI)</label>
              <input
                type="number"
                step="0.000001"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="art">Art</option>
                <option value="collectibles">Collectibles</option>
                <option value="gaming">Gaming</option>
                <option value="fashion">Fashion</option>
                <option value="tech">Tech</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="https://..."
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {loading ? 'Listing...' : 'List Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
