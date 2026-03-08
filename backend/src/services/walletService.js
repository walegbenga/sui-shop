/**
 * Wallet Service
 * Secure deterministic wallet seed generation
 * 
 * CRITICAL SECURITY COMPONENT
 * This handles the core cryptographic operations for wallet creation
 */

const crypto = require('crypto');
const { mnemonicToSeedSync } = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Sui derivation path
const SUI_DERIVATION_PATH = "m/44'/784'/0'/0'/0'";

// Master salt (MUST be stored in HSM/KMS in production!)
// This is loaded from environment variable
const MASTER_SALT = process.env.MASTER_SALT || crypto.randomBytes(32).toString('hex');

// Warn if using default salt
if (!process.env.MASTER_SALT) {
  logger.warn('⚠️  WARNING: Using generated MASTER_SALT. Set MASTER_SALT in environment for production!');
}

// ==================== Core Wallet Generation ====================

/**
 * Generate deterministic wallet seed from user identifier
 * 
 * @param {string} provider - 'google' | 'apple' | 'email'
 * @param {string} userIdentifier - Unique user ID (email, Google ID, Apple ID)
 * @returns {Promise<{seed: string, address: string, publicKey: string}>}
 */
async function generateWalletSeed(provider, userIdentifier) {
  try {
    // Get user-specific salt
    const userSalt = await getUserSalt(userIdentifier);

    // Combine master salt + user salt + provider
    const combinedSalt = `${MASTER_SALT}:${userSalt}:${provider}`;

    // Derive seed using PBKDF2 (industry standard)
    const seed = crypto.pbkdf2Sync(
      userIdentifier,          // Input (user's identifier)
      combinedSalt,            // Salt (combination of secrets)
      600000,                  // Iterations (high for security)
      32,                      // Key length (256 bits)
      'sha512'                 // Hash algorithm
    );

    // Derive Sui keypair from seed
    const derivedSeed = derivePath(SUI_DERIVATION_PATH, seed.toString('hex')).key;
    const keypair = Ed25519Keypair.fromSeed(derivedSeed);

    // Get address and public key
    const address = keypair.getPublicKey().toSuiAddress();
    const publicKey = keypair.getPublicKey().toBase64();

    // Audit log (without sensitive data)
    logger.info(`Wallet generated for ${provider}:${userIdentifier.substring(0, 10)}...`, {
      provider,
      address,
    });

    return {
      seed: seed.toString('hex'),
      address,
      publicKey,
    };

  } catch (error) {
    logger.error('Wallet seed generation failed:', error);
    throw new Error('Failed to generate wallet seed');
  }
}

/**
 * Get or create user-specific salt
 * In production, this should be stored in a database
 * 
 * @param {string} userIdentifier
 * @returns {Promise<string>}
 */
async function getUserSalt(userIdentifier) {
  try {
    // Create deterministic but unpredictable salt from user identifier
    // In production, store this in database on first use
    
    // For now, we'll use a hash of the identifier + master salt
    // This makes it deterministic (same user = same salt)
    // But unpredictable (can't guess without master salt)
    
    const hash = crypto
      .createHash('sha256')
      .update(`${userIdentifier}:${MASTER_SALT}`)
      .digest('hex');

    return hash;

  } catch (error) {
    logger.error('Get user salt failed:', error);
    throw new Error('Failed to get user salt');
  }
}

/**
 * Verify that an address belongs to a user identifier
 * 
 * @param {string} userIdentifier
 * @param {string} address
 * @returns {Promise<boolean>}
 */
async function verifyAddress(userIdentifier, address) {
  try {
    // Regenerate seed and check if addresses match
    const providers = ['google', 'apple', 'email'];
    
    for (const provider of providers) {
      const result = await generateWalletSeed(provider, userIdentifier);
      if (result.address === address) {
        return true;
      }
    }

    return false;

  } catch (error) {
    logger.error('Address verification failed:', error);
    return false;
  }
}

/**
 * Verify authentication token
 * 
 * @param {string} provider
 * @param {string} authToken
 * @returns {Promise<boolean>}
 */
async function verifyAuthToken(provider, authToken) {
  try {
    // Verify JWT token
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if token is for correct provider
    if (decoded.provider !== provider && provider !== 'generic') {
      return false;
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return false;
    }

    return true;

  } catch (error) {
    logger.error('Auth token verification failed:', error);
    return false;
  }
}

// ==================== Export Functions ====================

module.exports = {
  generateWalletSeed,
  getUserSalt,
  verifyAddress,
  verifyAuthToken,
};
