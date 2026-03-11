/**
 * Seed Products Script
 * Populates the marketplace with test products
 */

import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const NETWORK = 'testnet';
const PACKAGE_ID = process.env.PACKAGE_ID;
const MARKETPLACE_ID = process.env.MARKETPLACE_ID;

// Sample products to seed
const SAMPLE_PRODUCTS = [
  {
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling headphones with 30-hour battery life. Perfect for music lovers and commuters.',
    price: 2500000000,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
  },
  {
    title: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit mechanical keyboard with Cherry MX switches. Perfect for gaming and typing.',
    price: 1800000000,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    category: 'Electronics',
  },
  {
    title: 'Vintage Leather Backpack',
    description: 'Handcrafted genuine leather backpack with laptop compartment. Timeless design.',
    price: 3200000000,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Fashion',
  },
  {
    title: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle keeps drinks cold for 24 hours. Eco-friendly and durable.',
    price: 450000000,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    category: 'Home',
  },
  {
    title: 'Yoga Mat Premium',
    description: 'Extra thick non-slip yoga mat with carrying strap. Perfect for yoga and fitness.',
    price: 650000000,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    category: 'Sports',
  },
  {
    title: 'Smart Watch Fitness Tracker',
    description: 'Track your fitness goals with heart rate monitoring, GPS, and sleep tracking.',
    price: 4500000000,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category: 'Electronics',
  },
  {
    title: 'Coffee Maker Deluxe',
    description: 'Programmable coffee maker with thermal carafe. Wake up to fresh coffee every morning.',
    price: 1200000000,
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
    category: 'Home',
  },
  {
    title: 'Running Shoes Pro',
    description: 'Lightweight running shoes with advanced cushioning technology. Built for speed.',
    price: 2800000000,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    category: 'Sports',
  },
  {
    title: 'Portable Bluetooth Speaker',
    description: 'Waterproof portable speaker with 360° sound. Perfect for outdoor adventures.',
    price: 850000000,
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    category: 'Electronics',
  },
  {
    title: 'Designer Sunglasses',
    description: 'UV protection polarized sunglasses with premium frames. Style meets function.',
    price: 1500000000,
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
    category: 'Fashion',
  },
  {
    title: 'Camping Tent 4-Person',
    description: 'Waterproof camping tent with easy setup. Perfect for family camping trips.',
    price: 3500000000,
    imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400',
    category: 'Sports',
  },
  {
    title: 'Desk Lamp LED',
    description: 'Adjustable LED desk lamp with USB charging port. Perfect for work and study.',
    price: 550000000,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    category: 'Home',
  },
];

async function seedProducts() {
  console.log('🌱 Starting product seeding...\n');

  const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  const privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKeyHex) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env');
    console.log('💡 Add your wallet private key to backend/.env:');
    console.log('   DEPLOYER_PRIVATE_KEY=your_private_key_hex');
    process.exit(1);
  }

  if (!PACKAGE_ID || !MARKETPLACE_ID) {
    console.error('❌ PACKAGE_ID or MARKETPLACE_ID not found in .env');
    process.exit(1);
  }

  const keypair = Ed25519Keypair.fromSecretKey(
    Uint8Array.from(Buffer.from(privateKeyHex, 'hex'))
  );
  const address = keypair.getPublicKey().toSuiAddress();

  console.log(`📍 Deployer Address: ${address}`);
  console.log(`📦 Package ID: ${PACKAGE_ID}`);
  console.log(`🏪 Marketplace ID: ${MARKETPLACE_ID}\n`);

  const balance = await client.getBalance({ owner: address });
  console.log(`💰 Balance: ${Number(balance.totalBalance) / 1e9} SUI\n`);

  if (Number(balance.totalBalance) < 1e9) {
    console.error('❌ Insufficient balance! Need at least 1 SUI for gas fees.');
    console.log('💡 Get testnet SUI from: https://faucet.sui.io/');
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
    const product = SAMPLE_PRODUCTS[i];
    
    try {
      console.log(`📦 [${i + 1}/${SAMPLE_PRODUCTS.length}] Listing: ${product.title}`);

      const txb = new TransactionBlock();

      txb.moveCall({
        target: `${PACKAGE_ID}::marketplace::list_product`,
        arguments: [
          txb.object(MARKETPLACE_ID),
          txb.pure(product.title),
          txb.pure(product.description),
          txb.pure(product.price),
          txb.pure(product.imageUrl),
          txb.pure(product.category),
        ],
      });

      const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: txb,
        options: {
          showEffects: true,
        },
      });

      console.log(`   ✅ Success! TX: ${result.digest.substring(0, 20)}...`);
      successCount++;

      // Wait 2 seconds between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n🎉 Seeding Complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\n💡 Check your indexer terminal to see products being synced to database!`);
}

seedProducts().catch(console.error);