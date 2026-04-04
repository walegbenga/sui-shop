import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PACKAGE_ID = process.env.PACKAGE_ID;
const MARKETPLACE_ID = process.env.MARKETPLACE_ID;

if (!PACKAGE_ID || !MARKETPLACE_ID) {
  console.error('❌ Missing PACKAGE_ID or MARKETPLACE_ID in .env');
  process.exit(1);
}

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// ✅ REPLACE WITH YOUR ACTUAL PRIVATE KEY
const PRIVATE_KEY = 'suiprivkey1qrluxf5pztplg26x4njyd2zdhdf25z64ph0dfe83x4javkzqevg06gnsx9j';

if (!PRIVATE_KEY || PRIVATE_KEY.startsWith('suiprivkey1q...')) {
  console.error('❌ Please add your private key to the script!');
  process.exit(1);
}

const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

console.log(`✅ Address: ${keypair.toSuiAddress()}`);
console.log(`📦 Package: ${PACKAGE_ID}`);
console.log(`🏪 Marketplace: ${MARKETPLACE_ID}`);

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'];

const SAMPLE_PRODUCTS = [
  { name: 'Wireless Headphones', desc: 'Premium noise canceling', price: 2.5, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
  { name: 'Smart Watch', desc: 'Fitness tracking smartwatch', price: 3.0, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
  { name: 'Laptop Stand', desc: 'Ergonomic aluminum stand', price: 1.5, img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400' },
  { name: 'Designer Sunglasses', desc: 'UV protection', price: 2.0, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
  { name: 'Leather Wallet', desc: 'Genuine leather bifold', price: 1.2, img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' },
  { name: 'Canvas Backpack', desc: 'Durable travel backpack', price: 2.8, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
  { name: 'Coffee Maker', desc: 'Programmable machine', price: 3.5, img: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400' },
  { name: 'Desk Lamp', desc: 'LED adjustable lamp', price: 1.8, img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400' },
  { name: 'Yoga Mat', desc: 'Non-slip exercise mat', price: 1.5, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400' },
  { name: 'Water Bottle', desc: 'Insulated steel bottle', price: 1.0, img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400' },
];

async function seedProducts() {
  console.log('🌱 Seeding 300 products...\n');
  let count = 0;
  let failed = 0;

  for (let batch = 0; batch < 30; batch++) {
    for (const product of SAMPLE_PRODUCTS) {
      try {
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const resellable = Math.random() > 0.5;
        const priceVariation = product.price + (Math.random() * 2 - 1);
        const priceInMist = Math.floor(Math.max(0.1, priceVariation) * 1_000_000_000);

        const name = `${product.name} #${count + 1}`;

        const tx = new Transaction();
        
        // ✅ TYPE ASSERTION TO FIX TYPESCRIPT ERROR
        tx.moveCall({
          target: `${PACKAGE_ID}::marketplace::list_product`,
          arguments: [
            tx.object(MARKETPLACE_ID as string), // ✅ FIXED
            tx.pure.string(name),
            tx.pure.string(product.desc),
            tx.pure.u64(priceInMist),
            tx.pure.u64(quantity),
            tx.pure.string(category),
            tx.pure.bool(resellable),
            tx.pure.string(''),
            tx.object('0x6'),
          ],
        });

        await client.signAndExecuteTransaction({
          signer: keypair,
          transaction: tx,
          options: { showEffects: true },
        });

        count++;
        console.log(`✅ [${count}/300] ${name} - ${(priceInMist / 1e9).toFixed(2)} SUI`);
        
        await new Promise(r => setTimeout(r, 1000));
      } catch (error: any) {
        failed++;
        console.error(`❌ [${failed}] ${error.message}`);
      }
    }
  }

  console.log(`\n🎉 Complete!`);
  console.log(`✅ Created: ${count}`);
  console.log(`❌ Failed: ${failed}`);
}

seedProducts();