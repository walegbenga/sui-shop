/**
 * Express REST API Server
 * Serves blockchain data from PostgreSQL
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PinataSDK } from 'pinata-web3';
import multer from 'multer';
import { Request, Response } from 'express';

import { pool } from '../config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY!,
  pinataGateway: 'gateway.pinata.cloud'
});

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
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, image_url, category, seller, quantity, resellable } = req.body;

    // Verify ownership
    const product = await pool.query('SELECT seller FROM products WHERE id = $1', [id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.rows[0].seller !== seller) {
      return res.status(403).json({ error: 'Not authorized to edit this product' });
    }

    // Update product
    await pool.query(
      `UPDATE products 
       SET title = $1, description = $2, price = $3, image_url = $4, category = $5, 
           quantity = $6, resellable = $7, available_quantity = $6
       WHERE id = $8`,
      [title, description, price, image_url, category, quantity, resellable, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, seller, title, description, price, image_url, category,
        is_available, total_sales, rating_sum, rating_count,
        quantity, available_quantity, resellable, file_cid, created_at
       FROM products 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get single product by ID
/*app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});*/

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

// ==================== Review Endpoints ====================

// Submit a review
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, buyerAddress, rating, comment } = req.body;

    console.log('Review submission:', { productId, buyerAddress, rating, comment });

    if (!productId || !buyerAddress || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user has purchased this product
    const purchaseCheck = await pool.query(
      'SELECT * FROM purchases WHERE product_id = $1 AND buyer = $2',
      [productId, buyerAddress]
    );

    if (purchaseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You must purchase this product before reviewing' });
    }

    // Check if user already reviewed
    const reviewCheck = await pool.query(
      'SELECT * FROM reviews WHERE product_id = $1 AND reviewer = $2',
      [productId, buyerAddress]
    );

    if (reviewCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Insert review
    await pool.query(
      `INSERT INTO reviews (product_id, reviewer, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, EXTRACT(EPOCH FROM NOW())::BIGINT)`,
      [productId, buyerAddress, rating, comment || '']
    );

    // Update product rating
    await pool.query(
      `UPDATE products 
       SET rating_sum = rating_sum + $1,
           rating_count = rating_count + 1
       WHERE id = $2`,
      [rating, productId]
    );

    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get reviews for a product
/*app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM reviews 
       WHERE product_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});*/

// ==================== Product Management Endpoints ====================

// Update product (off-chain only - for price, description, image updates)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, image_url, category, seller } = req.body;

    // Verify seller owns the product
    const productCheck = await pool.query(
      'SELECT seller FROM products WHERE id = $1',
      [id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (productCheck.rows[0].seller !== seller) {
      return res.status(403).json({ error: 'Not authorized to edit this product' });
    }

    // Update product
    await pool.query(
      `UPDATE products 
       SET title = $1, description = $2, price = $3, image_url = $4, category = $5, updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT
       WHERE id = $6`,
      [title, description, price, image_url, category, id]
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (soft delete - mark as unavailable)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { seller } = req.body;

    // Verify seller owns the product
    const productCheck = await pool.query(
      'SELECT seller FROM products WHERE id = $1',
      [id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (productCheck.rows[0].seller !== seller) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    // Soft delete - mark as unavailable
    await pool.query(
      `UPDATE products 
       SET is_available = false, updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get seller analytics
app.get('/api/sellers/:address/analytics', async (req, res) => {
  try {
    const { address } = req.params;

    // Get product stats
    const productStats = await pool.query(
      `SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_available = true) as available_products,
        COUNT(*) FILTER (WHERE is_available = false) as sold_products,
        AVG(price) as avg_price,
        SUM(total_sales) as total_sales_count
       FROM products 
       WHERE seller = $1`,
      [address]
    );

    // Get revenue by time period
    const revenueByMonth = await pool.query(
      `SELECT 
        TO_CHAR(TO_TIMESTAMP(created_at), 'YYYY-MM') as month,
        COUNT(*) as sales,
        SUM(price) as revenue
       FROM purchases 
       WHERE seller = $1
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      [address]
    );

    // Get top products
    const topProducts = await pool.query(
      `SELECT id, title, total_sales, price, rating_sum, rating_count
       FROM products 
       WHERE seller = $1
       ORDER BY total_sales DESC
       LIMIT 5`,
      [address]
    );

    // Get recent sales
    const recentSales = await pool.query(
      `SELECT p.id, p.title, p.price, pur.created_at, pur.buyer
       FROM purchases pur
       JOIN products p ON pur.product_id = p.id
       WHERE pur.seller = $1
       ORDER BY pur.created_at DESC
       LIMIT 10`,
      [address]
    );

    res.json({
      stats: productStats.rows[0],
      revenueByMonth: revenueByMonth.rows,
      topProducts: topProducts.rows,
      recentSales: recentSales.rows,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get followers of a seller (who follows this seller)
app.get('/api/sellers/:address/followers', async (req, res) => {
  try {
    const { address } = req.params;

    const result = await pool.query(
      `SELECT follower_address, created_at
       FROM followers
       WHERE seller_address = $1
       ORDER BY created_at DESC`,
      [address]
    );

    res.json({ followers: result.rows });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});


// Download file (only for buyers)
// ✅ CONSISTENT NAMING: Use buyerAddress everywhere
app.get('/api/download/:productId/:buyerAddress', async (req, res) => {
  try {
    const { productId, buyerAddress } = req.params;

    console.log('Download request:', { productId, buyerAddress }); // DEBUG

    // Verify user purchased this product
    const purchase = await pool.query(
      'SELECT * FROM purchases WHERE product_id = $1 AND buyer = $2',
      [productId, buyerAddress]
    );

    if (purchase.rows.length === 0) {
      return res.status(403).json({ error: 'You must purchase this product to download' });
    }

    // Get product file info
    const product = await pool.query(
      'SELECT file_cid, file_name FROM products WHERE id = $1',
      [productId]
    );

    if (product.rows.length === 0 || !product.rows[0].file_cid) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { file_cid, file_name } = product.rows[0];

    // Return IPFS URL
    res.json({
      url: `https://gateway.pinata.cloud/ipfs/${file_cid}`,
      fileName: file_name
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to get download link' });
  }
});

// Upload file to IPFS
app.post('/api/upload', upload.single('file'), async (req: Request, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { seller } = req.body;
    if (!seller) {
      return res.status(400).json({ error: 'Seller address required' });
    }

    console.log(`📤 Uploading file: ${req.file.originalname}`);
    console.log(`   Type: ${req.file.mimetype}`);
    console.log(`   Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);

    // Fix TypeScript Buffer type error by explicitly converting to Uint8Array
    const uint8Array = new Uint8Array(req.file.buffer.buffer, req.file.buffer.byteOffset, req.file.buffer.byteLength);

    const blob = new Blob([uint8Array.buffer as ArrayBuffer], {
  type: req.file.mimetype || 'application/octet-stream',
});

    const file = new File([blob], req.file.originalname, {
      type: req.file.mimetype || 'application/octet-stream',
      lastModified: Date.now(),
    });

    console.log(`📦 File object created, size: ${file.size} bytes`);

    // Upload to Pinata
    const result = await pinata.upload.file(file);

    console.log(`✅ File uploaded to IPFS: ${result.IpfsHash}`);

    res.json({
      cid: result.IpfsHash,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    console.error('Stack:', error.stack);

    // Surface Pinata-specific errors clearly
    if (error.response) {
      console.error('Pinata response error:', {
        status: error.response.status,
        data: error.response.data,
      });
      return res.status(500).json({
        error: 'Pinata upload failed',
        details: error.response.data,
        status: error.response.status,
      });
    }

    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message,
      type: error.constructor.name,
    });
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