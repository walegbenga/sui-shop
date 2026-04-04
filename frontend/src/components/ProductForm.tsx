import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import toast from 'react-hot-toast';
import LoadingButton from './LoadingButton';
import { promise } from 'zod';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Other'];
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const isEditMode = !!productId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',      // ✅ RESTORED
    category: 'Electronics',
    quantity: '1',
    resellable: false,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
        imageUrl: data.image_url,  // ✅ RESTORED
        category: data.category,
        quantity: data.quantity?.toString() || '1',
        resellable: data.resellable || false,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setFetching(false);
    }
  };

  const handleFileUpload = async (): Promise<{ cid: string; fileName: string; fileSize: number } | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('seller', account!.address);

      const response = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Upload failed');
      }

      const data = await response.json();
      toast.success('File uploaded to IPFS! ✅');
      return data;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(`File upload failed: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
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
    // Upload file first if selected
    let fileData = null;
    if (selectedFile) {
      fileData = await handleFileUpload();
      if (!fileData) {
        setLoading(false);
        return;
      }
    }

    const priceInMist = Math.floor(Number(formData.price) * 1_000_000_000);
    const quantity = parseInt(formData.quantity) || 1;

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::list_product`,
      arguments: [
        tx.object(MARKETPLACE_ID), // platform
        tx.pure(bcs.string().serialize(formData.title).toBytes()), // name
        tx.pure(bcs.string().serialize(formData.description).toBytes()), // description
        tx.pure(bcs.u64().serialize(priceInMist).toBytes()), // price
        tx.pure(bcs.u64().serialize(quantity).toBytes()), // quantity
        tx.pure(bcs.string().serialize(formData.category).toBytes()), // category
        tx.pure(bcs.bool().serialize(formData.resellable).toBytes()), // resellable
        tx.pure(bcs.string().serialize(fileData?.cid || '').toBytes()), // file_cid
        tx.object('0x6'), // clock
      ],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          console.log('Transaction successful:', result);
          toast.success('Product listed successfully! 🎉');

          // Wait for indexer to process
          toast.loading('Waiting for Blockchain confirmation....', {id: 'indexer'})
          await new Promise(resolve => setTimeout(resolve, 3000));
          toast.dismiss('indexer');

          // Redirect to My Product or Marktplace
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
        image_url: formData.imageUrl,  // ✅ RESTORED
        category: formData.category,
        quantity: parseInt(formData.quantity),
        resellable: formData.resellable,
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
    <div className="bg-white shadow-lg rounded-2xl p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Product' : 'List New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Product Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            placeholder="e.g., Premium UI Design Kit"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors resize-none"
            placeholder="Describe your product..."
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (SUI) *
          </label>
          <div className="relative">
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              SUI
            </span>
          </div>
        </div>

        {/* Image URL - ✅ RESTORED */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Image URL *
          </label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            placeholder="https://example.com/image.jpg"
            required
          />
          {formData.imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="h-48 w-full object-cover rounded-xl border-2 border-gray-200"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image';
                }}
              />
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity *
          </label>
          <input
            type="number"
            id="quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            min="1"
            step="1"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            How many copies are available? (For limited editions, set a specific number)
          </p>
        </div>

        {/* Resellable Toggle */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="resellable"
                type="checkbox"
                checked={formData.resellable}
                onChange={(e) => setFormData({ ...formData, resellable: e.target.checked })}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="resellable" className="font-medium text-gray-900">
                🔄 Resellable Product (NFT-like)
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Allow buyers to resell this product with royalties. Perfect for digital collectibles and limited editions.
              </p>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <label htmlFor="file" className="block text-sm font-medium text-gray-900 mb-2">
            📎 Digital File (Optional)
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-green-600 file:text-white
              hover:file:bg-green-500 file:cursor-pointer
              cursor-pointer"
          />
          {selectedFile && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-green-300">
              <p className="text-sm text-gray-900 font-medium">
                📎 {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Upload your digital product file (PDF, ZIP, etc.) - Max 100MB
          </p>
        </div>

        {/* Info Note */}
        {isEditMode && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Note:</strong> This updates the database only. Blockchain record remains unchanged.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <LoadingButton
            type="submit"
            loading={loading || uploading}
            loadingText={uploading ? 'Uploading file...' : isEditMode ? 'Updating...' : 'Listing...'}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isEditMode ? '💾 Update Product' : '🚀 List Product'}
          </LoadingButton>
          <button
            type="button"
            onClick={() => router.push('/my-products')}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}