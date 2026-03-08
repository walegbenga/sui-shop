/**
 * Authentication Routes
 * Handles magic link emails and OAuth token verification
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const logger = require('../utils/logger');

// ==================== Send Magic Link ====================

/**
 * POST /api/auth/send-magic-link
 * 
 * Sends a magic link to user's email for passwordless authentication
 */
router.post(
  '/send-magic-link',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
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

      const { email } = req.body;

      // Generate magic link token
      const result = await authService.sendMagicLink(email);

      if (result.success) {
        logger.info(`Magic link sent to ${email}`, { requestId: req.id });
        
        res.json({
          success: true,
          message: 'Magic link sent to your email',
          expiresIn: '15 minutes',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send magic link',
        });
      }

    } catch (error) {
      logger.error('Magic link send failed:', error);
      next(error);
    }
  }
);

// ==================== Verify Magic Link ====================

/**
 * POST /api/auth/verify-magic-link
 * 
 * Verifies magic link token and returns authentication token
 */
router.post(
  '/verify-magic-link',
  [
    body('token').notEmpty().withMessage('Token is required'),
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

      const { token } = req.body;

      // Verify token
      const result = await authService.verifyMagicLink(token);

      if (result.valid) {
        logger.info(`Magic link verified for ${result.email}`, { requestId: req.id });
        
        res.json({
          success: true,
          valid: true,
          email: result.email,
          authToken: result.authToken,
          expiresIn: '24 hours',
        });
      } else {
        res.status(401).json({
          success: false,
          valid: false,
          message: 'Invalid or expired magic link',
        });
      }

    } catch (error) {
      logger.error('Magic link verification failed:', error);
      next(error);
    }
  }
);

// ==================== Verify Google OAuth ====================

/**
 * POST /api/auth/verify-google
 * 
 * Verifies Google OAuth token and returns user info
 */
router.post(
  '/verify-google',
  [
    body('idToken').notEmpty().withMessage('Google ID token is required'),
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

      const { idToken } = req.body;

      // Verify Google token
      const result = await authService.verifyGoogleToken(idToken);

      if (result.valid) {
        logger.info(`Google OAuth verified for ${result.email}`, { requestId: req.id });
        
        res.json({
          success: true,
          valid: true,
          email: result.email,
          googleId: result.googleId,
          name: result.name,
          authToken: result.authToken,
        });
      } else {
        res.status(401).json({
          success: false,
          valid: false,
          message: 'Invalid Google token',
        });
      }

    } catch (error) {
      logger.error('Google verification failed:', error);
      next(error);
    }
  }
);

// ==================== Verify Apple OAuth ====================

/**
 * POST /api/auth/verify-apple
 * 
 * Verifies Apple Sign-In token and returns user info
 */
router.post(
  '/verify-apple',
  [
    body('identityToken').notEmpty().withMessage('Apple identity token is required'),
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

      const { identityToken, user } = req.body;

      // Verify Apple token
      const result = await authService.verifyAppleToken(identityToken, user);

      if (result.valid) {
        logger.info(`Apple OAuth verified for ${result.appleId}`, { requestId: req.id });
        
        res.json({
          success: true,
          valid: true,
          appleId: result.appleId,
          email: result.email,
          name: result.name,
          authToken: result.authToken,
        });
      } else {
        res.status(401).json({
          success: false,
          valid: false,
          message: 'Invalid Apple token',
        });
      }

    } catch (error) {
      logger.error('Apple verification failed:', error);
      next(error);
    }
  }
);

// ==================== Refresh Auth Token ====================

/**
 * POST /api/auth/refresh
 * 
 * Refreshes an expired authentication token
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
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

      const { refreshToken } = req.body;

      const result = await authService.refreshAuthToken(refreshToken);

      if (result.valid) {
        res.json({
          success: true,
          authToken: result.authToken,
          expiresIn: '24 hours',
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

    } catch (error) {
      logger.error('Token refresh failed:', error);
      next(error);
    }
  }
);

module.exports = router;
