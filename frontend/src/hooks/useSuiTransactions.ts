/**
 * Sui Transaction Hooks - Updated for @mysten/sui v2.6.0
 */

import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { 
  useSignAndExecuteTransaction, 
  useCurrentAccount, 
  useSuiClient 
} from '@mysten/dapp-kit';
import { toast } from 'react-hot-toast';
//import type { SuiObjectResponse } from '@mysten/sui/client';
import {
  buildTransactionTarget,
  getMarketplaceId,
  GAS_BUDGET,
  OBJECT_TYPES,
} from '../config/sui';
import {
  ProductSchema,
  ReviewSchema,
  ProfileSchema,
  suiToMist,
  transactionRateLimiter,
  listingRateLimiter,
  getSafeErrorMessage,
  createTransactionWithTimeout,
} from '../utils/security';

// Types
interface TransactionState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface Product {
  id: string;
  seller: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  totalSales: string;
  totalRevenue: string;
  ratingSum: string;
  ratingCount: string;
}

// Transaction Hook
export function useSecureTransaction() {
  const [state, setState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false,
  });

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();

  const executeTransaction = useCallback(
    async (
      transaction: Transaction,
      options?: {
        onSuccess?: (result: any) => void;
        onError?: (error: Error) => void;
        rateLimitKey?: string;
      }
    ) => {
      if (!account) {
        const error = 'Please connect your wallet first';
        setState({ loading: false, error, success: false });
        toast.error(error);
        return null;
      }

      if (options?.rateLimitKey && !transactionRateLimiter.isAllowed(options.rateLimitKey)) {
        const error = 'Too many transactions. Please wait.';
        setState({ loading: false, error, success: false });
        toast.error(error);
        return null;
      }

      setState({ loading: true, error: null, success: false });

      try {
        const result = await createTransactionWithTimeout(
          signAndExecute({ transaction })
        );

        setState({ loading: false, error: null, success: true });
        toast.success('Transaction successful!');
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = getSafeErrorMessage(error);
        setState({ loading: false, error: errorMessage, success: false });
        toast.error(errorMessage);
        options?.onError?.(error as Error);
        return null;
      }
    },
    [account, signAndExecute]
  );

  return {
    ...state,
    executeTransaction,
    resetState: () => setState({ loading: false, error: null, success: false }),
  };
}

// List Product Hook
export function useListProduct() {
  const { executeTransaction, ...transactionState } = useSecureTransaction();
  const account = useCurrentAccount();

  const listProduct = useCallback(
    async (productData: {
      title: string;
      description: string;
      price: number;
      imageUrl: string;
      category: string;
    }) => {
      if (!account) {
        toast.error('Please connect your wallet');
        return null;
      }

      try {
        ProductSchema.parse(productData);
      } catch (error) {
        toast.error('Invalid product data');
        return null;
      }

      if (!listingRateLimiter.isAllowed(account.address)) {
        toast.error('Listing limit exceeded. Please try again later.');
        return null;
      }

      const tx = new Transaction();
      const marketplaceId = getMarketplaceId();

      tx.moveCall({
        target: buildTransactionTarget('list_product'),
        arguments: [
          tx.object(marketplaceId),
          tx.pure.string(productData.title),
          tx.pure.string(productData.description),
          tx.pure.u64(suiToMist(productData.price)),
          tx.pure.string(productData.imageUrl),
          tx.pure.string(productData.category),
          tx.object('0x6'), // Clock object
        ],
      });

      return executeTransaction(tx, {
        rateLimitKey: `list_${account.address}`,
      });
    },
    [account, executeTransaction]
  );

  return { listProduct, ...transactionState };
}

// Purchase Product Hook
export function usePurchaseProduct() {
  const { executeTransaction, ...transactionState } = useSecureTransaction();
  const account = useCurrentAccount();

  const purchaseProduct = useCallback(
    async (productId: string, price: number) => {
      if (!account) {
        toast.error('Please connect your wallet');
        return null;
      }

      const tx = new Transaction();
      const marketplaceId = getMarketplaceId();

      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(suiToMist(price))]);

      tx.moveCall({
        target: buildTransactionTarget('purchase_product'),
        arguments: [
          tx.object(marketplaceId),
          tx.object(productId),
          coin,
          tx.object('0x6'),
        ],
      });

      return executeTransaction(tx, {
        rateLimitKey: `purchase_${account.address}`,
      });
    },
    [account, executeTransaction]
  );

  return { purchaseProduct, ...transactionState };
}

// Post Review Hook
export function usePostReview() {
  const { executeTransaction, ...transactionState } = useSecureTransaction();
  const account = useCurrentAccount();

  const postReview = useCallback(
    async (productId: string, rating: number, comment: string) => {
      if (!account) {
        toast.error('Please connect your wallet');
        return null;
      }

      try {
        ReviewSchema.parse({ rating, comment });
      } catch (error) {
        toast.error('Invalid review data');
        return null;
      }

      const tx = new Transaction();

      tx.moveCall({
        target: buildTransactionTarget('post_review'),
        arguments: [
          tx.object(productId),
          tx.pure.u8(rating),
          tx.pure.string(comment),
          tx.object('0x6'),
        ],
      });

      return executeTransaction(tx, {
        rateLimitKey: `review_${account.address}`,
      });
    },
    [account, executeTransaction]
  );

  return { postReview, ...transactionState };
}

// Create Seller Profile Hook
export function useCreateSellerProfile() {
  const { executeTransaction, ...transactionState } = useSecureTransaction();
  const account = useCurrentAccount();

  const createProfile = useCallback(
    async (displayName: string, bio: string) => {
      if (!account) {
        toast.error('Please connect your wallet');
        return null;
      }

      try {
        ProfileSchema.parse({ displayName, bio });
      } catch (error) {
        toast.error('Invalid profile data');
        return null;
      }

      const tx = new Transaction();

      tx.moveCall({
        target: buildTransactionTarget('create_seller_profile'),
        arguments: [
          tx.pure.string(displayName),
          tx.pure.string(bio),
          tx.object('0x6'),
        ],
      });

      return executeTransaction(tx);
    },
    [account, executeTransaction]
  );

  return { createProfile, ...transactionState };
}

// Follow/Unfollow Seller Hook
export function useFollowSeller() {
  const { executeTransaction, ...transactionState } = useSecureTransaction();
  const account = useCurrentAccount();

  const followSeller = useCallback(
    async (profileId: string) => {
      if (!account) {
        toast.error('Please connect your wallet');
        return null;
      }

      const tx = new Transaction();
      tx.moveCall({
        target: buildTransactionTarget('follow_seller'),
        arguments: [tx.object(profileId), tx.object('0x6')],
      });

      return executeTransaction(tx);
    },
    [account, executeTransaction]
  );

  const unfollowSeller = useCallback(
    async (profileId: string) => {
      if (!account) {
        toast.error('Please connect your wallet');
        return null;
      }

      const tx = new Transaction();
      tx.moveCall({
        target: buildTransactionTarget('unfollow_seller'),
        arguments: [tx.object(profileId)],
      });

      return executeTransaction(tx);
    },
    [account, executeTransaction]
  );

  return { followSeller, unfollowSeller, ...transactionState };
}

// Fetch Products Hook
export function useFetchProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useSuiClient();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const packageId = OBJECT_TYPES.PRODUCT.split('::')[0];
      
      const events = await client.queryEvents({
        query: { MoveEventType: `${packageId}::marketplace::ProductListed` },
        limit: 50,
      });

      const productIds = events.data
        .map((event: any) => event.parsedJson?.product_id)
        .filter(Boolean);

      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

      const objects = await client.multiGetObjects({
        ids: productIds,
        options: { showContent: true },
      });

      const productData: Product[] = objects
        .filter((obj: any) => obj.data?.content)
        .map((obj: any) => {
          const fields = (obj.data!.content as any)?.fields;
          return {
            id: obj.data!.objectId,
            seller: fields.seller,
            title: fields.title,
            description: fields.description,
            price: fields.price,
            imageUrl: fields.image_url,
            category: fields.category,
            isAvailable: fields.is_available,
            createdAt: fields.created_at,
            totalSales: fields.total_sales,
            totalRevenue: fields.total_revenue,
            ratingSum: fields.rating_sum,
            ratingCount: fields.rating_count,
          };
        });

      setProducts(productData);
    } catch (err) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

// Fetch User Products Hook
export function useUserProducts(address?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const account = useCurrentAccount();
  const client = useSuiClient();

  const userAddress = address || account?.address;

  const fetchUserProducts = useCallback(async () => {
    if (!userAddress) return;

    setLoading(true);

    try {
      const response = await client.getOwnedObjects({
        owner: userAddress,
        filter: { StructType: OBJECT_TYPES.PRODUCT },
        options: { showContent: true },
      });

      const productData: Product[] = response.data
        .filter((obj: any) => obj.data?.content)
        .map((obj: any) => {
          const fields = (obj.data!.content as any)?.fields;
          return {
            id: obj.data!.objectId,
            seller: fields.seller,
            title: fields.title,
            description: fields.description,
            price: fields.price,
            imageUrl: fields.image_url,
            category: fields.category,
            isAvailable: fields.is_available,
            createdAt: fields.created_at,
            totalSales: fields.total_sales,
            totalRevenue: fields.total_revenue,
            ratingSum: fields.rating_sum,
            ratingCount: fields.rating_count,
          };
        });

      setProducts(productData);
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userAddress, client]);

  useEffect(() => {
    fetchUserProducts();
  }, [fetchUserProducts]);

  return { products, loading, refetch: fetchUserProducts };
}

export default {
  useSecureTransaction,
  useListProduct,
  usePurchaseProduct,
  usePostReview,
  useCreateSellerProfile,
  useFollowSeller,
  useFetchProducts,
  useUserProducts,
};