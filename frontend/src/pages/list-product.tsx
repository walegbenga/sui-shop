import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Other'];

export default function ListProduct() {
  const account = useCurrentAccount();
  const router = useRouter();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Electronics',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error('Image URL is required');
      return;
    }

    setLoading(true);

    try {
      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
      const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

      // Convert price to MIST (1 SUI = 1,000,000,000 MIST)
      const priceInMist = Math.floor(Number(formData.price) * 1_000_000_000);

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::list_product`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.string(formData.title),
          tx.pure.string(formData.description),
          tx.pure.u64(priceInMist),
          tx.pure.string(formData.imageUrl),
          tx.pure.string(formData.category),
          tx.object('0x6'), // Clock
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            toast.success('Product listed successfully! 🎉');
            
            // Reset form
            setFormData({
              title: '',
              description: '',
              price: '',
              imageUrl: '',
              category: 'Electronics',
            });

            // Redirect to marketplace after 2 seconds
            setTimeout(() => {
              router.push('/');
            }, 2000);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            toast.error(`Failed to list product: ${error.message}`);
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to list a product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">List New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Product Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="e.g., Wireless Bluetooth Headphones"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Describe your product..."
              maxLength={500}
              required
            />
            <p className="mt-1 text-sm text-gray-500">{formData.description.length}/500 characters</p>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (SUI) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
              Image URL *
            </label>
            <input
              type="url"
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="https://example.com/image.jpg"
              required
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-md border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Invalid+URL';
                  }}
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Listing Product...' : 'List Product'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}