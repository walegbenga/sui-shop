import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection pool
// Reads DATABASE_URL on Railway, falls back to local Docker credentials
function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("❌ DATABASE_URL is NOT set");
  }

  console.log(`DB URL USED: ${databaseUrl}`);

  return new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}
export const pool = createPool();

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schemas...');
    console.log("ENV CHECK:", {
  DATABASE_URL: !!process.env.DATABASE_URL,
});

    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id                 VARCHAR(66) PRIMARY KEY,
        seller             VARCHAR(66) NOT NULL,
        title              VARCHAR(100) NOT NULL,
        description        TEXT NOT NULL,
        price              BIGINT NOT NULL,
        image_url          TEXT NOT NULL DEFAULT '',
        category           VARCHAR(50) NOT NULL DEFAULT 'Other',
        is_available       BOOLEAN DEFAULT TRUE,
        total_sales        INTEGER DEFAULT 0,
        total_revenue      BIGINT DEFAULT 0,
        rating_sum         INTEGER DEFAULT 0,
        rating_count       INTEGER DEFAULT 0,
        quantity           INTEGER DEFAULT 1,
        available_quantity INTEGER DEFAULT 1,
        resellable         BOOLEAN DEFAULT FALSE,
        file_cid           TEXT DEFAULT '',
        file_name          TEXT DEFAULT '',
        file_size          BIGINT DEFAULT 0,
        created_at         BIGINT NOT NULL DEFAULT 0,
        updated_at         BIGINT NOT NULL DEFAULT 0,
        CONSTRAINT valid_price        CHECK (price >= 0),
        CONSTRAINT valid_rating_sum   CHECK (rating_sum >= 0),
        CONSTRAINT valid_rating_count CHECK (rating_count >= 0)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        address            VARCHAR(66) PRIMARY KEY,
        display_name       VARCHAR(50) DEFAULT '',
        bio                TEXT DEFAULT '',
        total_sales        INTEGER DEFAULT 0,
        total_revenue      BIGINT DEFAULT 0,
        products_listed    INTEGER DEFAULT 0,
        follower_count     INTEGER DEFAULT 0,
        is_banned          BOOLEAN DEFAULT FALSE,
        verification_level INTEGER DEFAULT 0,
        created_at         BIGINT NOT NULL DEFAULT 0,
        updated_at         BIGINT NOT NULL DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id VARCHAR(66) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        reviewer   VARCHAR(66) NOT NULL,
        rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment    TEXT NOT NULL,
        created_at BIGINT NOT NULL DEFAULT 0,
        UNIQUE(product_id, reviewer)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id   VARCHAR(66),
        buyer        VARCHAR(66) NOT NULL,
        seller       VARCHAR(66) NOT NULL,
        price        BIGINT NOT NULL,
        platform_fee BIGINT NOT NULL DEFAULT 0,
        tx_digest    VARCHAR(100) NOT NULL UNIQUE,
        created_at   BIGINT NOT NULL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS followers (
        follower_address VARCHAR(66) NOT NULL,
        seller_address   VARCHAR(66) NOT NULL,
        created_at       BIGINT NOT NULL DEFAULT 0,
        PRIMARY KEY (follower_address, seller_address)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_address VARCHAR(66) NOT NULL,
        product_id   VARCHAR(66) NOT NULL,
        created_at   BIGINT NOT NULL DEFAULT 0,
        PRIMARY KEY (user_address, product_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ownership_tokens (
        token_id             VARCHAR(66) PRIMARY KEY,
        original_product_id  VARCHAR(66) NOT NULL,
        current_owner        VARCHAR(66) NOT NULL,
        previous_owner       VARCHAR(66) DEFAULT '',
        original_seller      VARCHAR(66) NOT NULL,
        purchase_price       BIGINT NOT NULL DEFAULT 0,
        purchase_timestamp   BIGINT NOT NULL DEFAULT 0,
        is_listed_for_resale BOOLEAN DEFAULT FALSE,
        resale_price         BIGINT DEFAULT 0,
        file_cid             TEXT DEFAULT '',
        created_at           BIGINT NOT NULL DEFAULT 0,
        updated_at           BIGINT NOT NULL DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resale_listings (
        listing_id          VARCHAR(66) PRIMARY KEY,
        token_id            VARCHAR(66) NOT NULL,
        seller              VARCHAR(66) NOT NULL,
        price               BIGINT NOT NULL,
        original_product_id VARCHAR(66) NOT NULL,
        is_active           BOOLEAN DEFAULT TRUE,
        created_at          BIGINT NOT NULL DEFAULT 0,
        updated_at          BIGINT NOT NULL DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS indexer_state (
        id                INTEGER PRIMARY KEY DEFAULT 1,
        last_event_cursor TEXT,
        updated_at        BIGINT NOT NULL DEFAULT 0,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    await pool.query(`
      INSERT INTO indexer_state (id, updated_at) VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verified_buyers (
        address     VARCHAR(66) PRIMARY KEY,
        verified_at BIGINT NOT NULL DEFAULT 0,
        verified_by TEXT NOT NULL DEFAULT '',
        is_active   BOOLEAN DEFAULT TRUE,
        created_at  BIGINT NOT NULL DEFAULT 0
      )
    `);

    // Indexes — wrapped in try/catch since they may already exist with different definitions
    try { await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_seller               ON products(seller);
      CREATE INDEX IF NOT EXISTS idx_products_category             ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_available            ON products(is_available);
      CREATE INDEX IF NOT EXISTS idx_products_created_at           ON products(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_products_price                ON products(price);
      CREATE INDEX IF NOT EXISTS idx_sellers_created_at            ON sellers(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sellers_total_sales           ON sellers(total_sales DESC);
      CREATE INDEX IF NOT EXISTS idx_reviews_product               ON reviews(product_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewer              ON reviews(reviewer);
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at            ON reviews(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_purchases_buyer               ON purchases(buyer);
      CREATE INDEX IF NOT EXISTS idx_purchases_seller              ON purchases(seller);
      CREATE INDEX IF NOT EXISTS idx_purchases_product             ON purchases(product_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_created_at          ON purchases(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_followers_seller              ON followers(seller_address);
      CREATE INDEX IF NOT EXISTS idx_followers_follower            ON followers(follower_address);
      CREATE INDEX IF NOT EXISTS idx_favorites_user                ON favorites(user_address);
      CREATE INDEX IF NOT EXISTS idx_favorites_product             ON favorites(product_id);
      CREATE INDEX IF NOT EXISTS idx_ownership_tokens_owner        ON ownership_tokens(current_owner);
      CREATE INDEX IF NOT EXISTS idx_ownership_tokens_product      ON ownership_tokens(original_product_id);
      CREATE INDEX IF NOT EXISTS idx_resale_listings_seller        ON resale_listings(seller);
      CREATE INDEX IF NOT EXISTS idx_resale_listings_active        ON resale_listings(is_active);
      CREATE INDEX IF NOT EXISTS idx_resale_listings_product       ON resale_listings(original_product_id);
    `); } catch(idxErr: any) { console.warn('Index warning (safe):', idxErr.message); }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}


export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}