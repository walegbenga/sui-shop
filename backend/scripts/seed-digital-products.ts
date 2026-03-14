import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import * as dotenv from 'dotenv';

dotenv.config();

const NETWORK_URL = 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID!;
const MARKETPLACE_ID = process.env.MARKETPLACE_ID!;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;

// Digital Products Database
const DIGITAL_PRODUCTS = [
  // Software & Tools (100 products)
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Premium Photo Editor Pro ${i + 1}`,
    description: `Professional photo editing software with AI-powered tools, batch processing, and cloud storage. Perfect for photographers and designers.`,
    price: 2.5 + (i * 0.1),
    imageUrl: `https://picsum.photos/seed/photo${i}/400/300`,
    category: 'Electronics',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Video Editing Suite ${i + 1}`,
    description: `Advanced video editing software with 4K support, effects library, and motion graphics. Industry-standard tools included.`,
    price: 5.0 + (i * 0.2),
    imageUrl: `https://picsum.photos/seed/video${i}/400/300`,
    category: 'Electronics',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Music Production DAW ${i + 1}`,
    description: `Complete digital audio workstation with VST plugins, MIDI support, and professional mixing tools. Create studio-quality music.`,
    price: 8.0 + (i * 0.3),
    imageUrl: `https://picsum.photos/seed/music${i}/400/300`,
    category: 'Electronics',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `3D Modeling Software ${i + 1}`,
    description: `Professional 3D modeling and rendering software. Perfect for game development, architecture, and product design.`,
    price: 12.0 + (i * 0.5),
    imageUrl: `https://picsum.photos/seed/3d${i}/400/300`,
    category: 'Electronics',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Code IDE Premium ${i + 1}`,
    description: `Advanced integrated development environment with AI code completion, debugging tools, and Git integration.`,
    price: 3.0 + (i * 0.15),
    imageUrl: `https://picsum.photos/seed/code${i}/400/300`,
    category: 'Electronics',
  })),

  // Digital Art & Design (80 products)
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Digital Art Collection ${i + 1}`,
    description: `Exclusive collection of high-resolution digital artworks. Commercial license included. Perfect for prints and NFTs.`,
    price: 1.5 + (i * 0.08),
    imageUrl: `https://picsum.photos/seed/art${i}/400/300`,
    category: 'Fashion',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `UI/UX Design Kit ${i + 1}`,
    description: `Complete UI design system with 500+ components, icons, and templates. Figma and Sketch compatible.`,
    price: 4.0 + (i * 0.2),
    imageUrl: `https://picsum.photos/seed/ui${i}/400/300`,
    category: 'Fashion',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Vector Graphics Pack ${i + 1}`,
    description: `Premium vector graphics collection with 1000+ elements. Fully editable and scalable. Commercial use allowed.`,
    price: 2.0 + (i * 0.1),
    imageUrl: `https://picsum.photos/seed/vector${i}/400/300`,
    category: 'Fashion',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Motion Graphics Templates ${i + 1}`,
    description: `Professional motion graphics templates for After Effects and Premiere Pro. Perfect for social media and ads.`,
    price: 6.5 + (i * 0.25),
    imageUrl: `https://picsum.photos/seed/motion${i}/400/300`,
    category: 'Fashion',
  })),

  // Educational Content (60 products)
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Programming Masterclass ${i + 1}`,
    description: `Complete programming course with 50+ hours of video content. Learn from industry experts with hands-on projects.`,
    price: 15.0 + (i * 0.5),
    imageUrl: `https://picsum.photos/seed/prog${i}/400/300`,
    category: 'Home',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Digital Marketing Course ${i + 1}`,
    description: `Comprehensive digital marketing training covering SEO, social media, email marketing, and analytics.`,
    price: 10.0 + (i * 0.4),
    imageUrl: `https://picsum.photos/seed/market${i}/400/300`,
    category: 'Home',
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    title: `Language Learning Program ${i + 1}`,
    description: `Interactive language learning software with native speakers, exercises, and cultural insights.`,
    price: 8.0 + (i * 0.3),
    imageUrl: `https://picsum.photos/seed/lang${i}/400/300`,
    category: 'Home',
  })),

  // Music & Audio (30 products)
  ...Array.from({ length: 15 }, (_, i) => ({
    title: `Royalty-Free Music Pack ${i + 1}`,
    description: `Premium royalty-free music tracks for videos, podcasts, and games. Multiple genres included.`,
    price: 5.5 + (i * 0.25),
    imageUrl: `https://picsum.photos/seed/audio${i}/400/300`,
    category: 'Sports',
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    title: `Sound Effects Library ${i + 1}`,
    description: `Professional sound effects collection with 5000+ high-quality sounds. Perfect for video production.`,
    price: 7.0 + (i * 0.3),
    imageUrl: `https://picsum.photos/seed/sfx${i}/400/300`,
    category: 'Sports',
  })),

  // eBooks & Documents (30 products)
  ...Array.from({ length: 30 }, (_, i) => ({
    title: `Digital eBook: ${['Business Strategy', 'Tech Innovation', 'Design Thinking', 'Entrepreneurship', 'Marketing Mastery'][i % 5]} ${Math.floor(i / 5) + 1}`,
    description: `Comprehensive guide with actionable insights and real-world case studies. Includes worksheets and templates.`,
    price: 1.2 + (i * 0.05),
    imageUrl: `https://picsum.photos/seed/book${i}/400/300`,
    category: 'Home',
  })),
];

async function seedDigitalProducts() {
  console.log('🚀 Starting Digital Products Seeder...\n');

  // Initialize Sui client
  const client = new SuiClient({ url: NETWORK_URL });

  // Load keypair
  const keypair = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
  const address = keypair.toSuiAddress();

  console.log(`📍 Seeder Address: ${address}`);
  console.log(`📦 Package ID: ${PACKAGE_ID}`);
  console.log(`🏪 Marketplace ID: ${MARKETPLACE_ID}`);
  console.log(`📊 Total Products to Seed: ${DIGITAL_PRODUCTS.length}\n`);

  let successCount = 0;
  let failCount = 0;

  // Start from 300 days ago and work forward (older products first)
  const baseTimestamp = Date.now() - (300 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < DIGITAL_PRODUCTS.length; i++) {
    const product = DIGITAL_PRODUCTS[i];

    try {
      console.log(`[${i + 1}/${DIGITAL_PRODUCTS.length}] Listing: ${product.title}...`);

      const tx = new Transaction();

      const priceInMist = Math.floor(product.price * 1_000_000_000);

      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::list_product`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure(bcs.string().serialize(product.title).toBytes()),
          tx.pure(bcs.string().serialize(product.description).toBytes()),
          tx.pure(bcs.u64().serialize(priceInMist).toBytes()),
          tx.pure(bcs.string().serialize(product.imageUrl).toBytes()),
          tx.pure(bcs.string().serialize(product.category).toBytes()),
          tx.object('0x6'),
        ],
      });

      const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
        },
      });

      if (result.effects?.status?.status === 'success') {
        successCount++;
        console.log(`✅ Success! (${successCount}/${DIGITAL_PRODUCTS.length})\n`);
      } else {
        failCount++;
        console.log(`❌ Failed (${failCount})\n`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error: any) {
      failCount++;
      console.error(`❌ Error listing product: ${error.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seeding Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successfully listed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${DIGITAL_PRODUCTS.length}`);
  console.log('='.repeat(50));
  console.log('\n⏳ Wait for indexer to sync all products...');
}

seedDigitalProducts().catch(console.error);