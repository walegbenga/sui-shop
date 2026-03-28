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
        tx.pure(bcs.string().serialize(product.id).toBytes()),
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

  const handleAddToCart = () => {
    if (!product) return;
    toast.success('Added to cart! 🛒');
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Image */}
                  <div>
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-4">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900">
                        {product.title}
                      </Dialog.Title>
                      <p className="text-gray-500 mt-2">{product.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-3xl font-bold text-indigo-600">
                      {(Number(product.price) / 1e9).toFixed(2)} SUI
                    </div>

                    {/* Stock & Resellable */}
                    <div className="flex gap-2">
                      {product.quantity > 1 && (
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {product.available_quantity}/{product.quantity} Available
                        </span>
                      )}
                      {product.resellable && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          🔄 Resellable
                        </span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2">
                      {product.seller === account?.address ? (
                        <button
                          disabled
                          className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
                        >
                          This is Your Product
                        </button>
                      ) : product.is_available ? (
                        <>
                          <button
                            onClick={handlePurchase}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-500"
                          >
                            Buy Now
                          </button>
                          <button
                            onClick={handleAddToCart}
                            className="w-full border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50"
                          >
                            Add to Cart
                          </button>
                        </>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      )}

                      {/* Download Button */}
                      {hasPurchased && product.file_cid && (
                        <button
                          onClick={handleDownload}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-500 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download File
                        </button>
                      )}

                      {/* Favorite & Follow */}
                      {account && product.seller !== account.address && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFavorite()}
                            className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                          >
                            {isFavorited ? '❤️ Favorited' : '🤍 Favorite'}
                          </button>
                          <button
                            onClick={() => toggleFollow()}
                            className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50"
                          >
                            {isFollowing ? '👤 Following' : '➕ Follow'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reviews Section */}
                    {hasPurchased && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">Leave a Review</h3>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="text-2xl"
                            >
                              {star <= reviewRating ? '⭐' : '☆'}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Write your review..."
                          className="w-full border rounded-lg p-2"
                          rows={3}
                        />
                        <button
                          onClick={handleReviewSubmit}
                          className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500"
                        >
                          Submit Review
                        </button>
                      </div>
                    )}

                    {/* Reviews List */}
                    {reviews.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">Reviews ({reviews.length})</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {reviews.map((review, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}