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

// ── Cursor helpers ────────────────────────────────────────────────────────────

async function getSavedCursor(): Promise<any | null> {
  const result = await pool.query(
    'SELECT last_event_cursor FROM indexer_state WHERE id = 1'
  );
  const raw = result.rows[0]?.last_event_cursor;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCursor(cursor: any) {
  await pool.query(
    `UPDATE indexer_state
     SET last_event_cursor = $1, updated_at = NOW()
     WHERE id = 1`,
    [JSON.stringify(cursor)]
  );
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleProductListed(event: any) {
  const parsedJson = event.parsedJson as any;
  const productId = parsedJson.product_id;
  const seller    = parsedJson.seller;
  const price     = parsedJson.price;
  const timestamp = parsedJson.timestamp;

  console.log(`📦 ProductListed: ${productId}`);

  try {
    const productObject = await suiClient.getObject({
      id: productId,
      options: { showContent: true },
    });

    if (!productObject.data?.content) {
      console.warn(`⚠️  No content for product ${productId}`);
      return;
    }

    const fields = (productObject.data.content as any).fields;

    const title             = fields.name             || '';
    const description       = fields.description      || '';
    const imageUrl          = fields.image_url        || '';
    const category          = fields.category         || 'Other';
    const quantityAvailable = Number(fields.quantity_available) || 1;
    const isActive          = fields.is_active        !== false;
    const resellable        = fields.resellable       || false;
    const fileCid           = fields.file_cid         || '';

    console.log(`   Title:      ${title}`);
    console.log(`   Category:   ${category}`);
    console.log(`   Quantity:   ${quantityAvailable}`);
    console.log(`   Active:     ${isActive}`);
    console.log(`   Resellable: ${resellable}`);
    console.log(`   File CID:   ${fileCid}`);

    await pool.query(
      `INSERT INTO products (
         id, seller, title, description, price, image_url, category,
         is_available, total_sales, rating_sum, rating_count,
         quantity, available_quantity, resellable, file_cid,
         created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO UPDATE SET
         title              = EXCLUDED.title,
         description        = EXCLUDED.description,
         price              = EXCLUDED.price,
         image_url          = EXCLUDED.image_url,
         category           = EXCLUDED.category,
         is_available       = EXCLUDED.is_available,
         quantity           = EXCLUDED.quantity,
         available_quantity = EXCLUDED.available_quantity,
         resellable         = EXCLUDED.resellable,
         file_cid           = EXCLUDED.file_cid,
         updated_at         = EXCLUDED.updated_at`,
      [
        productId,
        seller,
        title,
        description,
        price,
        imageUrl,
        category,
        isActive,
        0,                  // total_sales
        0,                  // rating_sum
        0,                  // rating_count
        quantityAvailable,  // quantity
        quantityAvailable,  // available_quantity
        resellable,
        fileCid,
        Number(timestamp),
        Number(timestamp),
      ]
    );

    // Ensure seller row exists
    await pool.query(
      `INSERT INTO sellers (address, total_sales, total_revenue, follower_count, is_banned)
       VALUES ($1, 0, 0, 0, FALSE)
       ON CONFLICT (address) DO NOTHING`,
      [seller]
    );

    console.log(`✅ Product stored: ${title}`);
  } catch (error) {
    console.error(`❌ Error handling ProductListed for ${productId}:`, error);
  }
}

async function handleProductPurchased(event: any) {
  const parsedJson  = event.parsedJson as any;
  const productId   = parsedJson.product_id;
  const buyer       = parsedJson.buyer;
  const seller      = parsedJson.seller;
  const price       = parsedJson.price;
  const platformFee = parsedJson.platform_fee;
  const timestamp   = parsedJson.timestamp;
  const quantity    = Number(parsedJson.quantity) || 1;

  const purchaseId = `${event.id.txDigest}-${event.id.eventSeq}`;

  console.log(`💰 ProductPurchased: ${productId} by ${buyer}`);

  // Decrement quantity, mark inactive if sold out
  await pool.query(
    `UPDATE products
     SET available_quantity = GREATEST(available_quantity - $1, 0),
         is_available = CASE
           WHEN (available_quantity - $1) <= 0 THEN FALSE
           ELSE is_available
         END,
         total_sales = total_sales + $1,
         updated_at  = $2
     WHERE id = $3`,
    [quantity, Number(timestamp), productId]
  );

  // Record purchase
  await pool.query(
    `INSERT INTO purchases
       (id, product_id, buyer, seller, price, platform_fee, tx_digest, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO NOTHING`,
    [
      purchaseId,
      productId,
      buyer,
      seller,
      price,
      platformFee,
      event.id.txDigest,
      Number(timestamp),
    ]
  );

  // Update seller stats
  await pool.query(
    `UPDATE sellers
     SET total_sales   = total_sales + 1,
         total_revenue = total_revenue + $1,
         updated_at    = NOW()
     WHERE address = $2`,
    [price, seller]
  );

  console.log(`✅ Purchase recorded: ${purchaseId}`);
}

async function handleProductReviewed(event: any) {
  const parsedJson = event.parsedJson as any;
  const productId  = parsedJson.product_id;
  const reviewer   = parsedJson.reviewer;
  const rating     = parsedJson.rating;
  const comment    = parsedJson.comment || '';
  const timestamp  = parsedJson.timestamp;

  console.log(`⭐ ProductReviewed: ${productId} by ${reviewer}`);

  await pool.query(
    `INSERT INTO reviews (product_id, reviewer, rating, comment, created_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (product_id, reviewer) DO UPDATE SET
       rating  = EXCLUDED.rating,
       comment = EXCLUDED.comment`,
    [productId, reviewer, rating, comment, Number(timestamp)]
  );

  // Recalculate rating stats from reviews table
  await pool.query(
    `UPDATE products
     SET rating_sum   = (SELECT COALESCE(SUM(rating), 0) FROM reviews WHERE product_id = $1),
         rating_count = (SELECT COUNT(*)                 FROM reviews WHERE product_id = $1),
         updated_at   = $2
     WHERE id = $1`,
    [productId, Number(timestamp)]
  );

  console.log(`✅ Review recorded for ${productId}`);
}

async function handleSellerProfileCreated(event: any) {
  const parsedJson = event.parsedJson as any;
  const seller     = parsedJson.seller;

  console.log(`👤 SellerProfileCreated: ${seller}`);

  await pool.query(
    `INSERT INTO sellers (address, total_sales, total_revenue, follower_count, is_banned)
     VALUES ($1, 0, 0, 0, FALSE)
     ON CONFLICT (address) DO NOTHING`,
    [seller]
  );

  console.log(`✅ Seller profile created: ${seller}`);
}

// ── Main polling loop ─────────────────────────────────────────────────────────

async function processEvents() {
  try {
    let cursor: any     = await getSavedCursor();
    let hasNextPage     = true;
    let totalProcessed  = 0;

    while (hasNextPage) {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventModule: {
            package: PACKAGE_ID,
            module: 'marketplace',
          },
        },
        cursor,
        order: 'ascending',
        limit: 50,
      });

      if (!events.data || events.data.length === 0) {
        break;
      }

      console.log(`\n📊 Fetched ${events.data.length} events (cursor: ${cursor ? 'set' : 'start'})`);

      for (const event of events.data) {
        const eventType = event.type.split('::').pop();

        switch (eventType) {
          case 'ProductListed':
            await handleProductListed(event);
            break;

          case 'ProductPurchased':
            await handleProductPurchased(event);
            break;

          case 'ProductReviewed':
            await handleProductReviewed(event);
            break;

          case 'SellerProfileCreated':
            await handleSellerProfileCreated(event);
            break;

          default:
            console.log(`ℹ️  Unknown event type: ${eventType}`);
        }

        totalProcessed++;
      }

      // Save cursor after each page so we don't reprocess on restart
      if (events.nextCursor) {
        cursor = events.nextCursor;
        await saveCursor(cursor);
      }

      hasNextPage = events.hasNextPage;
    }

    if (totalProcessed > 0) {
      console.log(`\n✅ Processed ${totalProcessed} events total`);
    }
  } catch (error: any) {
    if (error.status === 504 || error.status === 503) {
      console.log('⚠️  RPC timeout, will retry on next poll...');
      return;
    }
    console.error('❌ Error processing events:', error);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function startIndexer() {
  console.log('\n🚀 Starting Sui Blockchain Indexer...\n');

  await initializeDatabase();

  // Ensure last_event_cursor column exists
  await pool.query(`
    ALTER TABLE indexer_state
    ADD COLUMN IF NOT EXISTS last_event_cursor TEXT
  `);

  // Ensure indexer_state row exists
  await pool.query(`
    INSERT INTO indexer_state (id, last_processed_checkpoint, updated_at)
    VALUES (1, 0, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('🔄 Running initial event sync...');
  await processEvents();

  console.log(`\n⏱  Polling every ${POLL_INTERVAL / 1000}s for new events...\n`);
  setInterval(async () => {
    console.log('🔄 Polling...');
    await processEvents();
  }, POLL_INTERVAL);
}

startIndexer().catch(console.error);