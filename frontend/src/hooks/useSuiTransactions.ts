import { useState, useEffect, useCallback } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import toast from 'react-hot-toast';

// Helper function to safely extract error messages
function getSafeErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.toString) return error.toString();
  return 'An unknown error occurred';
}

// ==================== Fetch Products with Filters Hook ====================

export function useFetchProducts(filters?: {
  category?: string | null;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`http://localhost:4000/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
      });
    } catch (err: any) {
      const errorMessage = getSafeErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching products:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.category,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.search,
    filters?.sortBy,
    filters?.page,
    filters?.limit,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
  };
}

// ==================== Fetch Products by Category (Backward Compatibility) ====================

export function useFetchProductsByCategory(category: string | null) {
  return useFetchProducts({ category });
}

// ==================== Fetch Single Product Hook ====================

export function useFetchProduct(productId: string | null) {
  const [product, setProduct] = useState<any>(null);
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
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      
      // Map database fields to component expected format
      const mappedProduct = {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.image_url,
        category: data.category,
        seller: data.seller,
        isAvailable: data.is_available,
        totalSales: data.total_sales,
        ratingSum: data.rating_sum,
        ratingCount: data.rating_count,
        createdAt: data.created_at,
      };

      setProduct(mappedProduct);
    } catch (err: any) {
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

// ==================== Fetch User Products Hook ====================

export function useUserProducts(userAddress: string | undefined) {
  const [products, setProducts] = useState<any[]>([]);
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
      const response = await fetch(`http://localhost:4000/api/sellers/${userAddress}/products`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user products');
      }

      const data = await response.json();
      
      // Map database fields to component expected format
      const mappedProducts = (data.products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.image_url,
        category: p.category,
        seller: p.seller,
        isAvailable: p.is_available,
        totalSales: p.total_sales,
        ratingSum: p.rating_sum,
        ratingCount: p.rating_count,
        createdAt: p.created_at,
      }));

      setProducts(mappedProducts);
    } catch (err: any) {
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