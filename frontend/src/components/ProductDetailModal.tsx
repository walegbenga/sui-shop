import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useFetchProduct, useFetchProductReviews, usePostReview } from '@/hooks/useSuiTransactions';
import toast from 'react-hot-toast';

interface ProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ productId, isOpen, onClose }: ProductDetailModalProps) {
  const account = useCurrentAccount();
  const { product, loading, error, refetch } = useFetchProduct(productId);
  const { reviews, refetch: refetchReviews } = useFetchProductReviews(productId);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { postReview, loading: reviewLoading } = usePostReview();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  const handlePurchase = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!product) {
      toast.error('Product not found');
      return;
    }

    if (product.seller === account.address) {
      toast.error("You can't buy your own product");
      return;
    }

    try {
      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
      const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

      const tx = new Transaction();

      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(product.price)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::purchase_product`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.object(product.id),
          coin,
          tx.object('0x6'),
        ],
      });

      toast.loading('Processing purchase...', { id: 'purchase' });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Purchase successful:', result);
            toast.success('Purchase successful! 🎉', { id: 'purchase' });
            refetch();
            setTimeout(() => {
              onClose();
            }, 1500);
          },
          onError: (error) => {
            console.error('Purchase failed:', error);
            toast.error(`Purchase failed: ${error.message}`, { id: 'purchase' });
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`, { id: 'purchase' });
    }
  };

  const handleSubmitReview = () => {
    if (!product) return;

    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    postReview(product.id, rating, comment, () => {
      setComment('');
      setRating(5);
      setShowReviewForm(false);
      refetchReviews();
      refetch();
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {product && !loading && (
                  <div className="mt-3">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setActiveTab('details')}
                          className={`${
                            activeTab === 'details'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                        >
                          Product Details
                        </button>
                        <button
                          onClick={() => setActiveTab('reviews')}
                          className={`${
                            activeTab === 'reviews'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                        >
                          Reviews ({reviews.length})
                        </button>
                      </nav>
                    </div>

                    {/* Product Details Tab */}
                    {activeTab === 'details' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        </div>

                        <div>
                          <Dialog.Title as="h3" className="text-2xl font-semibold text-gray-900">
                            {product.title}
                          </Dialog.Title>

                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {product.category}
                            </span>
                            {!product.isAvailable && (
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">
                                SOLD OUT
                              </span>
                            )}
                          </div>

                          <div className="mt-4">
                            <p className="text-3xl font-bold text-gray-900">
                              {(Number(product.price) / 1e9).toFixed(2)} SUI
                            </p>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900">Description</h4>
                            <p className="mt-2 text-sm text-gray-600">{product.description}</p>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900">Seller</h4>
                            <p className="mt-1 text-xs text-gray-500 font-mono break-all">
                              {product.seller}
                            </p>
                          </div>

                          {product.isAvailable ? (
                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={handlePurchase}
                                disabled={!account || product.seller === account?.address}
                                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {!account
                                  ? 'Connect Wallet to Purchase'
                                  : product.seller === account?.address
                                  ? 'This is Your Product'
                                  : `🛒 Purchase for ${(Number(product.price) / 1e9).toFixed(2)} SUI`}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-6">
                              <button
                                type="button"
                                disabled
                                className="w-full rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                              >
                                Sold Out
                              </button>
                            </div>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Total Sales</p>
                              <p className="font-semibold">{product.totalSales}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Rating</p>
                              <p className="font-semibold">
                                {product.ratingCount !== '0'
                                  ? `${(Number(product.ratingSum) / Number(product.ratingCount)).toFixed(1)} ⭐`
                                  : 'No ratings'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                      <div>
                        {/* Post Review Button */}
                        {account && !showReviewForm && (
                          <div className="mb-6">
                            <button
                              onClick={() => setShowReviewForm(true)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500"
                            >
                              Write a Review
                            </button>
                          </div>
                        )}

                        {/* Review Form */}
                        {showReviewForm && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Write Your Review</h4>
                            
                            {/* Star Rating */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rating
                              </label>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                  >
                                    {star <= rating ? (
                                      <StarIconSolid className="h-8 w-8 text-yellow-400" />
                                    ) : (
                                      <StarIcon className="h-8 w-8 text-gray-300" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Comment */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Comment
                              </label>
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Share your experience..."
                              />
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSubmitReview}
                                disabled={reviewLoading}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-indigo-500 disabled:bg-gray-400"
                              >
                                {reviewLoading ? 'Posting...' : 'Post Review'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowReviewForm(false);
                                  setComment('');
                                  setRating(5);
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reviews List */}
                        {reviews.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No reviews yet. Be the first to review!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <div key={review.product_id + review.reviewer} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <StarIconSolid
                                            key={i}
                                            className={`h-4 w-4 ${
                                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {review.rating}/5
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                                    <p className="mt-2 text-xs text-gray-500 font-mono">
                                      By: {review.reviewer.slice(0, 10)}...{review.reviewer.slice(-8)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}