-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
    id VARCHAR(66) PRIMARY KEY,  -- Sui object ID
    seller VARCHAR(66) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price BIGINT NOT NULL,  -- Price in MIST
    image_url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at BIGINT NOT NULL,  -- Timestamp from blockchain
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_sales INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Indexes for performance
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_rating_sum CHECK (rating_sum >= 0),
    CONSTRAINT valid_rating_count CHECK (rating_count >= 0)
);

-- Sellers table
CREATE TABLE sellers (
    address VARCHAR(66) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT,
    total_sales INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    products_listed INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    verification_level INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(66) NOT NULL,
    reviewer VARCHAR(66) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, reviewer)  -- One review per user per product
);

-- Purchases table (for analytics)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(66) NOT NULL,
    buyer VARCHAR(66) NOT NULL,
    seller VARCHAR(66) NOT NULL,
    price BIGINT NOT NULL,
    platform_fee BIGINT NOT NULL,
    tx_digest VARCHAR(100) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Indexer state (track sync progress)
CREATE TABLE indexer_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_synced_checkpoint BIGINT DEFAULT 0,
    last_synced_tx VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial indexer state
INSERT INTO indexer_state (id, last_synced_checkpoint) VALUES (1, 0);

-- Ownership Tokens Table
CREATE TABLE IF NOT EXISTS ownership_tokens (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(66) UNIQUE NOT NULL,
  original_product_id VARCHAR(66) NOT NULL,
  current_owner VARCHAR(66) NOT NULL,
  previous_owner VARCHAR(66),
  original_seller VARCHAR(66) NOT NULL,
  purchase_price BIGINT NOT NULL,
  purchase_timestamp BIGINT NOT NULL,
  is_listed_for_resale BOOLEAN DEFAULT false,
  resale_price BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resale Listings Table
CREATE TABLE IF NOT EXISTS resale_listings (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(66) UNIQUE NOT NULL,
  token_id VARCHAR(66) NOT NULL,
  seller VARCHAR(66) NOT NULL,
  price BIGINT NOT NULL,
  original_product_id VARCHAR(66) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (token_id) REFERENCES ownership_tokens(token_id)
);

-- ==================== Indexes for Performance ====================

-- Products indexes
CREATE INDEX idx_products_seller ON products(seller);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);

-- Full-text search on products
CREATE INDEX idx_products_title_search ON products USING gin(to_tsvector('english', title));
CREATE INDEX idx_products_description_search ON products USING gin(to_tsvector('english', description));

-- Reviews indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Purchases indexes
CREATE INDEX idx_purchases_buyer ON purchases(buyer);
CREATE INDEX idx_purchases_seller ON purchases(seller);
CREATE INDEX idx_purchases_product ON purchases(product_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);

-- Sellers indexes
CREATE INDEX idx_sellers_created_at ON sellers(created_at DESC);
CREATE INDEX idx_sellers_total_sales ON sellers(total_sales DESC);

-- resale indexes
CREATE INDEX idx_ownership_tokens_owner ON ownership_tokens(current_owner);
CREATE INDEX idx_ownership_tokens_product ON ownership_tokens(original_product_id);
CREATE INDEX idx_resale_listings_seller ON resale_listings(seller);
CREATE INDEX idx_resale_listings_active ON resale_listings(is_active);

-- ==================== Views for Analytics ====================

-- Top products view
CREATE VIEW top_products AS
SELECT 
    p.*,
    CASE 
        WHEN p.rating_count > 0 THEN p.rating_sum::FLOAT / p.rating_count 
        ELSE 0 
    END as avg_rating
FROM products p
WHERE p.is_available = true
ORDER BY p.total_sales DESC;

-- Top sellers view
CREATE VIEW top_sellers AS
SELECT 
    s.*,
    COUNT(DISTINCT p.id) as active_products
FROM sellers s
LEFT JOIN products p ON s.address = p.seller AND p.is_available = true
GROUP BY s.address
ORDER BY s.total_sales DESC;