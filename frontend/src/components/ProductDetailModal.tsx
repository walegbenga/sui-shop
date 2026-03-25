import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useFollowSeller, useFavoriteProduct } from '@/hooks/useSocialFeatures';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

interface ProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProductDetailModal({
  productId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const account = useCurrentAccount();
  const { addToCart } = useCart();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);

  const { isFavorited, loading: favoriteLoading, toggleFavorite } = useFavoriteProduct(
    productId,
    account?.address
  );
  const { isFollowing, loading: followLoading, toggleFollow } = useFollowSeller(
    product?.seller,
    account?.address
  );

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
      fetchReviews();
      checkPurchaseStatus();
    }
  }, [isOpen, productId, account]);

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
    if (!productId || !account?.address) return;

    try {
      const response = await fetch(`http://localhost:4000/api/purchases/${account.address}`);
      const data = await response.json();
      const purchased = data.purchases?.some((p: any) => p.product_id === productId);
      setHasPurchased(purchased);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    if (!hasPurchased) {
      toast.error('You must purchase this product before reviewing');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          buyerAddress: account.address,
          rating: rating,
          comment: reviewText,
        }),
      });

      if (response.ok) {
        toast.success('Review submitted! ⭐');
        setReviewText('');
        setRating(0);
        fetchReviews();
        fetchProduct();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handlePurchase = async () => {
    if (!account || !product) {
      toast.error('Please connect your wallet');
      return;
    }

    if (product.seller === account.address) {
      toast.error('You cannot buy your own product');
      return;
    }

    setLoading(true);

    try {
      const tx = new Transaction();
      const priceWithFee = Math.floor(Number(product.price) * 1.02);
      
      const [coin] = tx.splitCoins(tx.gas, [priceWithFee]);

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
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Purchase successful:', result);
            toast.success('Purchase successful! 🎉');
            onClose();
            setTimeout(() => {
              fetchProduct();
            }, 2000);
          },
          onError: (error) => {
            console.error('Purchase failed:', error);
            toast.error(`Purchase failed: ${error.message}`);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(`Purchase failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.image_url,
      category: product.category,
      seller: product.seller,
    });
    toast.success('Added to cart! 🛒');
  };

  if (!product && loading) {
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
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-center shadow-xl transition-all sm:w-full sm:max-w-lg sm:p-6">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading product...</p>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  if (!product) return null;

  const tabs = ['Details', 'Reviews'];

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
          <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-10">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 p-2 shadow-lg"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row">
                  {/* Product Image */}
                  <div className="w-full sm:w-1/2">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-64 sm:h-96 object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="w-full sm:w-1/2 p-4 sm:p-6">
                    <div className="mb-4">
                      <Dialog.Title
                        as="h3"
                        className="text-2xl font-bold leading-6 text-gray-900"
                      >
                        {product.title}
                      </Dialog.Title>
                      
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {product.category}
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-3xl font-bold text-indigo-600">
                          {(Number(product.price) / 1e9).toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-500 ml-2">SUI</span>
                      </div>

                      {Number(product.rating_count) > 0 && (
                        <div className="mt-2 flex items-center">
                          <span className="text-yellow-500">
                            {'⭐'.repeat(
                              Math.round(Number(product.rating_sum) / Number(product.rating_count))
                            )}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            ({product.rating_count} reviews)
                          </span>
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">Seller</h4>
                            <p className="mt-1 text-xs text-gray-500 font-mono break-all">
                              {product.seller}
                            </p>
                          </div>
                          
                          {account && account.address !== product.seller && (
                            <button
                              onClick={toggleFollow}
                              disabled={followLoading}
                              className={`ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                isFollowing
                                  ? 'bg-gray-200 text-gray-700'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                            >
                              {isFollowing ? 'Following' : '+ Follow'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                      <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                        {tabs.map((tab) => (
                          <Tab
                            key={tab}
                            className={({ selected }) =>
                              classNames(
                                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                                selected
                                  ? 'bg-white text-indigo-700 shadow'
                                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-indigo-600'
                              )
                            }
                          >
                            {tab}
                          </Tab>
                        ))}
                      </Tab.List>
                      <Tab.Panels className="mt-4 max-h-64 overflow-y-auto">
                        <Tab.Panel className="rounded-xl bg-white p-3">
                          <p className="text-sm text-gray-700">{product.description}</p>
                          <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <p>
                              <strong>Sales:</strong> {product.total_sales}
                            </p>
                            <p>
                              <strong>Status:</strong>{' '}
                              {product.is_available ? (
                                <span className="text-green-600 font-semibold">Available</span>
                              ) : (
                                <span className="text-red-600 font-semibold">Sold Out</span>
                              )}
                            </p>
                          </div>
                        </Tab.Panel>

                        <Tab.Panel className="rounded-xl bg-white p-3">
                          <div className="space-y-6">
                            {account && hasPurchased && (
                              <form onSubmit={handleReviewSubmit} className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Write a Review</h4>
                                
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Rating *
                                  </label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="text-2xl focus:outline-none"
                                      >
                                        {star <= rating ? '⭐' : '☆'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Review (Optional)
                                  </label>
                                  <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                                    placeholder="Share your experience with this product..."
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-500"
                                >
                                  Submit Review
                                </button>
                              </form>
                            )}

                            {account && !hasPurchased && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-yellow-800">
                                  You must purchase this product before leaving a review.
                                </p>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Customer Reviews ({reviews.length})
                              </h4>
                              
                              {reviews.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                  No reviews yet. Be the first to review!
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {reviews.map((review) => (
                                    <div
                                      key={`${review.product_id}-${review.reviewer}-${review.created_at}`}
                                      className="border-b border-gray-200 pb-4 last:border-b-0"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="text-yellow-500">
                                            {'⭐'.repeat(review.rating)}
                                          </div>
                                          <span className="text-sm text-gray-600 font-mono">
                                            {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {new Date(Number(review.created_at) * 1000).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {review.comment && (
                                        <p className="text-sm text-gray-700">{review.comment}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>

                    <div className="mt-6">
                      {product.is_available ? (
                        <div className="space-y-3">
                          {account && (
                            <button
                              type="button"
                              onClick={toggleFavorite}
                              disabled={favoriteLoading}
                              className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                              {isFavorited ? (
                                <>
                                  <HeartIconSolid className="h-5 w-5 text-red-500" />
                                  Remove from Favorites
                                </>
                              ) : (
                                <>
                                  <HeartIcon className="h-5 w-5" />
                                  Add to Favorites
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handlePurchase}
                            disabled={!account || product.seller === account?.address || loading}
                            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {!account
                              ? 'Connect Wallet to Purchase'
                              : product.seller === account?.address
                              ? 'This is Your Product'
                              : loading
                              ? 'Processing...'
                              : `💳 Buy Now - ${(Number(product.price) / 1e9).toFixed(2)} SUI`}
                          </button>

                          {account && product.seller !== account?.address && (
                            <button
                              type="button"
                              onClick={handleAddToCart}
                              className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-600 hover:bg-indigo-50"
                            >
                              🛒 Add to Cart
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-md bg-red-50 p-4">
                          <p className="text-sm text-red-800 text-center font-semibold">
                            This product is no longer available
                          </p>
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
    </Transition.Root>
  );
}