import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection pool
// Reads DATABASE_URL on Railway, falls back to local Docker credentials
function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    console.log(`DB URL USED: ${databaseUrl}`);
    return new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return new Pool({
    host:     process.env.PGHOST     || '127.0.0.1',
    port:     Number(process.env.PGPORT) || 5432,
    user:     process.env.PGUSER     || 'suishop',
    password: process.env.PGPASSWORD || 'suishop_password_2026',
    database: process.env.PGDATABASE || 'suishop',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}
export const pool = createPool();

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        seller TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price BIGINT NOT NULL,
        image_url TEXT NOT NULL,
        category TEXT NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        total_sales INTEGER DEFAULT 0,
        rating_sum INTEGER DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);

    // Create indexes for products
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
    `);

    // Sellers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        address TEXT PRIMARY KEY,
        total_sales INTEGER DEFAULT 0,
        total_revenue BIGINT DEFAULT 0,
        follower_count INTEGER DEFAULT 0,
        is_banned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Followers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followers (
        follower_address TEXT NOT NULL,
        seller_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (follower_address, seller_address)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_followers_seller ON followers(seller_address);
      CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_address);
    `);

    // Favorites/Wishlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_address TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_address, product_id)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_address);
      CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);
    `);
    
    // Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        product_id TEXT NOT NULL,
        reviewer TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        PRIMARY KEY (product_id, reviewer)
      )
    `);

    // Create index for reviews
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
    `);

    // Purchases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        buyer TEXT NOT NULL,
        seller TEXT NOT NULL,
        price BIGINT NOT NULL,
        platform_fee BIGINT NOT NULL,
        tx_digest TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);

    // Create indexes for purchases
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer);
      CREATE INDEX IF NOT EXISTS idx_purchases_seller ON purchases(seller);
      CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
    `);

    // Indexer state table
    // Uses last_event_cursor (Sui event cursor object) NOT last_processed_checkpoint
    await pool.query(`
      CREATE TABLE IF NOT EXISTS indexer_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        last_event_cursor TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default indexer state row if not exists
    await pool.query(`
      INSERT INTO indexer_state (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}