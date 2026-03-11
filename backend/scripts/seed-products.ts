/**
 * Seed Products Script - @mysten/sui v1.14.2
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import dotenv from 'dotenv';

dotenv.config();

const NETWORK_URL = 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID;
const MARKETPLACE_ID = process.env.MARKETPLACE_ID;

const SAMPLE_PRODUCTS = [
  {
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling headphones with 30-hour battery life.',
    price: '2500000000',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
  },
  {
    title: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit mechanical keyboard with Cherry MX switches.',
    price: '1800000000',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    category: 'Electronics',
  },
  {
    title: 'Vintage Leather Backpack',
    description: 'Handcrafted genuine leather backpack.',
    price: '3200000000',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Fashion',
  },
  {
    title: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle keeps drinks cold for 24 hours.',
    price: '450000000',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    category: 'Home',
  },
  {
    title: 'Yoga Mat Premium',
    description: 'Extra thick non-slip yoga mat with carrying strap.',
    price: '650000000',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    category: 'Sports',
  },
];

async function seedProducts() {
  console.log('🌱 Starting product seeding...\n');

  const client = new SuiClient({ url: NETWORK_URL });
  const privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKeyHex || !PACKAGE_ID || !MARKETPLACE_ID) {
    console.error('❌ Missing env variables');
    process.exit(1);
  }

  const keypair = Ed25519Keypair.fromSecretKey(privateKeyHex);
  const address = keypair.getPublicKey().toSuiAddress();

  console.log(`📍 Address: ${address}`);
  console.log(`📦 Package: ${PACKAGE_ID}\n`);

  const balance = await client.getBalance({ owner: address });
  console.log(`💰 Balance: ${Number(balance.totalBalance) / 1e9} SUI\n`);

  let successCount = 0;

  for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
    const product = SAMPLE_PRODUCTS[i];
    
    try {
      console.log(`📦 [${i + 1}/${SAMPLE_PRODUCTS.length}] ${product.title}`);

      const tx = new Transaction();

      tx.moveCall({
  target: `${PACKAGE_ID}::marketplace::list_product`,
  arguments: [
    tx.object(MARKETPLACE_ID),
    tx.pure(bcs.string().serialize(product.title).toBytes()),
    tx.pure(bcs.string().serialize(product.description).toBytes()),
    tx.pure(bcs.u64().serialize(product.price).toBytes()),
    tx.pure(bcs.string().serialize(product.imageUrl).toBytes()),
    tx.pure(bcs.string().serialize(product.category).toBytes()),
    tx.object('0x6'),  // Clock object
  ],
});

      const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
      });

      console.log(`   ✅ TX: ${res.digest.substring(0, 15)}...`);
      successCount++;

      await new Promise(r => setTimeout(r, 2000));

    } catch (error: any) {
      console.log(`   ❌ ${error.message}`);
    }
  }

  console.log(`\n🎉 Done! ${successCount}/${SAMPLE_PRODUCTS.length} products listed`);
}

seedProducts().catch(console.error);