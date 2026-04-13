import { useState } from 'react';
import { useRouter } from 'next/router';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function Checkout() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { cart, clearCart, removeFromCart, totalPrice, itemCount } = useCart();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessing(true);
    toast.loading('Processing checkout...', { id: 'checkout' });

    try {
      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
      const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

      let successCount = 0;
      let failCount = 0;

      // Process each item in cart
      for (const item of cart) {
        try {
          const tx = new Transaction();

          // Split coins for payment
          const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(item.price)]);

          tx.moveCall({
            target: `${PACKAGE_ID}::marketplace::purchase_product`,
            arguments: [
              tx.object(MARKETPLACE_ID),
              tx.object(item.id),
              coin,
              tx.object('0x6'), // Clock
            ],
          });

          await new Promise((resolve, reject) => {
            signAndExecute(
              {
                transaction: tx,
              },
              {
                onSuccess: (result) => {
                  console.log('Purchase successful:', result);
                  successCount++;
                  resolve(result);
                },
                onError: (error) => {
                  console.error('Purchase failed:', error);
                  failCount++;
                  reject(error);
                },
              }
            );
          });

          // Small delay between transactions
          await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
          console.error('Transaction error:', error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(
          `Successfully purchased ${successCount} item${successCount > 1 ? 's' : ''}! 🎉`,
          { id: 'checkout' }
        );
        clearCart();
        
        // Redirect to purchases page after 2 seconds
        setTimeout(() => {
          router.push('/my-purchases');
        }, 2000);
      } else {
        toast.error('All purchases failed. Please try again.', { id: 'checkout' });
      }

      if (failCount > 0) {
        toast.error(`${failCount} item${failCount > 1 ? 's' : ''} failed to purchase`, {
          duration: 5000,
        });
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(`Checkout failed: ${error.message}`, { id: 'checkout' });
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to empty your cart?')) {
      clearCart();
    }
  };

  const handleRemoveItem = (itemId: string, itemTitle: string) => {
    if (window.confirm(`Remove "${itemTitle}" from cart?`)) {
      removeFromCart(itemId);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to proceed with checkout.</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h2>
          <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <button
          onClick={handleClearCart}
          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              <div className="flow-root">
                <ul className="-my-6 divide-y divide-gray-200">
                  {cart.map((item) => (
                    <li key={item.id} className="flex py-6">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.title}</h3>
                            <p className="ml-4">{(Number(item.price) / 1e9).toFixed(2)} SUI</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <p className="text-gray-500 text-xs font-mono">
                            Seller: {item.seller.slice(0, 10)}...{item.seller.slice(-8)}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id, item.title)}
                            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg sticky top-24">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>

              <dl className="space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Items ({itemCount})</dt>
                  <dd className="text-gray-900">{(totalPrice / 1e9).toFixed(2)} SUI</dd>
                </div>

                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Platform Fee (2%)</dt>
                  <dd className="text-gray-900">{((totalPrice * 0.02) / 1e9).toFixed(2)} SUI</dd>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">
                    {((totalPrice * 1.02) / 1e9).toFixed(2)} SUI
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Continue Shopping
                </Link>
              </div>

              {/* Payment Info */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>✓ Secure blockchain transaction</p>
                  <p>✓ All purchases are final</p>
                  <p>✓ Transaction fees apply</p>
                  <p>✓ Wallet: {account.address.slice(0, 10)}...{account.address.slice(-8)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Secure Transaction</h3>
            <p className="mt-1 text-sm text-blue-700">
              Your purchase will be processed on the Sui blockchain. Make sure you have enough SUI
              in your wallet to cover the total amount plus gas fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}