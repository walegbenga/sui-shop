/**
 * Sui Blockchain Configuration - @mysten/sui v2.6.0
 */

// Import from @mysten/dapp-kit which already uses the correct SuiClient
import { useSuiClient } from '@mysten/dapp-kit';

export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet') || 'testnet';

// Direct network URLs (since getFullnodeUrl doesn't exist in this version)
const NETWORK_URLS = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
};

export const NETWORK_URL = NETWORK_URLS[NETWORK];

export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';
export const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID || '';

if (!PACKAGE_ID) {
  console.warn('⚠️  NEXT_PUBLIC_PACKAGE_ID not set');
}

// We'll use the hook from dapp-kit instead of creating our own client
export { useSuiClient as useClient } from '@mysten/dapp-kit';

export function buildTransactionTarget(functionName: string): string {
  return `${PACKAGE_ID}::marketplace::${functionName}`;
}

export function getMarketplaceId(): string {
  if (!MARKETPLACE_ID) {
    throw new Error('Marketplace ID not configured');
  }
  return MARKETPLACE_ID;
}

export const OBJECT_TYPES = {
  MARKETPLACE: `${PACKAGE_ID}::marketplace::Marketplace`,
  PRODUCT: `${PACKAGE_ID}::marketplace::Product`,
  SELLER_PROFILE: `${PACKAGE_ID}::marketplace::SellerProfile`,
  REVIEW: `${PACKAGE_ID}::marketplace::Review`,
  PURCHASE_RECEIPT: `${PACKAGE_ID}::marketplace::PurchaseReceipt`,
  ADMIN_CAP: `${PACKAGE_ID}::marketplace::AdminCap`,
};

export const GAS_BUDGET = {
  CREATE_MARKETPLACE: 100_000_000,
  CREATE_PROFILE: 50_000_000,
  LIST_PRODUCT: 50_000_000,
  PURCHASE: 100_000_000,
  REVIEW: 30_000_000,
  FOLLOW: 20_000_000,
  UPDATE_PRODUCT: 30_000_000,
  ADMIN_ACTION: 50_000_000,
};