import { useCurrentAccount } from '@mysten/dapp-kit';
import ProductForm from '@/components/ProductForm';

export default function ListProduct() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to list products te.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <ProductForm />
    </div>
  );
}