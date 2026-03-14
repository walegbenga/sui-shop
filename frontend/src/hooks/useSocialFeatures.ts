import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// ==================== Follow/Unfollow Hooks ====================

export function useFollowSeller(sellerAddress: string | null, userAddress: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sellerAddress && userAddress) {
      checkFollowStatus();
    }
  }, [sellerAddress, userAddress]);

  const checkFollowStatus = async () => {
    if (!sellerAddress || !userAddress) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/sellers/${sellerAddress}/following/${userAddress}`
      );
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!sellerAddress || !userAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(
        `http://localhost:4000/api/sellers/${sellerAddress}/follow`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerAddress: userAddress }),
        }
      );

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? 'Unfollowed' : 'Following! 🎉');
      } else {
        throw new Error('Failed to update follow status');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, loading, toggleFollow };
}

export function useUserFollowing(userAddress: string | undefined) {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userAddress) {
      fetchFollowing();
    }
  }, [userAddress]);

  const fetchFollowing = async () => {
    if (!userAddress) return;

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:4000/api/users/${userAddress}/following`
      );
      const data = await response.json();
      setFollowing(data.following || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  return { following, loading, refetch: fetchFollowing };
}

// ==================== Favorites/Wishlist Hooks ====================

export function useFavoriteProduct(productId: string | null, userAddress: string | undefined) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productId && userAddress) {
      checkFavoriteStatus();
    }
  }, [productId, userAddress]);

  const checkFavoriteStatus = async () => {
    if (!productId || !userAddress) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/favorites/check/${userAddress}/${productId}`
      );
      const data = await response.json();
      setIsFavorited(data.isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!productId || !userAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch('http://localhost:4000/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, productId }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
        toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites! ❤️');
      } else {
        throw new Error('Failed to update favorite status');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { isFavorited, loading, toggleFavorite };
}

export function useUserFavorites(userAddress: string | undefined) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userAddress) {
      fetchFavorites();
    }
  }, [userAddress]);

  const fetchFavorites = async () => {
    if (!userAddress) return;

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:4000/api/users/${userAddress}/favorites`
      );
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  return { favorites, loading, refetch: fetchFavorites };
}