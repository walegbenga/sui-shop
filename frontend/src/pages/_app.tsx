/**
 * App Root - Updated for @mysten/dapp-kit v1.0.3
 */

import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
//import { EnokiProvider } from '@/contexts/EnokiContext';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { CartProvider } from '@/contexts/CartContext';
import '@mysten/dapp-kit/dist/index.css';
import '../styles/globals.css';

const queryClient = new QueryClient();

// Direct network URLs
const NETWORK_URLS = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
};

// Network configuration - v1.0.3 API
const { networkConfig } = createNetworkConfig({
  testnet: { 
    url: NETWORK_URLS.testnet,
    network: 'testnet' as const
  },
  mainnet: { 
    url: NETWORK_URLS.mainnet,
    network: 'mainnet' as const
  },
  devnet: { 
    url: NETWORK_URLS.devnet,
    network: 'devnet' as const
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet') || 'testnet';

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
        <WalletProvider autoConnect>
          <CartProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}