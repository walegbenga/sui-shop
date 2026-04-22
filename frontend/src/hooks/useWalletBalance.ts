// src/hooks/useWalletBalance.ts
// Fetches wallet SUI balance from chain + USD price from CoinGecko

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

interface WalletBalance {
  suiBalance: number;
  suiFormatted: string;
  usdPrice: number;
  usdValue: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

let cachedPrice: number | null = null;
let cacheTime = 0;
const PRICE_TTL = 60_000;

async function fetchSuiUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && now - cacheTime < PRICE_TTL) return cachedPrice;
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd',
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return cachedPrice || 0;
    const data = await res.json();
    cachedPrice = data?.sui?.usd || 0;
    cacheTime = now;
    return cachedPrice as number;
  } catch {
    return cachedPrice || 0;
  }
}

export function useWalletBalance(): WalletBalance {
  const account   = useCurrentAccount();
  const suiClient = useSuiClient();

  const [suiBalance, setSuiBalance] = useState(0);
  const [usdPrice,   setUsdPrice]   = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!account?.address) { setSuiBalance(0); return; }
    setLoading(true); setError(null);
    try {
      const [balResult, price] = await Promise.all([
        suiClient.getBalance({ owner: account.address, coinType: '0x2::sui::SUI' }),
        fetchSuiUsdPrice(),
      ]);
      setSuiBalance(Number(balResult.totalBalance));
      setUsdPrice(price);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [account?.address]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  useEffect(() => {
    if (!account?.address) return;
    const id = setInterval(fetchBalance, 30_000);
    return () => clearInterval(id);
  }, [account?.address, fetchBalance]);

  const sui = suiBalance / 1_000_000_000;
  return {
    suiBalance,
    suiFormatted: sui.toFixed(4),
    usdPrice,
    usdValue: (sui * usdPrice).toFixed(2),
    loading,
    error,
    refresh: fetchBalance,
  };
}
