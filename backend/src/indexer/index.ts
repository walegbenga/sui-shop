import { SuiClient } from '@mysten/sui/client';
import { pool, initializeDatabase } from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

const NETWORK_URL = 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID!;
const MARKETPLACE_ID = process.env.MARKETPLACE_ID!;
const POLL_INTERVAL = 5000;

const suiClient = new SuiClient({ url: NETWORK_URL });

console.log('✅ Sui Client connected to testnet');
console.log(`📦 Package ID: ${PACKAGE_ID}`);
console.log(`🏪 Marketplace ID: ${MARKETPLACE_ID}`);

async function getLastCheckpoint(): Promise<bigint> {
  const result = await pool.query(
    'SELECT last_processed_checkpoint FROM indexer_state WHERE id = 1'
  );
  return BigInt(result.rows[0]?.last_processed_checkpoint || 0);
}

async function updateLastCheckpoint(checkpoint: bigint) {
  await pool.query(
    'UPDATE indexer_state SET last_processed_checkpoint = $1, updated_at = NOW() WHERE id = 1',
    [checkpoint.toString()]
  );
}

async function processEvents() {
  try {
    const lastCheckpoint = await getLastCheckpoint();

    const events = await suiClient.queryEvents({
      query: {
        MoveEventModule: {
          package: PACKAGE_ID,
          module: 'marketplace',
        },
      },
      order: 'ascending',
    });

    if (!events.data || events.data.length === 0) {
      return;
    }

    console.log(`📊 Found ${events.data.length} events`);

    for (const event of events.data) {
      const eventType = event.type.split('::').pop();
      const parsedJson = event.parsedJson;

      console.log(`\n🔔 Event: ${eventType}`);

      if (eventType === 'ProductListed') {
        const productId = (parsedJson as any).product_id;
        const seller = (parsedJson as any).seller;
        const price = (parsedJson as any).price;
        const timestamp = (parsedJson as any).timestamp;

        console.log(`📦 Product Listed: ${productId}`);

        try {
          const productObject = await suiClient.getObject({
            id: productId,
            options: { showContent: true },
          });

          if (productObject.data?.content) {
            const content = productObject.data.content as any;
            const fields = content.fields;

            // Map contract fields to database fields
            const title = fields.name || '';  // contract uses "name"
            const description = fields.description || '';
            const imageUrl = fields.image_url || '';
            const category = fields.category || 'Other';
            const quantityAvailable = fields.quantity_available || 1; // contract field
            const resellable = fields.resellable || false;
            const fileCid = fields.file_cid || '';

            await pool.query(
  `INSERT INTO products (
    id, seller, title, description, price, image_url, category, 
    is_available, total_sales, rating_sum, rating_count, 
    quantity, available_quantity, resellable, file_cid,
    created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
  ON CONFLICT (id) 
  DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    category = EXCLUDED.category,
    available_quantity = EXCLUDED.available_quantity,
    resellable = EXCLUDED.resellable,
    file_cid = EXCLUDED.file_cid,
    updated_at = EXCLUDED.updated_at`,
  [
    productId,
    seller,
    title,
    description,
    price,
    imageUrl,
    category,
    true,  // is_available
    0,     // total_sales
    0,     // rating_sum
    0,     // rating_count
    quantityAvailable,
    quantityAvailable,
    resellable,
    fileCid,
    Number(timestamp),  // ✅ FIXED - no new Date()
    Number(timestamp),  // ✅ FIXED - no new Date()
  ]
);

            console.log(`✅ Product stored in database`);

            await pool.query(
              `INSERT INTO sellers (address, total_sales, total_revenue, follower_count, is_banned)
               VALUES ($1, 0, 0, 0, FALSE)
               ON CONFLICT (address) DO NOTHING`,
              [seller]
            );
          }
        } catch (error) {
          console.error(`❌ Error fetching product object:`, error);
        }
      }

      else if (eventType === 'ProductPurchased') {
        const productId = (parsedJson as any).product_id;
        const buyer = (parsedJson as any).buyer;
        const seller = (parsedJson as any).seller;
        const price = (parsedJson as any).price;
        const platformFee = (parsedJson as any).platform_fee;
        const timestamp = (parsedJson as any).timestamp;
        const quantity = (parsedJson as any).quantity || 1;

        const purchaseId = `${event.id.txDigest}-${event.id.eventSeq}`;

        console.log(`💰 Product Purchased: ${productId}`);

        // Decrement available_quantity, mark unavailable if 0
        await pool.query(
  `UPDATE products 
   SET available_quantity = GREATEST(available_quantity - $1, 0),
       is_available = CASE 
         WHEN available_quantity - $1 <= 0 THEN FALSE 
         ELSE TRUE 
       END,
       total_sales = total_sales + $1,
       updated_at = $2
   WHERE id = $3`,
  [quantity, Number(timestamp), productId]  // ✅ FIXED
);

await pool.query(
  `INSERT INTO purchases (id, product_id, buyer, seller, price, platform_fee, tx_digest, created_at)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
   ON CONFLICT (id) DO NOTHING`,
  [purchaseId, productId, buyer, seller, price, platformFee, event.id.txDigest, Number(timestamp)]  // ✅ FIXED
);

        await pool.query(
          `UPDATE sellers 
           SET total_sales = total_sales + 1,
               total_revenue = total_revenue + $1,
               updated_at = NOW()
           WHERE address = $2`,
          [price, seller]
        );

        console.log(`✅ Purchase recorded`);
      }

      else if (eventType === 'ReviewPosted') {
        const productId = (parsedJson as any).product_id;
        const reviewer = (parsedJson as any).reviewer;
        const rating = (parsedJson as any).rating;
        const comment = (parsedJson as any).comment;
        const timestamp = (parsedJson as any).timestamp;

        console.log(`⭐ Review Posted: ${productId}`);

        await pool.query(
  `INSERT INTO reviews (product_id, reviewer, rating, comment, created_at)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (product_id, reviewer) 
   DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
  [productId, reviewer, rating, comment, Number(timestamp)]  // ✅ FIXED
);

await pool.query(
  `UPDATE products 
   SET rating_sum = (
         SELECT COALESCE(SUM(rating), 0) FROM reviews WHERE product_id = $1
       ),
       rating_count = (
         SELECT COUNT(*) FROM reviews WHERE product_id = $1
       ),
       updated_at = $2
   WHERE id = $1`,
  [productId, Number(timestamp)]  // ✅ FIXED
);

        console.log(`✅ Review stored`);
      }
    }

    if (events.data.length > 0) {
      const latestCheckpoint = BigInt(events.data[events.data.length - 1].id.eventSeq);
      await updateLastCheckpoint(latestCheckpoint);
    }

  } catch (error: any) {
    if (error.status === 504 || error.status === 503) {
      console.log('⚠️  Sui RPC timeout, will retry...');
      return;
    }
    console.error('❌ Error processing events:', error);
  }
}

async function startIndexer() {
  console.log('🚀 Starting Sui Blockchain Indexer...\n');
  await initializeDatabase();

  setInterval(async () => {
    console.log('🔄 Polling for new events...');
    await processEvents();
  }, POLL_INTERVAL);

  await processEvents();
}

startIndexer().catch(console.error);