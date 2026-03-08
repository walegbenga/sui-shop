/**
 * Error Handler Middleware
 * Centralized error handling
 */

const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.statusCode || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(isDevelopment && { stack: err.stack }),
      requestId: req.id,
    },
  });
};
