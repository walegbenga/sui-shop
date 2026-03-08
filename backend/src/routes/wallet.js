/**
 * Wallet Routes
 * Handles secure wallet seed generation
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const walletService = require('../services/walletService');
const logger = require('../utils/logger');

// ==================== Generate Wallet Seed ====================

/**
 * POST /api/wallet/generate-seed
 * 
 * Generates a deterministic wallet seed from user identifier
 * CRITICAL: This must be called only after user authentication
 */
router.post(
  '/generate-seed',
  [
    body('provider').isIn(['google', 'apple', 'email']).withMessage('Invalid provider'),
    body('userIdentifier').notEmpty().withMessage('User identifier is required'),
    body('authToken').notEmpty().withMessage('Authentication token is required'),
  ],
  async (req, res, next) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { provider, userIdentifier, authToken } = req.body;

      // Verify authentication token
      const isValid = await walletService.verifyAuthToken(provider, authToken);
      if (!isValid) {
        logger.warn(`Invalid auth token for ${provider}:${userIdentifier}`);
        return res.status(401).json({ 
          error: 'Authentication failed',
          message: 'Invalid or expired authentication token' 
        });
      }

      // Generate deterministic seed
      const result = await walletService.generateWalletSeed(provider, userIdentifier);

      // Audit log
      logger.info(`Wallet seed generated for ${provider}:${userIdentifier}`, {
        requestId: req.id,
        provider,
        address: result.address,
      });

      res.json({
        success: true,
        address: result.address,
        seed: result.seed,
        publicKey: result.publicKey,
      });

    } catch (error) {
      logger.error('Wallet seed generation failed:', error);
      next(error);
    }
  }
);

// ==================== Get User Salt ====================

/**
 * POST /api/wallet/get-salt
 * 
 * Returns user's salt for client-side zkLogin
 * Only returns if user is authenticated
 */
router.post(
  '/get-salt',
  [
    body('userIdentifier').notEmpty().withMessage('User identifier is required'),
    body('authToken').notEmpty().withMessage('Authentication token is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { userIdentifier, authToken } = req.body;

      // Verify auth token
      const isValid = await walletService.verifyAuthToken('generic', authToken);
      if (!isValid) {
        return res.status(401).json({ 
          error: 'Authentication failed' 
        });
      }

      // Get salt
      const salt = await walletService.getUserSalt(userIdentifier);

      res.json({
        success: true,
        salt,
      });

    } catch (error) {
      logger.error('Get salt failed:', error);
      next(error);
    }
  }
);

// ==================== Verify Address ====================

/**
 * POST /api/wallet/verify-address
 * 
 * Verifies that an address belongs to a user identifier
 */
router.post(
  '/verify-address',
  [
    body('userIdentifier').notEmpty(),
    body('address').matches(/^0x[a-fA-F0-9]{64}$/),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { userIdentifier, address } = req.body;

      const isValid = await walletService.verifyAddress(userIdentifier, address);

      res.json({
        success: true,
        valid: isValid,
      });

    } catch (error) {
      logger.error('Address verification failed:', error);
      next(error);
    }
  }
);

module.exports = router;
