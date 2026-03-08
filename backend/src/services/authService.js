/**
 * Authentication Service
 * Handles OAuth verification and magic link generation
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const logger = require('../utils/logger');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const MAGIC_LINK_EXPIRES_IN = 15 * 60 * 1000; // 15 minutes

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter (using SendGrid or SMTP)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
  },
});

// In-memory store for magic link tokens (use Redis in production)
const magicLinkTokens = new Map();

// ==================== Magic Link Authentication ====================

/**
 * Send magic link to user's email
 */
async function sendMagicLink(email) {
  try {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + MAGIC_LINK_EXPIRES_IN;

    // Store token (use Redis in production for scalability)
    magicLinkTokens.set(token, {
      email,
      expiresAt,
    });

    // Clean up expired tokens
    cleanupExpiredTokens();

    // Generate magic link
    const magicLink = `${process.env.FRONTEND_URL || 'suishop://verify-email'}?token=${token}`;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@suishop.com',
      to: email,
      subject: 'Sign in to Sui Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">Welcome to Sui Shop! 🛍️</h1>
          <p>Click the button below to sign in and create your wallet:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: linear-gradient(to right, #8b5cf6, #d946ef); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: bold;">
              Sign In to Sui Shop
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px;">
            Powered by CoA Tech<br>
            This is an automated email, please do not reply.
          </p>
        </div>
      `,
      text: `
        Welcome to Sui Shop!
        
        Click this link to sign in: ${magicLink}
        
        This link expires in 15 minutes.
        
        Powered by CoA Tech
      `,
    };

    await emailTransporter.sendMail(mailOptions);

    logger.info(`Magic link sent to ${email}`);

    return {
      success: true,
      message: 'Magic link sent',
    };

  } catch (error) {
    logger.error('Failed to send magic link:', error);
    return {
      success: false,
      message: 'Failed to send email',
    };
  }
}

/**
 * Verify magic link token
 */
async function verifyMagicLink(token) {
  try {
    const tokenData = magicLinkTokens.get(token);

    if (!tokenData) {
      return { valid: false, message: 'Invalid token' };
    }

    if (Date.now() > tokenData.expiresAt) {
      magicLinkTokens.delete(token);
      return { valid: false, message: 'Token expired' };
    }

    // Delete token (one-time use)
    magicLinkTokens.delete(token);

    // Generate auth JWT
    const authToken = jwt.sign(
      {
        email: tokenData.email,
        provider: 'email',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      valid: true,
      email: tokenData.email,
      authToken,
    };

  } catch (error) {
    logger.error('Magic link verification failed:', error);
    return { valid: false, message: 'Verification failed' };
  }
}

/**
 * Clean up expired magic link tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of magicLinkTokens.entries()) {
    if (now > data.expiresAt) {
      magicLinkTokens.delete(token);
    }
  }
}

// ==================== Google OAuth ====================

/**
 * Verify Google OAuth token
 */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return { valid: false };
    }

    // Generate auth JWT
    const authToken = jwt.sign(
      {
        email: payload.email,
        googleId: payload.sub,
        provider: 'google',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      valid: true,
      email: payload.email,
      googleId: payload.sub,
      name: payload.name,
      authToken,
    };

  } catch (error) {
    logger.error('Google token verification failed:', error);
    return { valid: false };
  }
}

// ==================== Apple OAuth ====================

/**
 * Verify Apple Sign-In token
 */
async function verifyAppleToken(identityToken, user) {
  try {
    const options = {
      audience: process.env.APPLE_CLIENT_ID || 'com.suishop.signin',
    };

    const appleIdTokenClaims = await appleSignin.verifyIdToken(identityToken, options);

    if (!appleIdTokenClaims) {
      return { valid: false };
    }

    // Generate auth JWT
    const authToken = jwt.sign(
      {
        appleId: appleIdTokenClaims.sub,
        email: appleIdTokenClaims.email,
        provider: 'apple',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      valid: true,
      appleId: appleIdTokenClaims.sub,
      email: appleIdTokenClaims.email,
      name: user?.name,
      authToken,
    };

  } catch (error) {
    logger.error('Apple token verification failed:', error);
    return { valid: false };
  }
}

// ==================== Token Refresh ====================

/**
 * Refresh authentication token
 */
async function refreshAuthToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Generate new auth token
    const authToken = jwt.sign(
      {
        email: decoded.email,
        provider: decoded.provider,
        googleId: decoded.googleId,
        appleId: decoded.appleId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      valid: true,
      authToken,
    };

  } catch (error) {
    logger.error('Token refresh failed:', error);
    return { valid: false };
  }
}

// ==================== Export Functions ====================

module.exports = {
  sendMagicLink,
  verifyMagicLink,
  verifyGoogleToken,
  verifyAppleToken,
  refreshAuthToken,
};
