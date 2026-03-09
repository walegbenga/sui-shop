/**
 * Sui Network Configuration
 */

import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

export const NETWORK = (process.env.SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet';

const NETWORK_URLS = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
};

export const NETWORK_URL = NETWORK_URLS[NETWORK];
export const PACKAGE_ID = process.env.PACKAGE_ID || '';
export const MARKETPLACE_ID = process.env.MARKETPLACE_ID || '';

if (!PACKAGE_ID) {
  console.error('❌ PACKAGE_ID not set in environment variables');
  process.exit(1);
}

if (!MARKETPLACE_ID) {
  console.error('❌ MARKETPLACE_ID not set in environment variables');
  process.exit(1);
}

export const suiClient = new SuiClient({ url: NETWORK_URL });

console.log(`✅ Sui Client connected to ${NETWORK}`);
console.log(`📦 Package ID: ${PACKAGE_ID}`);
console.log(`🏪 Marketplace ID: ${MARKETPLACE_ID}`);