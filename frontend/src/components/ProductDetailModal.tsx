import { useEffect, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useFavoriteProduct, useFollowSeller } from '@/hooks/useSocialFeatures';

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
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);

  const { isFavorited, toggleFavorite } = useFavoriteProduct(productId || '', account?.address);
  const { isFollowing, toggleFollow } = useFollowSeller(product?.seller || '', account?.address);

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

  const checkPurchaseStatus = async () => {
    if (!account?.address || !productId) return;
    try {
      const response = await fetch(`http://localhost:4000/api/purchases/${account.address}`);
      const data = await response.json();
      const purchased = data.purchases.some((p: any) => p.product_id === productId);
      setHasPurchased(purchased);
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  const handlePurchase = () => {
    if (!account || !product) {
      toast.error('Please connect your wallet');
      return;
    }

    if (product.seller === account.address) {
      toast.error('You cannot buy your own product');
      return;
    }

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(bcs.u64().serialize(product.price).toBytes())]);

    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::purchase_product`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(product.id),
        coin,
        tx.object('0x6'),
      ],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: () => {
          toast.success('Purchase successful! 🎉');
          onClose();
        },
        onError: (error) => {
          console.error('Purchase failed:', error);
          toast.error('Purchase failed');
        },
      }
    );
  };

  const handleReviewSubmit = async () => {
    if (!account?.address || !product) return;

    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          reviewer: account.address,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        toast.success('Review submitted! ⭐');
        setReviewComment('');
        setReviewRating(5);
        fetchReviews();
      }
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const handleDownload = async () => {
    if (!account?.address || !product) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/download/${product.id}/${account.address}`
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Download failed');
        return;
      }

      const data = await response.json();
      window.open(data.url, '_blank');
      toast.success('Download started! 📥');
    } catch (error: any) {
      toast.error(`Download error: ${error.message}`);
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
                        src={product.image_url}
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
                          <button
                            onClick={handlePurchase}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            Buy Now
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-600 py-4 rounded-xl font-bold cursor-not-allowed"
                          >
                            Sold Out
                          </button>
                        )}

                        {/* Download Button */}
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

                      {/* Reviews Section */}
                      {hasPurchased && (
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="font-bold text-lg mb-3">Leave a Review</h3>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
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
                            onClick={handleReviewSubmit}
                            className="mt-3 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
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
                                    {new Date(review.created_at).toLocaleDateString()}
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
      </Dialog>
    </Transition>
  );
}