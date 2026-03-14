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

// Get all products with filters
app.get('/api/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      available, 
      minPrice, 
      maxPrice, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Category filter
    if (category) {
      whereConditions.push(`category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    // Available filter
    if (available !== undefined) {
      whereConditions.push(`is_available = $${paramIndex}`);
      queryParams.push(available === 'true');
      paramIndex++;
    }

    // Price range filter (expects values in MIST)
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      const minPriceNum = Number(minPrice);
      if (!isNaN(minPriceNum)) {
        whereConditions.push(`price >= $${paramIndex}`);
        queryParams.push(minPriceNum);
        paramIndex++;
      }
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      const maxPriceNum = Number(maxPrice);
      if (!isNaN(maxPriceNum)) {
        whereConditions.push(`price <= $${paramIndex}`);
        queryParams.push(maxPriceNum);
        paramIndex++;
      }
    }

    // Search filter
    if (search) {
      whereConditions.push(`(
        title ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex} OR 
        category ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'price', 'total_sales', 'title'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].total);

    // Get products
    const result = await pool.query(
      `SELECT * FROM products 
       ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, Number(limit), offset]
    );

    res.json({
      products: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
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


// ==================== Purchase Endpoints ====================

// Get purchases by buyer
app.get('/api/purchases/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const result = await pool.query(
      `SELECT * FROM purchases 
       WHERE buyer = $1 
       ORDER BY created_at DESC`,
      [address]
    );

    res.json({ purchases: result.rows });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// ==================== Social Features Endpoints ====================

// Follow a seller
app.post('/api/sellers/:address/follow', async (req, res) => {
  try {
    const { address } = req.params;
    const { followerAddress } = req.body;

    if (!followerAddress) {
      return res.status(400).json({ error: 'Follower address required' });
    }

    // Insert follower relationship
    await pool.query(
      `INSERT INTO followers (follower_address, seller_address, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (follower_address, seller_address) DO NOTHING`,
      [followerAddress, address]
    );

    // Update seller follower count
    await pool.query(
      `UPDATE sellers 
       SET follower_count = (SELECT COUNT(*) FROM followers WHERE seller_address = $1)
       WHERE address = $1`,
      [address]
    );

    res.json({ success: true, message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following seller:', error);
    res.status(500).json({ error: 'Failed to follow seller' });
  }
});

// Unfollow a seller
app.delete('/api/sellers/:address/follow', async (req, res) => {
  try {
    const { address } = req.params;
    const { followerAddress } = req.body;

    if (!followerAddress) {
      return res.status(400).json({ error: 'Follower address required' });
    }

    // Remove follower relationship
    await pool.query(
      `DELETE FROM followers 
       WHERE follower_address = $1 AND seller_address = $2`,
      [followerAddress, address]
    );

    // Update seller follower count
    await pool.query(
      `UPDATE sellers 
       SET follower_count = (SELECT COUNT(*) FROM followers WHERE seller_address = $1)
       WHERE address = $1`,
      [address]
    );

    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing seller:', error);
    res.status(500).json({ error: 'Failed to unfollow seller' });
  }
});

// Check if user is following a seller
app.get('/api/sellers/:address/following/:userAddress', async (req, res) => {
  try {
    const { address, userAddress } = req.params;

    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM followers 
        WHERE follower_address = $1 AND seller_address = $2
      ) as is_following`,
      [userAddress, address]
    );

    res.json({ isFollowing: result.rows[0].is_following });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get user's followed sellers
app.get('/api/users/:address/following', async (req, res) => {
  try {
    const { address } = req.params;

    const result = await pool.query(
      `SELECT s.*, f.created_at as followed_at
       FROM sellers s
       JOIN followers f ON s.address = f.seller_address
       WHERE f.follower_address = $1
       ORDER BY f.created_at DESC`,
      [address]
    );

    res.json({ following: result.rows });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// ==================== Favorites/Wishlist Endpoints ====================

// Add product to favorites
app.post('/api/favorites', async (req, res) => {
  try {
    const { userAddress, productId } = req.body;

    if (!userAddress || !productId) {
      return res.status(400).json({ error: 'User address and product ID required' });
    }

    await pool.query(
      `INSERT INTO favorites (user_address, product_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_address, product_id) DO NOTHING`,
      [userAddress, productId]
    );

    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove product from favorites
app.delete('/api/favorites', async (req, res) => {
  try {
    const { userAddress, productId } = req.body;

    if (!userAddress || !productId) {
      return res.status(400).json({ error: 'User address and product ID required' });
    }

    await pool.query(
      `DELETE FROM favorites 
       WHERE user_address = $1 AND product_id = $2`,
      [userAddress, productId]
    );

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Get user's favorite products
app.get('/api/users/:address/favorites', async (req, res) => {
  try {
    const { address } = req.params;

    const result = await pool.query(
      `SELECT p.*, f.created_at as favorited_at
       FROM products p
       JOIN favorites f ON p.id = f.product_id
       WHERE f.user_address = $1
       ORDER BY f.created_at DESC`,
      [address]
    );

    res.json({ favorites: result.rows });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Check if product is favorited
app.get('/api/favorites/check/:userAddress/:productId', async (req, res) => {
  try {
    const { userAddress, productId } = req.params;

    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM favorites 
        WHERE user_address = $1 AND product_id = $2
      ) as is_favorited`,
      [userAddress, productId]
    );

    res.json({ isFavorited: result.rows[0].is_favorited });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
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