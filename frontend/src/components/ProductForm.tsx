import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Other'];
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const isEditMode = !!productId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Electronics',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}`);
      const data = await response.json();

      if (data.seller !== account?.address) {
        toast.error('You do not own this product');
        router.push('/my-products');
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        price: (Number(data.price) / 1e9).toString(),
        imageUrl: data.image_url,
        category: data.category,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await handleUpdate();
      } else {
        await handleCreate();
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const priceInMist = Math.floor(Number(formData.price) * 1_000_000_000);

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::list_product`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.pure(bcs.string().serialize(formData.title).toBytes()),
        tx.pure(bcs.string().serialize(formData.description).toBytes()),
        tx.pure(bcs.u64().serialize(priceInMist).toBytes()),
        tx.pure(bcs.string().serialize(formData.imageUrl).toBytes()),
        tx.pure(bcs.string().serialize(formData.category).toBytes()),
        tx.object('0x6'),
      ],
    });

    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Transaction successful:', result);
          toast.success('Product listed successfully! 🎉');
          setTimeout(() => {
            router.push('/my-products');
          }, 1500);
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
          toast.error('Failed to list product');
          setLoading(false);
        },
      }
    );
  };

  const handleUpdate = async () => {
    const priceInMist = Math.floor(Number(formData.price) * 1_000_000_000);

    const response = await fetch(`http://localhost:4000/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        price: priceInMist,
        image_url: formData.imageUrl,
        category: formData.category,
        seller: account.address,
      }),
    });

    if (response.ok) {
      toast.success('Product updated successfully! 🎉');
      setTimeout(() => {
        router.push('/my-products');
      }, 1500);
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
  };

  if (fetching) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Product' : 'List New Product'}
      </h1>

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
            required
          />
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
            required
          />
          {formData.imageUrl && (
            <img
              src={formData.imageUrl}
              alt="Preview"
              className="mt-2 h-32 w-32 object-cover rounded-md border"
            />
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

        {/* Info Note */}
        {isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Note:</strong> This updates the database only. Blockchain record remains unchanged.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Listing...') : (isEditMode ? 'Update Product' : 'List Product')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/my-products')}
            className="px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}