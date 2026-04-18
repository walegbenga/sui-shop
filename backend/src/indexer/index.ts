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
  try { return JSON.parse(raw); } catch { return null; }
}

async function saveCursor(cursor: any) {
  await pool.query(
    `UPDATE indexer_state SET last_event_cursor = $1, updated_at = NOW() WHERE id = 1`,
    [JSON.stringify(cursor)]
  );
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleProductListed(event: any) {
  const parsedJson = event.parsedJson as any;
  const productId  = parsedJson.product_id;
  const seller     = parsedJson.seller;
  const price      = parsedJson.price;
  const timestamp  = parsedJson.timestamp;

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

    console.log(`   Title: ${title} | Resellable: ${resellable} | File: ${fileCid}`);

    await pool.query(
      `INSERT INTO products (
         id, seller, title, description, price, image_url, category,
         is_available, total_sales, rating_sum, rating_count,
         quantity, available_quantity, resellable, file_cid,
         created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
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
         updated_at         = NOW()`,
      [
        productId, seller, title, description, price, imageUrl, category,
        isActive, 0, 0, 0, quantityAvailable, quantityAvailable,
        resellable, fileCid, Number(timestamp),
      ]
    );

    await pool.query(
      `INSERT INTO sellers (address, display_name, total_sales, total_revenue, follower_count, is_banned, created_at)
       VALUES ($1, '', 0, 0, 0, FALSE, $2) ON CONFLICT (address) DO NOTHING`,
      [seller, Number(timestamp)]
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
  const purchaseId  = `${event.id.txDigest}-${event.id.eventSeq}`;

  console.log(`💰 ProductPurchased: ${productId} by ${buyer}`);

  // Update product quantity
  await pool.query(
    `UPDATE products
     SET available_quantity = GREATEST(available_quantity - $1, 0),
         is_available = CASE WHEN (available_quantity - $1) <= 0 THEN FALSE ELSE is_available END,
         total_sales = total_sales + $1,
         updated_at  = NOW()
     WHERE id = $2`,
    [quantity, productId]
  );

  // Record purchase
  await pool.query(
    `INSERT INTO purchases (product_id, buyer, seller, price, platform_fee, tx_digest, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tx_digest) DO NOTHING`,
    [productId, buyer, seller, price, platformFee, event.id.txDigest, Number(timestamp)]
  );

  // Update seller stats
  await pool.query(
    `UPDATE sellers SET total_sales = total_sales + 1, total_revenue = total_revenue + $1, updated_at = NOW() WHERE address = $2`,
    [price, seller]
  );

  // ── Create ownership token for resellable products ──────────────────────
  const productCheck = await pool.query(
    'SELECT resellable, file_cid FROM products WHERE id = $1',
    [productId]
  );

  if (productCheck.rows.length > 0 && productCheck.rows[0].resellable) {
    console.log(`🎫 Creating ownership token for resellable product: ${productId}`);

    // Query the buyer's owned OwnershipToken objects to get the real on-chain token ID
    let tokenId: string | null = null;

    try {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: buyer,
        filter: {
          StructType: `${PACKAGE_ID}::marketplace::OwnershipToken`,
        },
        options: { showContent: true },
      });

      // Find the token for this specific product
      const matchingToken = ownedObjects.data.find((obj) => {
        const content = obj.data?.content as any;
        return content?.fields?.original_product_id === productId;
      });

      if (matchingToken?.data?.objectId) {
        tokenId = matchingToken.data.objectId;
        console.log(`   Found on-chain token: ${tokenId}`);
      }
    } catch (err) {
      console.warn(`   Could not fetch on-chain token, generating synthetic ID`);
    }

    // Fallback: generate a deterministic token ID if on-chain query fails
    if (!tokenId) {
      tokenId = `${event.id.txDigest}_${productId}_${buyer}`.slice(0, 66);
      console.log(`   Using synthetic token ID: ${tokenId}`);
    }

    await pool.query(
      `INSERT INTO ownership_tokens (
         token_id, original_product_id, current_owner,
         previous_owner, original_seller, purchase_price,
         purchase_timestamp, is_listed_for_resale, resale_price, file_cid
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,false,0,$8)
       ON CONFLICT (token_id) DO NOTHING`,
      [
        tokenId,
        productId,
        buyer,
        seller,    // previous_owner = original seller
        seller,    // original_seller
        price,
        Number(timestamp),
        productCheck.rows[0].file_cid || '',
      ]
    );

    console.log(`✅ Ownership token created: ${tokenId}`);
  }

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
     ON CONFLICT (product_id, reviewer) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
    [productId, reviewer, rating, comment, Number(timestamp)]
  );

  await pool.query(
    `UPDATE products
     SET rating_sum   = (SELECT COALESCE(SUM(rating), 0) FROM reviews WHERE product_id = $1),
         rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1),
         updated_at   = NOW()
     WHERE id = $1`,
    [productId]
  );

  console.log(`✅ Review recorded`);
}

async function handleSellerProfileCreated(event: any) {
  const parsedJson = event.parsedJson as any;
  console.log(`👤 SellerProfileCreated: ${parsedJson.seller}`);

  await pool.query(
    `INSERT INTO sellers (address, display_name, total_sales, total_revenue, follower_count, is_banned, created_at)
     VALUES ($1, '', 0, 0, 0, FALSE, $2) ON CONFLICT (address) DO NOTHING`,
    [parsedJson.seller, Number(parsedJson.timestamp) || Date.now()]
  );

  console.log(`✅ Seller profile created`);
}

async function handleResaleListed(event: any) {
  const fields = event.parsedJson as any;
  console.log(`📋 ResaleListed: ${fields.listing_id}`);

  await pool.query(
    `INSERT INTO resale_listings (listing_id, token_id, seller, price, original_product_id, is_active, created_at)
     VALUES ($1,$2,$3,$4,$5,true,$6)
     ON CONFLICT (listing_id) DO UPDATE SET price = EXCLUDED.price, is_active = true`,
    [fields.listing_id, fields.token_id, fields.seller, fields.price, fields.original_product_id || '', Number(fields.timestamp)]
  );

  await pool.query(
    `UPDATE ownership_tokens SET is_listed_for_resale = true, resale_price = $1 WHERE token_id = $2`,
    [fields.price, fields.token_id]
  );

  console.log(`✅ Resale listing stored`);
}

async function handleResalePurchased(event: any) {
  const fields    = event.parsedJson as any;
  const purchaseId = `${event.id.txDigest}-${event.id.eventSeq}`;
  console.log(`💰 ResalePurchased: token ${fields.token_id}`);

  await pool.query(
    `UPDATE resale_listings SET is_active = false WHERE listing_id = $1`,
    [fields.listing_id]
  );

  await pool.query(
    `UPDATE ownership_tokens
     SET current_owner = $1, previous_owner = $2,
         is_listed_for_resale = false, resale_price = 0,
         purchase_price = $3, purchase_timestamp = $4
     WHERE token_id = $5`,
    [fields.buyer, fields.seller, fields.price, Number(fields.timestamp), fields.token_id]
  );

  // New buyer gets a purchase record so they can download
  await pool.query(
    `INSERT INTO purchases (product_id, buyer, seller, price, platform_fee, tx_digest, created_at)
     VALUES ($1,$2,$3,$4,0,$5,$6) ON CONFLICT (tx_digest) DO NOTHING`,
    [fields.original_product_id, fields.buyer, fields.seller, fields.price, event.id.txDigest, Number(fields.timestamp)]
  );

  console.log(`✅ Resale purchase recorded`);
}

async function handleResaleDelisted(event: any) {
  const fields = event.parsedJson as any;
  console.log(`🗑️ ResaleDelisted: ${fields.listing_id}`);

  await pool.query(
    `UPDATE resale_listings SET is_active = false WHERE listing_id = $1`,
    [fields.listing_id]
  );

  // ✅ Mark token as no longer listed so it can be found again
  await pool.query(
    `UPDATE ownership_tokens 
     SET is_listed_for_resale = false, resale_price = 0 
     WHERE token_id = $1`,
    [fields.token_id]
  );

  console.log(`✅ Resale delisted, token available again`);
}

// ── Main polling loop ─────────────────────────────────────────────────────────

async function processEvents() {
  try {
    let cursor: any    = await getSavedCursor();
    let hasNextPage    = true;
    let totalProcessed = 0;

    while (hasNextPage) {
      const events = await suiClient.queryEvents({
        query: { MoveEventModule: { package: PACKAGE_ID, module: 'marketplace' } },
        cursor,
        order: 'ascending',
        limit: 50,
      });

      if (!events.data || events.data.length === 0) break;

      console.log(`\n📊 Fetched ${events.data.length} events`);

      for (const suiEvent of events.data) {
        const eventType = suiEvent.type.split('::').pop();

        switch (eventType) {
          case 'ProductListed':        await handleProductListed(suiEvent);        break;
          case 'ProductPurchased':     await handleProductPurchased(suiEvent);     break;
          case 'ProductReviewed':      await handleProductReviewed(suiEvent);      break;
          case 'SellerProfileCreated': await handleSellerProfileCreated(suiEvent); break;
          case 'ResaleListed':         await handleResaleListed(suiEvent);         break;
          case 'ResalePurchased':      await handleResalePurchased(suiEvent);      break;
          case 'ResaleDelisted':       await handleResaleDelisted(suiEvent);       break;
          default: console.log(`ℹ️  Unknown event: ${eventType}`);
        }

        totalProcessed++;
      }

      if (events.nextCursor) {
        cursor = events.nextCursor;
        await saveCursor(cursor);
      }

      hasNextPage = events.hasNextPage;
    }

    if (totalProcessed > 0) console.log(`\n✅ Processed ${totalProcessed} events total`);
  } catch (error: any) {
    if (error.status === 504 || error.status === 503) {
      console.log('⚠️  RPC timeout, retrying...');
      return;
    }
    console.error('❌ Error processing events:', error);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function startIndexer() {
  console.log('\n🚀 Starting Sui Blockchain Indexer...\n');

  await initializeDatabase();

  // Ensure last_event_cursor column exists (safe to run on existing DBs)
  await pool.query(`ALTER TABLE indexer_state ADD COLUMN IF NOT EXISTS last_event_cursor TEXT`);

  // Seed the single indexer_state row if it doesn't exist yet
  await pool.query(`
    INSERT INTO indexer_state (id, updated_at)
    VALUES (1, NOW()) ON CONFLICT (id) DO NOTHING
  `);

  // Ensure resale tables exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resale_listings (
      listing_id TEXT PRIMARY KEY,
      token_id TEXT NOT NULL,
      seller TEXT NOT NULL,
      price BIGINT NOT NULL,
      original_product_id TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at BIGINT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ownership_tokens (
      token_id TEXT PRIMARY KEY,
      original_product_id TEXT NOT NULL,
      current_owner TEXT NOT NULL,
      previous_owner TEXT,
      original_seller TEXT NOT NULL,
      purchase_price BIGINT,
      purchase_timestamp BIGINT,
      is_listed_for_resale BOOLEAN DEFAULT false,
      resale_price BIGINT DEFAULT 0,
      file_cid TEXT,
      created_at BIGINT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
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