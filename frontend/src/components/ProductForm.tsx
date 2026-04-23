import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import toast from 'react-hot-toast';
import LoadingButton from './LoadingButton';
import { promise } from 'zod';
import { API_URL } from '@/lib/api';

const CATEGORIES = ['Ebook', 'Evideo', 'Stickers', 'Software Plugin', 'Music', 'Other'];
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

// License type options
const LICENSE_TYPES = [
  { value: 0, label: 'No License',          desc: 'Regular download, no activation required' },
  { value: 1, label: 'Single Device',        desc: 'One activation per purchase' },
  { value: 2, label: 'Multi Device',         desc: 'Buyer can activate on N devices (you set the limit)' },
  { value: 3, label: 'Unlimited Devices',    desc: 'Buyer can activate on any number of devices' },
];

interface ProductFormProps {
  productId?: string;
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6,
  letterSpacing: '0.04em', textTransform: 'uppercase',
};

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
    category: 'Ebook',
    quantity: '1',
    resellable: false,
    // License fields
    licenseType:         0,
    licenseMaxDevices:   '2',
    licenseDurationType: 'lifetime' as 'lifetime' | 'days',
    licenseDurationDays: '365',
    licenseRenewalPrice: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [focused,   setFocused] = useState('');

  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`);
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
        licenseType: data.license_type || 0,
        licenseMaxDevices: data.license_max_activations?.toString() || '2',
        licenseDurationType: data.license_duration_days === 0 ? 'lifetime' : 'days',
        licenseDurationDays: data.license_duration_days?.toString() || '365',
        licenseRenewalPrice: data.license_renewal_price
          ? (Number(data.license_renewal_price) / 1e9).toString() : '',
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

      const response = await fetch(`${API_URL}/api/upload`, {
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
    const durationDays  = formData.licenseDurationType === 'lifetime' ? 0 : parseInt(formData.licenseDurationDays) || 0;
    const renewalMist   = formData.licenseRenewalPrice
      ? Math.floor(Number(formData.licenseRenewalPrice) * 1_000_000_000) : 0;
    // max activations: single=1, multi=user input, unlimited=0
    const maxActivations = formData.licenseType === 1 ? 1
      : formData.licenseType === 2 ? parseInt(formData.licenseMaxDevices) || 2
      : 0;

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
        tx.pure(bcs.u8().serialize(formData.licenseType).toBytes()),
        tx.pure(bcs.u64().serialize(maxActivations).toBytes()),
        tx.pure(bcs.u64().serialize(durationDays).toBytes()),
        tx.pure(bcs.u64().serialize(renewalMist).toBytes()),
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

    const response = await fetch(`${API_URL}/api/products/${productId}`, {
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
        seller: account?.address || '',
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

  const fs = (name: string): React.CSSProperties => ({
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-elevated)', borderRadius: 10,
    color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, outline: 'none',
    border: `1px solid ${focused === name ? 'var(--gold-dim)' : 'var(--border-subtle)'}`,
    boxShadow: focused === name ? '0 0 0 3px rgba(201,168,76,.1)' : 'none',
    transition: 'border-color .2s, box-shadow .2s',
  });

  const hasLicense = formData.licenseType !== 0;

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

        {/* ── LICENSE CONFIGURATION ── */}
        <div style={{ background: 'rgba(201,168,76,.04)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🔑</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>License Management</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                Control how buyers can use this product after purchase
              </p>
            </div>
          </div>

          {/* License type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {LICENSE_TYPES.map(lt => {
              const active = formData.licenseType === lt.value;
              return (
                <button key={lt.value} type="button"
                  onClick={() => setFormData({ ...formData, licenseType: lt.value })}
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(201,168,76,.1)' : 'var(--bg-elevated)',
                    border: `1px solid ${active ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    transition: 'all .2s',
                  }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--gold-light)' : 'var(--text-primary)', marginBottom: 2 }}>
                    {lt.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{lt.desc}</p>
                </button>
              );
            })}
          </div>

          {/* License options — only shown when license is enabled */}
          {hasLicense && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>

              {/* Max devices — only for multi-device */}
              {formData.licenseType === 2 && (
                <div>
                  <label style={{ ...lbl, color: 'var(--gold-dim)' }}>Max Devices per License</label>
                  <input style={fs('maxdev')} value={formData.licenseMaxDevices} type="number" min="2" step="1"
                    onChange={e => setFormData({ ...formData, licenseMaxDevices: e.target.value })}
                    onFocus={() => setFocused('maxdev')} onBlur={() => setFocused('')}
                    placeholder="e.g. 3" />
                  <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    Buyer can activate on this many devices simultaneously
                  </p>
                </div>
              )}

              {/* Duration — lifetime vs days */}
              <div>
                <label style={{ ...lbl, color: 'var(--gold-dim)' }}>License Duration</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {(['lifetime', 'days'] as const).map(t => {
                    const active = formData.licenseDurationType === t;
                    return (
                      <button key={t} type="button"
                        onClick={() => setFormData({ ...formData, licenseDurationType: t })}
                        style={{
                          padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                          background: active ? 'rgba(201,168,76,.1)' : 'var(--bg-elevated)',
                          border: `1px solid ${active ? 'var(--gold)' : 'var(--border-subtle)'}`,
                          color: active ? 'var(--gold-light)' : 'var(--text-secondary)',
                        }}>
                        {t === 'lifetime' ? '♾️ Lifetime' : '📅 Fixed Duration'}
                      </button>
                    );
                  })}
                </div>

                {formData.licenseDurationType === 'days' && (
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...fs('durdays'), paddingRight: 56 }}
                      value={formData.licenseDurationDays} type="number" min="1"
                      onChange={e => setFormData({ ...formData, licenseDurationDays: e.target.value })}
                      onFocus={() => setFocused('durdays')} onBlur={() => setFocused('')}
                      placeholder="365" />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>days</span>
                  </div>
                )}
              </div>

              {/* Renewal price — only for fixed duration */}
              {formData.licenseDurationType === 'days' && (
                <div>
                  <label style={{ ...lbl, color: 'var(--gold-dim)' }}>Renewal Price (SUI)</label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...fs('renew'), paddingRight: 44 }}
                      value={formData.licenseRenewalPrice} type="number" step="0.01" min="0"
                      onChange={e => setFormData({ ...formData, licenseRenewalPrice: e.target.value })}
                      onFocus={() => setFocused('renew')} onBlur={() => setFocused('')}
                      placeholder="0.00 (leave empty = not renewable)" />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>SUI</span>
                  </div>
                  <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    Leave empty to make this license non-renewable after expiry
                  </p>
                </div>
              )}

              {/* Summary of config */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--gold-light)' }}>Buyers will receive:</strong> A {LICENSE_TYPES[formData.licenseType].label} license
                  {formData.licenseType === 2 ? ` for up to ${formData.licenseMaxDevices} devices` : ''}
                  {formData.licenseDurationType === 'lifetime' ? ', valid for life.' : `, valid for ${formData.licenseDurationDays} days.`}
                  {formData.licenseRenewalPrice && formData.licenseDurationType === 'days'
                    ? ` Renewable for ${formData.licenseRenewalPrice} SUI.`
                    : formData.licenseDurationType === 'days' ? ' Not renewable.' : ''}
                </p>
              </div>
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