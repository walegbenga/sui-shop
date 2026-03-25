import { EnokiFlow, ZkLoginProvider } from '@mysten/enoki/react';

if (!process.env.NEXT_PUBLIC_ENOKI_API_KEY) {
  throw new Error('NEXT_PUBLIC_ENOKI_API_KEY is not set');
}

export const enokiFlow = new EnokiFlow({
  apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY,
  network: process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' || 'testnet',
});