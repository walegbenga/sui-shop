import { SuiClient } from '@mysten/sui/client';
import { pool, initializeDatabase } from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

const NETWORK_URL = 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID!;
const MARKETPLACE_ID = process.env.MARKETPLACE_ID!;
const POLL_INTERVAL = 5000; // 5 seconds

// Initialize Sui client
const suiClient = new SuiClient({ url: NETWORK_URL });

console.log('✅ Sui Client connected to testnet');
console.log(`📦 Package ID: ${PACKAGE_ID}`);
console.log(`🏪 Marketplace ID: ${MARKETPLACE_ID}`);

// Get last processed checkpoint
async function getLastCheckpoint(): Promise<bigint> {
  const result = await pool.query(
    'SELECT last_processed_checkpoint FROM indexer_state WHERE id = 1'
  );
  return BigInt(result.rows[0]?.last_processed_checkpoint || 0);
}

// Update last processed checkpoint
async function updateLastCheckpoint(checkpoint: bigint) {
  await pool.query(
    'UPDATE indexer_state SET last_processed_checkpoint = $1, updated_at = NOW() WHERE id = 1',
    [checkpoint.toString()]
  );
}

// Process events
async function processEvents() {
  try {
    const lastCheckpoint = await getLastCheckpoint();

    // Query events from the marketplace module
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

      // Handle ProductListed event
      if (eventType === 'ProductListed') {
        const productId = (parsedJson as any).product_id;
        const seller = (parsedJson as any).seller;
        const title = (parsedJson as any).title;
        const price = (parsedJson as any).price;
        const timestamp = (parsedJson as any).timestamp;

        console.log(`📦 Product Listed: ${title} (${productId})`);
        console.log(`   Seller: ${seller}`);
        console.log(`   Price: ${price} MIST`);
        console.log(`   Timestamp: ${timestamp}`);

        // Fetch full product object to get description, image_url, category
        try {
          const productObject = await suiClient.getObject({
            id: productId,
            options: { showContent: true },
          });

          if (productObject.data?.content) {
            const content = productObject.data.content as any;
            const fields = content.fields;

            const description = fields.description || '';
            const imageUrl = fields.image_url || '';
            const category = fields.category || 'Other';

            console.log(`   Description: ${description.substring(0, 50)}...`);
            console.log(`   Image URL: ${imageUrl}`);
            console.log(`   Category: ${category}`);

            // Insert or update product in database
            await pool.query(
              `INSERT INTO products (
                id, seller, title, description, price, image_url, category, 
                is_available, total_sales, rating_sum, rating_count, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              ON CONFLICT (id) 
              DO UPDATE SET 
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                price = EXCLUDED.price,
                image_url = EXCLUDED.image_url,
                category = EXCLUDED.category,
                updated_at = EXCLUDED.updated_at`,
              [
                productId,
                seller,
                title,
                description,
                price,
                imageUrl,
                category,
                true, // is_available
                0,    // total_sales
                0,    // rating_sum
                0,    // rating_count
                timestamp, // created_at from blockchain
                timestamp, // updated_at from blockchain
              ]
            );

            console.log(`✅ Product stored in database`);

            // Ensure seller exists
            await pool.query(
              `INSERT INTO sellers (address, total_sales, total_revenue, follower_count, is_banned)
               VALUES ($1, 0, 0, 0, FALSE)
               ON CONFLICT (address) DO NOTHING`,
              [seller]
            );
          }
        } catch (error) {
          console.error(`❌ Error fetching product object: ${error}`);
        }
      }

      // Handle ProductPurchased event
else if (eventType === 'ProductPurchased') {
  const productId = (parsedJson as any).product_id;
  const buyer = (parsedJson as any).buyer;
  const seller = (parsedJson as any).seller;
  const price = (parsedJson as any).price;
  const platformFee = (parsedJson as any).platform_fee;
  const timestamp = (parsedJson as any).timestamp;

  // Generate purchase ID from transaction digest and event sequence
  const purchaseId = `${event.id.txDigest}-${event.id.eventSeq}`;

  console.log(`💰 Product Purchased: ${productId}`);
  console.log(`   Purchase ID: ${purchaseId}`);
  console.log(`   Buyer: ${buyer}`);
  console.log(`   Seller: ${seller}`);
  console.log(`   Price: ${price} MIST`);

  // Update product availability and sales count
  await pool.query(
    `UPDATE products 
     SET is_available = FALSE, 
         total_sales = total_sales + 1,
         updated_at = $1
     WHERE id = $2`,
    [timestamp, productId]
  );

  // Record purchase
  await pool.query(
    `INSERT INTO purchases (id, product_id, buyer, seller, price, platform_fee, tx_digest, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [purchaseId, productId, buyer, seller, price, platformFee, event.id.txDigest, timestamp]
  );

  // Update seller stats
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

      // Handle ReviewPosted event
      else if (eventType === 'ReviewPosted') {
        const productId = (parsedJson as any).product_id;
        const reviewer = (parsedJson as any).reviewer;
        const rating = (parsedJson as any).rating;
        const comment = (parsedJson as any).comment;
        const timestamp = (parsedJson as any).timestamp;

        console.log(`⭐ Review Posted: ${productId}`);
        console.log(`   Reviewer: ${reviewer}`);
        console.log(`   Rating: ${rating}/5`);

        // Insert review
        await pool.query(
          `INSERT INTO reviews (product_id, reviewer, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (product_id, reviewer) 
           DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
          [productId, reviewer, rating, comment, timestamp]
        );

        // Update product rating stats
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
          [productId, timestamp]
        );

        console.log(`✅ Review stored`);
      }

      // Unknown event
      else {
        console.log(`❓ Unknown event type: ${eventType}`);
      }
    }

    // Update checkpoint if we processed events
    if (events.data.length > 0) {
      const latestCheckpoint = BigInt(events.data[events.data.length - 1].id.eventSeq);
      await updateLastCheckpoint(latestCheckpoint);
    }

  } catch (error) {
    console.error('❌ Error processing events:', error);
  }
}

// Main indexer loop
async function startIndexer() {
  console.log('🚀 Starting Sui Blockchain Indexer...\n');

  // Initialize database
  await initializeDatabase();

  // Start polling
  setInterval(async () => {
    console.log('🔄 Polling for new events...');
    await processEvents();
  }, POLL_INTERVAL);

  // Initial fetch
  await processEvents();
}

// Start the indexer
startIndexer().catch(console.error);