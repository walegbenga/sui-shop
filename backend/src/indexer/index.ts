/**
 * Sui Blockchain Indexer
 * Watches events and syncs data to PostgreSQL
 */

import { suiClient, PACKAGE_ID, MARKETPLACE_ID } from '../config/sui';
import { pool } from '../config/database';

// Event types from smart contract
const EVENT_TYPES = {
  PRODUCT_LISTED: `${PACKAGE_ID}::marketplace::ProductListed`,
  PRODUCT_PURCHASED: `${PACKAGE_ID}::marketplace::ProductPurchased`,
  REVIEW_POSTED: `${PACKAGE_ID}::marketplace::ReviewPosted`,
  SELLER_FOLLOWED: `${PACKAGE_ID}::marketplace::SellerFollowed`,
};

// Store product in database
async function handleProductListed(event: any) {
  try {
    const { product_id, seller, title, description, price, image_url, category, timestamp } = event.parsedJson;

    console.log(`📦 New Product Listed: ${title}`);

    await pool.query(
      `INSERT INTO products (id, seller, title, description, price, image_url, category, is_available, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         image_url = EXCLUDED.image_url,
         category = EXCLUDED.category,
         is_available = EXCLUDED.is_available,
         updated_at = CURRENT_TIMESTAMP`,
      [product_id, seller, title, description, price, image_url, category, true, timestamp]
    );

    console.log(`✅ Stored product: ${product_id}`);
  } catch (error) {
    console.error('❌ Error handling ProductListed event:', error);
  }
}

// Store purchase in database
async function handleProductPurchased(event: any) {
  try {
    const { product_id, buyer, seller, price, platform_fee, timestamp } = event.parsedJson;

    console.log(`💰 Product Purchased: ${product_id}`);

    await pool.query(
      `INSERT INTO purchases (product_id, buyer, seller, price, platform_fee, tx_digest, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [product_id, buyer, seller, price, platform_fee, event.id.txDigest, timestamp]
    );

    await pool.query(
      `UPDATE products 
       SET total_sales = total_sales + 1,
           total_revenue = total_revenue + $1,
           is_available = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [price, product_id]
    );

    await pool.query(
      `UPDATE sellers 
       SET total_sales = total_sales + 1,
           total_revenue = total_revenue + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE address = $2`,
      [price, seller]
    );

    console.log(`✅ Recorded purchase: ${product_id}`);
  } catch (error) {
    console.error('❌ Error handling ProductPurchased event:', error);
  }
}

// Store review in database
async function handleReviewPosted(event: any) {
  try {
    const { product_id, reviewer, rating, comment, timestamp } = event.parsedJson;

    console.log(`⭐ Review Posted: ${rating}/5 for ${product_id}`);

    await pool.query(
      `INSERT INTO reviews (product_id, reviewer, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_id, reviewer) DO UPDATE SET
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment`,
      [product_id, reviewer, rating, comment, timestamp]
    );

    await pool.query(
      `UPDATE products 
       SET rating_sum = rating_sum + $1,
           rating_count = rating_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [rating, product_id]
    );

    console.log(`✅ Stored review for: ${product_id}`);
  } catch (error) {
    console.error('❌ Error handling ReviewPosted event:', error);
  }
}

// Handle seller followed event
async function handleSellerFollowed(event: any) {
  try {
    const { seller } = event.parsedJson;

    console.log(`👥 Seller Followed: ${seller}`);

    await pool.query(
      `UPDATE sellers 
       SET follower_count = follower_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE address = $1`,
      [seller]
    );

    console.log(`✅ Updated follower count for: ${seller}`);
  } catch (error) {
    console.error('❌ Error handling SellerFollowed event:', error);
  }
}

// Process events
async function processEvent(event: any) {
  const eventType = event.type;

  switch (eventType) {
    case EVENT_TYPES.PRODUCT_LISTED:
      await handleProductListed(event);
      break;
    case EVENT_TYPES.PRODUCT_PURCHASED:
      await handleProductPurchased(event);
      break;
    case EVENT_TYPES.REVIEW_POSTED:
      await handleReviewPosted(event);
      break;
    case EVENT_TYPES.SELLER_FOLLOWED:
      await handleSellerFollowed(event);
      break;
    default:
      console.log(`ℹ️  Unknown event type: ${eventType}`);
  }
}

// Get last synced checkpoint
async function getLastCheckpoint(): Promise<string> {
  const result = await pool.query('SELECT last_synced_checkpoint FROM indexer_state WHERE id = 1');
  return result.rows[0]?.last_synced_checkpoint?.toString() || '0';
}

// Update last synced checkpoint
async function updateLastCheckpoint(checkpoint: string) {
  await pool.query(
    'UPDATE indexer_state SET last_synced_checkpoint = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [checkpoint]
  );
}

// Main indexer loop
async function startIndexer() {
  console.log('🚀 Starting Sui Blockchain Indexer...');
  console.log(`📡 Watching events for package: ${PACKAGE_ID}`);

  let lastCheckpoint = await getLastCheckpoint();
  console.log(`📍 Starting from checkpoint: ${lastCheckpoint}`);

  // Poll for events every 5 seconds
  setInterval(async () => {
    try {
      console.log('🔄 Polling for new events...');
      
      const events = await suiClient.queryEvents({
        query: { MoveEventModule: { package: PACKAGE_ID, module: 'marketplace' } },
        limit: 50,
      });

      if (events.data.length > 0) {
        console.log(`📨 Processing ${events.data.length} events...`);

        for (const event of events.data) {
          await processEvent(event);
        }

        const latestEvent = events.data[events.data.length - 1];
        if (latestEvent.timestampMs) {
          await updateLastCheckpoint(latestEvent.timestampMs);
          lastCheckpoint = latestEvent.timestampMs;
        }

        console.log(`✅ Synced to checkpoint: ${lastCheckpoint}`);
      } else {
        console.log('ℹ️  No new events found');
      }
    } catch (error) {
      console.error('❌ Error in indexer loop:', error);
    }
  }, 5000);

  console.log('✅ Indexer started successfully! Polling every 5 seconds...\n');

  // Keep process alive
  return new Promise(() => {});
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down indexer...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down indexer...');
  await pool.end();
  process.exit(0);
});

// Start the indexer
startIndexer().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});