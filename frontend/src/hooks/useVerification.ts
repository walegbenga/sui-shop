// src/hooks/useVerification.ts
// Hook to check if an address is a verified seller or buyer

import { useState, useEffect } from 'react';

interface VerificationState {
  isVerifiedSeller: boolean;
  isVerifiedBuyer: boolean;
  loading: boolean;
}

const cache = new Map<string, { seller: boolean; buyer: boolean; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

export function useVerification(address: string | undefined): VerificationState {
  const [state, setState] = useState<VerificationState>({
    isVerifiedSeller: false,
    isVerifiedBuyer: false,
    loading: false,
  });

  useEffect(() => {
    if (!address) {
      setState({ isVerifiedSeller: false, isVerifiedBuyer: false, loading: false });
      return;
    }

    // Check cache
    const cached = cache.get(address);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({
        isVerifiedSeller: cached.seller,
        isVerifiedBuyer: cached.buyer,
        loading: false,
      });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    const check = async () => {
      try {
        const [sellerRes, buyerRes] = await Promise.all([
          fetch(`http://localhost:4000/api/sellers/${address}`),
          fetch(`http://localhost:4000/api/verified-buyer/${address}`),
        ]);

        const sellerData = sellerRes.ok ? await sellerRes.json() : null;
        const buyerData = buyerRes.ok ? await buyerRes.json() : null;

        const isVerifiedSeller = sellerData?.is_verified === true;
        const isVerifiedBuyer = buyerData?.isVerifiedBuyer === true;

        cache.set(address, {
          seller: isVerifiedSeller,
          buyer: isVerifiedBuyer,
          ts: Date.now(),
        });

        setState({ isVerifiedSeller, isVerifiedBuyer, loading: false });
      } catch {
        setState({ isVerifiedSeller: false, isVerifiedBuyer: false, loading: false });
      }
    };

    check();
  }, [address]);

  return state;
}

// Lightweight version — just checks one type
export function useIsVerifiedSeller(address: string | undefined): boolean {
  const { isVerifiedSeller } = useVerification(address);
  return isVerifiedSeller;
}

export function useIsVerifiedBuyer(address: string | undefined): boolean {
  const { isVerifiedBuyer } = useVerification(address);
  return isVerifiedBuyer;
}
