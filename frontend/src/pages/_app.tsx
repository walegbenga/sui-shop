import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, useSuiClientContext } from '@mysten/dapp-kit';
import { registerEnokiWallets, isEnokiNetwork } from '@mysten/enoki';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/contexts/CartContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@mysten/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

const networkConfig = {
  testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
  devnet:  { url: 'https://fullnode.devnet.sui.io:443',  network: 'devnet'  as const },
};

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
      providers: {
        google: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        },
      },
      client,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  const network =
    (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet') || 'testnet';

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
          <RegisterEnokiWallets />
          <WalletProvider autoConnect>
            <CartProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: { background: '#363636', color: '#fff', borderRadius: '10px', padding: '16px' },
                  success: {
                    duration: 3000,
                    iconTheme: { primary: '#10b981', secondary: '#fff' },
                    style: { background: '#10b981' },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    style: { background: '#ef4444' },
                  },
                  loading: {
                    iconTheme: { primary: '#6366f1', secondary: '#fff' },
                  },
                }}
              />
            </CartProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}