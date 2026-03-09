/**
 * Express REST API Server
 * Serves blockchain data from PostgreSQL
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from '../config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== Product Endpoints ====================

// Get all products (with pagination)
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, available = 'true' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    // Filter by availability
    if (available === 'true') {
      query += ` AND is_available = $${paramCount}`;
      params.push(true);
      paramCount++;
    }

    // Filter by category
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (available === 'true') {
      countQuery += ` AND is_available = $${countParamCount}`;
      countParams.push(true);
      countParamCount++;
    }

    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      products: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Search products
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `SELECT * FROM products 
       WHERE to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $1)
       AND is_available = true
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [query, Number(limit), offset]
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get products by seller
app.get('/api/sellers/:address/products', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `SELECT * FROM products 
       WHERE seller = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [address, Number(limit), offset]
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ error: 'Failed to fetch seller products' });
  }
});

// ==================== Seller Endpoints ====================

// Get seller profile
app.get('/api/sellers/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const result = await pool.query('SELECT * FROM sellers WHERE address = $1', [address]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

// Get top sellers
app.get('/api/sellers/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT * FROM sellers 
       WHERE is_banned = false
       ORDER BY total_sales DESC, total_revenue DESC
       LIMIT $1`,
      [Number(limit)]
    );

    res.json({ sellers: result.rows });
  } catch (error) {
    console.error('Error fetching top sellers:', error);
    res.status(500).json({ error: 'Failed to fetch top sellers' });
  }
});

// ==================== Review Endpoints ====================

// Get reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `SELECT * FROM reviews 
       WHERE product_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, Number(limit), offset]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ==================== Analytics Endpoints ====================

// Get marketplace stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE is_available = true) as available_products,
        (SELECT COUNT(*) FROM sellers) as total_sellers,
        (SELECT COUNT(*) FROM purchases) as total_purchases,
        (SELECT COALESCE(SUM(price), 0) FROM purchases) as total_volume,
        (SELECT COUNT(*) FROM reviews) as total_reviews
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get trending products (most sales in last 7 days)
app.get('/api/products/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT p.*, COUNT(pu.id) as recent_sales
       FROM products p
       LEFT JOIN purchases pu ON p.id = pu.product_id 
         AND pu.created_at > EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000
       WHERE p.is_available = true
       GROUP BY p.id
       ORDER BY recent_sales DESC, p.total_sales DESC
       LIMIT $1`,
      [Number(limit)]
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
});

// ==================== Categories ====================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM products 
       WHERE is_available = true
       GROUP BY category 
       ORDER BY count DESC`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛍️  Products API: http://localhost:${PORT}/api/products`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down API server...');
  await pool.end();
  process.exit(0);
});