/**
 * Sui Shop Backend API
 * Main server file
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const healthRoutes = require('./routes/health');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ==================== Security Middleware ====================

// Helmet for security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Strict rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

const walletLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 wallet creations per hour per IP
  message: 'Too many wallet creation attempts, please try again later.',
});

// ==================== Middleware ====================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Request ID for tracking
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(7);
  next();
});

// ==================== Routes ====================

// Health check
app.use('/health', healthRoutes);

// Authentication routes (magic link, OAuth verification)
app.use('/api/auth', authLimiter, authRoutes);

// Wallet routes (seed generation)
app.use('/api/wallet', walletLimiter, walletRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sui Shop Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      wallet: '/api/wallet',
    },
  });
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path,
  });
});

// Global error handler
app.use(errorHandler);

// ==================== Start Server ====================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Sui Shop Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 CORS enabled for: ${corsOptions.origin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
