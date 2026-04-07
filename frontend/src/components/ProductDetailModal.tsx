import { useEffect, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useFavoriteProduct, useFollowSeller } from '@/hooks/useSocialFeatures';
import { useCart } from '@/contexts/CartContext';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

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
  rating_sum: string;
  rating_count: string;
  quantity: number;
  available_quantity: number;
  resellable: boolean;
  file_cid?: string;
  file_name?: string;
  file_size?: number;
}

interface Review {
  reviewer: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ productId, isOpen, onClose }: ProductDetailModalProps) {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);

  const { isFavorited, toggleFavorite } = useFavoriteProduct(productId || '', account?.address);
  const { isFollowing, toggleFollow } = useFollowSeller(product?.seller || '', account?.address);

  const [showResaleModal, setShowResaleModal] = useState(false);
  const [resalePrice, setResalePrice] = useState('');
  const [resaleListing, setResaleListing] = useState(false);

  useEffect(() => {
    if (productId && isOpen) {
      fetchProduct();
      fetchReviews();
      checkPurchaseStatus();
    }
  }, [productId, isOpen, account]);

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}/reviews`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  /*const checkPurchaseStatus = async () => {
    if (!account?.address || !productId) return;
    try {
      const response = await fetch(`http://localhost:4000/api/purchases/${account.address}`);
      const data = await response.json();
      const purchased = data.purchases.some((p: any) => p.product_id === productId);
      setHasPurchased(purchased);
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };*/

  const checkPurchaseStatus = async () => {
  if (!account?.address || !productId) {
    setHasPurchased(false);
    return;
  }

  try {
    const response = await fetch(`http://localhost:4000/api/purchases/${account.address}`);
    const data = await response.json();
    
    // ✅ Check if this specific product was purchased
    const purchased = (data.purchases || []).some(
      (p: any) => p.product_id === productId
    );
    
    console.log('Purchase check:', { productId, purchased }); // DEBUG
    setHasPurchased(purchased);
  } catch (error) {
    console.error('Error checking purchase status:', error);
    setHasPurchased(false);
  }
};

  // ✅ QUICK BUY - IMMEDIATE PURCHASE
  const handleQuickBuy = () => {
  if (!account || !product) {
    toast.error('Please connect your wallet');
    return;
  }

  if (product.seller === account.address) {
    toast.error('You cannot buy your own product');
    return;
  }

  if (!product.is_available) {
    toast.error('Product is sold out');
    return;
  }

  if (product.available_quantity <= 0) {
    toast.error('Product out of stock');
    return;
  }

  // ✅ CHECK IF USER HAS ENOUGH BALANCE
  const priceInSui = Number(product.price) / 1e9;
  toast.loading(`Purchasing for ${priceInSui.toFixed(2)} SUI...`, { id: 'purchase' });

  const tx = new Transaction();
  
  try {
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(product.price))]);

    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::purchase_product`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(product.id),
        coin,
        tx.pure.u64(1n), // quantity
        tx.object('0x6'), // clock
      ],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
  console.log('Purchase successful:', result);
  toast.success('Purchase successful! 🎉', { id: 'purchase' });
  fetchProduct();
  // Wait for indexer to process the purchase event before checking
  setTimeout(() => {
    checkPurchaseStatus();
  }, 6000); // 6 seconds matches the 5s poll interval
},
        onError: (error: any) => {
          console.error('Purchase failed:', error);
          
          // ✅ BETTER ERROR MESSAGES
          let errorMessage = 'Purchase failed';
          
          if (error.message?.includes('abort code: 2')) {
            errorMessage = 'Insufficient balance or product unavailable';
          } else if (error.message?.includes('abort code: 3')) {
            errorMessage = 'Product is not active';
          } else if (error.message?.includes('abort code: 4')) {
            errorMessage = 'Invalid quantity';
          } else if (error.message?.includes('InsufficientGas')) {
            errorMessage = 'Insufficient gas to complete transaction';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage, { id: 'purchase' });
        },
      }
    );
  } catch (error: any) {
    console.error('Transaction build failed:', error);
    toast.error('Failed to build transaction', { id: 'purchase' });
  }
};

  // ✅ ADD TO CART
  const handleAddToCart = () => {
  if (!product) return;
  
  if (product.seller === account?.address) {
    toast.error('You cannot buy your own product');
    return;
  }

  if (!product.is_available || product.available_quantity <= 0) {
    toast.error('Product is sold out');
    return;
  }

  addToCart(product);
  toast.success('Added to cart! 🛒'); // Only one toast here
};

  const handleReviewSubmit = async () => {
  if (!account?.address || !product) {
    toast.error('Please connect your wallet');
    return;
  }

  if (!reviewComment.trim()) {
    toast.error('Please write a review comment');
    return;
  }

  // ✅ DEBUG: Log what we're sending
  console.log('Submitting review:', {
    product_id: product.id,
    reviewer: account.address,
    rating: reviewRating,
    comment: reviewComment.trim(),
  });

  toast.loading('Submitting review...', { id: 'review' });

  try {
    const response = await fetch('http://localhost:4000/api/reviews', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: product.id,        // ✅ ENSURE these match exactly
        buyerAddress: account.address,      // ✅ what backend expects
        rating: reviewRating,           // ✅ (number)
        comment: reviewComment.trim(),  // ✅ (string)
      }),
    });

    const data = await response.json();
    
    // ✅ DEBUG: Log response
    console.log('Review response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit review');
    }

    toast.success('Review submitted! ⭐', { id: 'review' });
    setReviewComment('');
    setReviewRating(5);
    
    // Refresh reviews
    fetchReviews();
    
  } catch (error: any) {
    console.error('Review submission error:', error);
    toast.error(error.message || 'Failed to submit review', { id: 'review' });
  }
};

/*
  const handleDownload = async () => {
  if (!account?.address || !product?.id) {
    toast.error('Please connect your wallet');
    return;
  }

  if (!product.file_cid) {
    toast.error('No file attached to this product');
    return;
  }

  toast.loading('Preparing download...', { id: 'download' });

  try {
    const response = await fetch(
      `http://localhost:4000/api/download/${product.id}/${account.address}`
    );

    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error || 'Download failed', { id: 'download' });
      return;
    }

    const data = await response.json();
    
    if (data.url) {
      window.open(data.url, '_blank');
      toast.success('Download started! 📥', { id: 'download' });
    } else {
      toast.error('Download URL not found', { id: 'download' });
    }
  } catch (error: any) {
    console.error('Download error:', error);
    toast.error(`Download error: ${error.message}`, { id: 'download' });
  }
};
*/

const handleDownload = async () => {
  if (!account?.address || !product?.id) {
    toast.error('Please connect your wallet');
    return;
  }

  if (!product.file_cid) {
    toast.error('No file attached to this product');
    return;
  }

  // ✅ SIMPLE: Just open the URL - backend handles redirect
  const downloadUrl = `http://localhost:4000/api/download/${product.id}/${account.address}`;
  
  window.open(downloadUrl, '_blank');
  toast.success('Download started! 📥');
};

const handleResale = async () => {
  if (!account?.address || !product) {
    toast.error('Please connect your wallet');
    return;
  }

  if (!resalePrice || Number(resalePrice) <= 0) {
    toast.error('Please enter a valid price');
    return;
  }

  setResaleListing(true);
  toast.loading('Listing for resale...', { id: 'resale' });

  try {
    const priceInMist = Math.floor(Number(resalePrice) * 1_000_000_000);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::list_for_resale`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(product.id),
        tx.pure.u64(priceInMist),
        tx.object('0x6'), // clock
      ],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log('Resale listing successful:', result);
          toast.success('Listed for resale! 🎉', { id: 'resale' });
          setShowResaleModal(false);
          setResalePrice('');
          fetchProduct();
        },
        onError: (error: any) => {
          console.error('Resale failed:', error);
          toast.error(error.message || 'Failed to list for resale', { id: 'resale' });
        },
      }
    );
  } catch (error: any) {
    console.error('Transaction build failed:', error);
    toast.error('Failed to build transaction', { id: 'resale' });
  } finally {
    setResaleListing(false);
  }
};

  if (!product) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <div className="relative">
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-gray-500 hover:bg-white hover:text-gray-700 transition-all shadow-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Left: Image */}
                    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
  src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
  alt={product.title}
  className="w-full h-[500px] object-cover"
/>
                      {product.resellable && (
                        <div className="absolute top-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg flex items-center gap-2">
                          🔄 Resellable NFT
                        </div>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div className="p-8 flex flex-col">
                      <div className="flex-1">
                        <Dialog.Title className="text-3xl font-bold text-gray-900 mb-3">
                          {product.title}
                        </Dialog.Title>

                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                            {product.category}
                          </span>
                          {product.quantity > 1 && (
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                              {product.available_quantity}/{product.quantity} Available
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

                        {/* Price */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                          <div className="text-sm text-gray-600 mb-1">Price</div>
                          <div className="text-4xl font-bold text-indigo-600">
                            {(Number(product.price) / 1e9).toFixed(2)} SUI
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                          <div className="text-xs text-gray-500 mb-1">Seller</div>
                          <div className="text-sm font-mono text-gray-800">
                            {product.seller.slice(0, 8)}...{product.seller.slice(-6)}
                          </div>
                        </div>

                        {/* Reviews Summary */}
                        {Number(product.rating_count) > 0 && (
                          <div className="mb-6 flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-yellow-400 text-xl">
                                  {i < Math.round(Number(product.rating_sum) / Number(product.rating_count)) ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              ({product.rating_count} reviews)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4 border-t">
                        {product.seller === account?.address ? (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-600 py-4 rounded-xl font-bold cursor-not-allowed"
                          >
                            Your Product
                          </button>
                        ) : product.is_available ? (
                          <>
                            {/* ✅ QUICK BUY BUTTON */}
                            <button
                              onClick={handleQuickBuy}
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              🚀 Quick Buy Now
                            </button>

                            {/* ✅ ADD TO CART BUTTON */}
                            <button
                              onClick={handleAddToCart}
                              className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                            >
                              🛒 Add to Cart
                            </button>
                          </>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-600 py-4 rounded-xl font-bold cursor-not-allowed"
                          >
                            Sold Out
                          </button>
                        )}

                        {/* Download Button - Show if user purchased AND file exists */}
{hasPurchased && product.file_cid && (
  <button
    onClick={handleDownload}
    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    Download File
  </button>
)}

{/* ✅ LIST FOR RESALE - Show if user purchased AND product is resellable */}
{hasPurchased && product.resellable && (
  <button
    onClick={() => setShowResaleModal(true)}
    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    🔄 List for Resale
  </button>
)}
                        {/* Social Actions */}
                        {account && product.seller !== account.address && (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => toggleFavorite()}
                              className="border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-pink-500 hover:text-pink-500 transition-all"
                            >
                              {isFavorited ? '❤️ Saved' : '🤍 Save'}
                            </button>
                            <button
                              onClick={() => toggleFollow()}
                              className="border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-indigo-500 hover:text-indigo-500 transition-all"
                            >
                              {isFollowing ? '✓ Following' : '+ Follow'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Review Section - Only show if user has purchased */}
{hasPurchased && (
  <div className="mt-6 pt-6 border-t">
    <h3 className="font-bold text-lg mb-3">Leave a Review</h3>
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setReviewRating(star)}
          className="text-3xl transition-transform hover:scale-110"
        >
          {star <= reviewRating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
    <textarea
      value={reviewComment}
      onChange={(e) => setReviewComment(e.target.value)}
      placeholder="Share your experience..."
      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none resize-none"
      rows={3}
    />
    <button
      type="button"
      onClick={handleReviewSubmit}
      disabled={!reviewComment.trim()}
      className="mt-3 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Submit Review
    </button>
  </div>
)}

                      {/* Reviews List */}
{reviews.length > 0 && (
  <div className="mt-6 pt-6 border-t max-h-64 overflow-y-auto">
    <h3 className="font-bold text-lg mb-3">Reviews ({reviews.length})</h3>
    <div className="space-y-3">
      {reviews.map((review, idx) => (
        <div key={idx} className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-500 text-sm">{'⭐'.repeat(review.rating)}</span>
            <span className="text-xs text-gray-500">
              {/* ✅ FIX: Proper date formatting */}
              {(() => {
                const timestamp = Number(review.created_at);
                if (isNaN(timestamp) || timestamp === 0) return 'Recently';
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              })()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  </div>
)}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
        {/* Resale Modal */}
{/* Resale Modal - COMPLETE FIXED VERSION */}
<Transition appear show={showResaleModal} as={Fragment}>
  <Dialog 
    as="div" 
    className="relative z-[70]" 
    onClose={() => {
      setShowResaleModal(false);
      setResalePrice('');
    }}
  >
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              List for Resale
            </Dialog.Title>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resale Price (SUI)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={resalePrice}
                  onChange={(e) => setResalePrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  SUI
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Original price: {(Number(product.price) / 1e9).toFixed(2)} SUI
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResale}
                disabled={resaleListing || !resalePrice || Number(resalePrice) <= 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {resaleListing ? 'Listing...' : 'Confirm Listing'}
              </button>
              <button
                onClick={() => {
                  setShowResaleModal(false);
                  setResalePrice('');
                }}
                disabled={resaleListing}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>
      </Dialog>
    </Transition>
  );
}