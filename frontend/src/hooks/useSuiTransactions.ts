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
/*export function usePostReview() {
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
}*/

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
/*export function useFetchProducts() {
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
}*/

// ==================== Fetch Products Hook ====================

// ==================== Fetch Products Hook ====================

export function useFetchProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Query backend API instead of blockchain
      const response = await fetch('http://localhost:4000/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      // Transform API response to match Product interface
      const productData: Product[] = data.products.map((p: any) => ({
        id: p.id,
        seller: p.seller,
        title: p.title,
        description: p.description,
        price: p.price.toString(),
        imageUrl: p.image_url,
        category: p.category,
        isAvailable: p.is_available,
        createdAt: p.created_at.toString(),
        totalSales: p.total_sales?.toString() || '0',
        totalRevenue: p.total_revenue?.toString() || '0',
        ratingSum: p.rating_sum?.toString() || '0',
        ratingCount: p.rating_count?.toString() || '0',
      }));

      setProducts(productData);
    } catch (err) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching products:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}

// Fetch User Products Hook
// ==================== Fetch User's Products Hook ====================

export function useUserProducts(userAddress: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProducts = useCallback(async () => {
    if (!userAddress) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query backend API
      const response = await fetch(`http://localhost:4000/api/sellers/${userAddress}/products`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user products');
      }

      const data = await response.json();
      
      const productData: Product[] = data.products.map((p: any) => ({
        id: p.id,
        seller: p.seller,
        title: p.title,
        description: p.description,
        price: p.price.toString(),
        imageUrl: p.image_url,
        category: p.category,
        isAvailable: p.is_available,
        createdAt: p.created_at.toString(),
        totalSales: p.total_sales?.toString() || '0',
        totalRevenue: p.total_revenue?.toString() || '0',
        ratingSum: p.rating_sum?.toString() || '0',
        ratingCount: p.rating_count?.toString() || '0',
      }));

      setProducts(productData);
    } catch (err) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching user products:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchUserProducts();
  }, [fetchUserProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchUserProducts,
  };
}

// ==================== Fetch Products by Category ====================

export function useFetchProductsByCategory(category: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = category 
        ? `http://localhost:4000/api/products?category=${encodeURIComponent(category)}`
        : 'http://localhost:4000/api/products';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      const productData: Product[] = data.products.map((p: any) => ({
        id: p.id,
        seller: p.seller,
        title: p.title,
        description: p.description,
        price: p.price.toString(),
        imageUrl: p.image_url,
        category: p.category,
        isAvailable: p.is_available,
        createdAt: p.created_at.toString(),
        totalSales: p.total_sales?.toString() || '0',
        totalRevenue: p.total_revenue?.toString() || '0',
        ratingSum: p.rating_sum?.toString() || '0',
        ratingCount: p.rating_count?.toString() || '0',
      }));

      setProducts(productData);
    } catch (err) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching products:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}

// ==================== Fetch Single Product ====================

export function useFetchProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const p = await response.json();
      
      const productData: Product = {
        id: p.id,
        seller: p.seller,
        title: p.title,
        description: p.description,
        price: p.price.toString(),
        imageUrl: p.image_url,
        category: p.category,
        isAvailable: p.is_available,
        createdAt: p.created_at.toString(),
        totalSales: p.total_sales?.toString() || '0',
        totalRevenue: p.total_revenue?.toString() || '0',
        ratingSum: p.rating_sum?.toString() || '0',
        ratingCount: p.rating_count?.toString() || '0',
      };

      setProduct(productData);
    } catch (err) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching product:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}


// ==================== Post Review Hook ====================

export function usePostReview() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const postReview = async (
    productId: string,
    rating: number,
    comment: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    setLoading(true);

    try {
      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
      const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::post_review`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.object(productId),
          tx.pure.u8(rating),
          tx.pure.string(comment),
          tx.object('0x6'), // Clock
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Review posted:', result);
            toast.success('Review posted successfully! ⭐');
            if (onSuccess) onSuccess();
          },
          onError: (error) => {
            console.error('Review failed:', error);
            const errorMsg = error.message || 'Failed to post review';
            toast.error(errorMsg);
            if (onError) onError(errorMsg);
          },
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message);
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    postReview,
    loading,
  };
}

// ==================== Fetch Product Reviews Hook ====================

export function useFetchProductReviews(productId: string | null) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}/reviews`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching reviews:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews,
  };
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
  useFetchProductsByCategory,
  useFetchProduct,
};