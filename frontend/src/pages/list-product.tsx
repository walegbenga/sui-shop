import { useCurrentAccount } from '@mysten/dapp-kit';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';

export default function ListProduct() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 text-sm mb-6">
            Please connect your wallet to list products on Digi ChainStore.
          </p>
          <Link href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors no-underline">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="text-sm text-indigo-600 font-semibold hover:underline">
          ← Back to Marketplace
        </Link>
        <h1 className="text-2xl font-black text-gray-900 mt-3 mb-1">List a Product</h1>
        <p className="text-sm text-gray-500">Upload your digital product and start earning SUI</p>
      </div>
      <ProductForm />
    </div>
  );
}
