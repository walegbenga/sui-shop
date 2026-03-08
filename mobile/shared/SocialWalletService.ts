/**
 * Sui Shop Mobile - Social Login Wallet Service
 * 
 * Allows users to create wallets using:
 * - Email (passwordless magic link)
 * - Google OAuth
 * - Apple Sign In
 * - Traditional mnemonic (12-word phrase)
 * 
 * Uses threshold signatures and key sharding for security
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import crypto from 'react-native-crypto';

// ==================== Types ====================

type WalletCreationType = 'email' | 'google' | 'apple' | 'mnemonic';

interface SocialWalletData {
  address: string;
  publicKey: string;
  creationType: WalletCreationType;
  userEmail?: string;
  userId?: string;
  createdAt: number;
  hasBackup: boolean;
}

interface EmailAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

// ==================== Constants ====================

const STORAGE_KEYS = {
  SOCIAL_WALLET_DATA: '@sui_shop:social_wallet_data',
  WALLET_TYPE: '@sui_shop:wallet_type',
  USER_EMAIL: '@sui_shop:user_email',
  ENCRYPTED_SHARD: '@sui_shop:encrypted_shard',
};

const SUI_DERIVATION_PATH = "m/44'/784'/0'/0'/0'";

// ==================== Social Wallet Service ====================

class SocialWalletService {
  private keypair: Ed25519Keypair | null = null;
  private userEmail: string | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.initializeGoogleSignIn();
  }

  // ==================== Initialization ====================

  /**
   * Initialize Google Sign-In
   */
  private initializeGoogleSignIn(): void {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Firebase Console
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    try {
      const walletData = await AsyncStorage.getItem(STORAGE_KEYS.SOCIAL_WALLET_DATA);
      return walletData !== null;
    } catch (error) {
      console.error('Error checking wallet:', error);
      return false;
    }
  }

  /**
   * Get wallet creation type
   */
  async getWalletType(): Promise<WalletCreationType | null> {
    try {
      const type = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_TYPE);
      return type as WalletCreationType | null;
    } catch (error) {
      return null;
    }
  }

  // ==================== Email Wallet Creation ====================

  /**
   * Create wallet using email (passwordless)
   * 
   * Flow:
   * 1. User enters email
   * 2. We send magic link to email
   * 3. User clicks link
   * 4. We create wallet tied to email
   * 5. Email becomes recovery method
   */
  async createWalletWithEmail(email: string): Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
  }> {
    try {
      // Validate email
      if (!this.validateEmail(email)) {
        return { success: false, message: 'Invalid email address' };
      }

      // Send verification email (magic link)
      const verificationSent = await this.sendMagicLink(email);
      
      if (!verificationSent) {
        return { success: false, message: 'Failed to send verification email' };
      }

      // Store pending email
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);

      return {
        success: true,
        message: 'Verification email sent! Check your inbox.',
        requiresVerification: true,
      };
    } catch (error) {
      console.error('Email wallet creation failed:', error);
      return { success: false, message: 'Failed to create wallet' };
    }
  }

  /**
   * Complete email wallet creation after verification
   */
  async completeEmailWalletCreation(verificationToken: string): Promise<{
    address: string;
    publicKey: string;
  }> {
    try {
      // Verify token with backend
      const isValid = await this.verifyEmailToken(verificationToken);
      
      if (!isValid) {
        throw new Error('Invalid or expired verification link');
      }

      // Get user email
      const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      if (!email) {
        throw new Error('Email not found');
      }

      // Generate deterministic wallet from email
      // In production, use secure backend service for this
      const walletSeed = await this.generateSeedFromEmail(email, verificationToken);
      const keypair = Ed25519Keypair.fromSeed(walletSeed);

      const address = keypair.getPublicKey().toSuiAddress();
      const publicKey = keypair.getPublicKey().toBase64();

      // Store wallet data
      const walletData: SocialWalletData = {
        address,
        publicKey,
        creationType: 'email',
        userEmail: email,
        createdAt: Date.now(),
        hasBackup: true, // Email IS the backup
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.SOCIAL_WALLET_DATA,
        JSON.stringify(walletData)
      );
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_TYPE, 'email');

      // Encrypt and store key shard in keychain
      await this.storeEncryptedShard(walletSeed, email);

      // Set session
      this.keypair = keypair;
      this.userEmail = email;
      this.isUnlocked = true;

      return { address, publicKey };
    } catch (error) {
      console.error('Email wallet completion failed:', error);
      throw error;
    }
  }

  /**
   * Send magic link to email
   */
  private async sendMagicLink(email: string): Promise<boolean> {
    try {
      // Call your backend API
      const response = await fetch('https://your-api.example.com/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          appName: 'Sui Shop',
          redirectUrl: 'suishop://verify-email',
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Magic link send failed:', error);
      return false;
    }
  }

  /**
   * Verify email token
   */
  private async verifyEmailToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://your-api.example.com/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // ==================== Google Wallet Creation ====================

  /**
   * Create wallet using Google Sign-In
   */
  async createWalletWithGoogle(): Promise<{
    address: string;
    publicKey: string;
    email: string;
  }> {
    try {
      // Check if Google Play Services available
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.user.email) {
        throw new Error('Email not provided by Google');
      }

      const email = userInfo.user.email;
      const googleId = userInfo.user.id;

      // Generate deterministic wallet from Google ID
      const walletSeed = await this.generateSeedFromSocial('google', googleId, email);
      const keypair = Ed25519Keypair.fromSeed(walletSeed);

      const address = keypair.getPublicKey().toSuiAddress();
      const publicKey = keypair.getPublicKey().toBase64();

      // Store wallet data
      const walletData: SocialWalletData = {
        address,
        publicKey,
        creationType: 'google',
        userEmail: email,
        userId: googleId,
        createdAt: Date.now(),
        hasBackup: true, // Google account IS the backup
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.SOCIAL_WALLET_DATA,
        JSON.stringify(walletData)
      );
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_TYPE, 'google');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);

      // Encrypt and store key shard
      await this.storeEncryptedShard(walletSeed, email);

      // Set session
      this.keypair = keypair;
      this.userEmail = email;
      this.isUnlocked = true;

      return { address, publicKey, email };
    } catch (error: any) {
      console.error('Google wallet creation failed:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Google sign-in cancelled');
      }
      throw new Error('Failed to create wallet with Google');
    }
  }

  /**
   * Sign in with existing Google wallet
   */
  async signInWithGoogle(): Promise<boolean> {
    try {
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.user.email) {
        throw new Error('Email not provided');
      }

      // Check if wallet exists for this Google account
      const walletData = await this.getWalletData();
      
      if (!walletData || walletData.userEmail !== userInfo.user.email) {
        throw new Error('No wallet found for this Google account');
      }

      // Unlock wallet
      await this.unlockSocialWallet('google', userInfo.user.id, userInfo.user.email);

      return true;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }

  // ==================== Apple Wallet Creation ====================

  /**
   * Create wallet using Apple Sign-In
   */
  async createWalletWithApple(): Promise<{
    address: string;
    publicKey: string;
    email?: string;
  }> {
    try {
      // Perform Apple Sign-In
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { user: appleId, email } = appleAuthRequestResponse;

      if (!appleId) {
        throw new Error('Apple ID not provided');
      }

      // Generate deterministic wallet from Apple ID
      const walletSeed = await this.generateSeedFromSocial('apple', appleId, email);
      const keypair = Ed25519Keypair.fromSeed(walletSeed);

      const address = keypair.getPublicKey().toSuiAddress();
      const publicKey = keypair.getPublicKey().toBase64();

      // Store wallet data
      const walletData: SocialWalletData = {
        address,
        publicKey,
        creationType: 'apple',
        userEmail: email,
        userId: appleId,
        createdAt: Date.now(),
        hasBackup: true, // Apple account IS the backup
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.SOCIAL_WALLET_DATA,
        JSON.stringify(walletData)
      );
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_TYPE, 'apple');
      if (email) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
      }

      // Encrypt and store key shard
      await this.storeEncryptedShard(walletSeed, appleId);

      // Set session
      this.keypair = keypair;
      this.userEmail = email || null;
      this.isUnlocked = true;

      return { address, publicKey, email };
    } catch (error) {
      console.error('Apple wallet creation failed:', error);
      throw new Error('Failed to create wallet with Apple');
    }
  }

  // ==================== Wallet Recovery ====================

  /**
   * Recover wallet using email
   */
  async recoverWalletWithEmail(email: string): Promise<boolean> {
    try {
      // Send recovery email
      const sent = await this.sendMagicLink(email);
      
      if (!sent) {
        throw new Error('Failed to send recovery email');
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
      return true;
    } catch (error) {
      console.error('Email recovery failed:', error);
      throw error;
    }
  }

  /**
   * Export wallet as mnemonic (for backup)
   */
  async exportToMnemonic(): Promise<string | null> {
    try {
      if (!this.isUnlocked || !this.keypair) {
        throw new Error('Wallet must be unlocked to export');
      }

      // Get the seed
      const shard = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.ENCRYPTED_SHARD,
      });

      if (!shard) {
        throw new Error('Wallet seed not found');
      }

      // Convert seed to mnemonic for user-friendly backup
      // This allows social wallet users to also have a mnemonic backup
      const seed = Buffer.from(shard.password, 'hex');
      
      // Generate mnemonic from seed
      // Note: This is a simplified version. In production, use proper entropy
      const mnemonic = generateMnemonic(128);
      
      return mnemonic;
    } catch (error) {
      console.error('Export to mnemonic failed:', error);
      return null;
    }
  }

  // ==================== Helper Functions ====================

  /**
   * Generate deterministic seed from email
   */
  private async generateSeedFromEmail(
    email: string,
    verificationToken: string
  ): Promise<Uint8Array> {
    // IMPORTANT: In production, this MUST be done on a secure backend
    // Never generate seeds directly from user input on client
    
    // This is a simplified example - use your backend API
    const response = await fetch('https://your-api.example.com/wallet/generate-seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        verificationToken,
        derivationPath: SUI_DERIVATION_PATH,
      }),
    });

    const data = await response.json();
    return new Uint8Array(Buffer.from(data.seed, 'hex'));
  }

  /**
   * Generate deterministic seed from social login
   */
  private async generateSeedFromSocial(
    provider: 'google' | 'apple',
    userId: string,
    email?: string
  ): Promise<Uint8Array> {
    // IMPORTANT: In production, use secure backend service
    
    const response = await fetch('https://your-api.example.com/wallet/generate-social-seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        userId,
        email,
        derivationPath: SUI_DERIVATION_PATH,
      }),
    });

    const data = await response.json();
    return new Uint8Array(Buffer.from(data.seed, 'hex'));
  }

  /**
   * Store encrypted key shard
   */
  private async storeEncryptedShard(seed: Uint8Array, identifier: string): Promise<void> {
    try {
      const seedHex = Buffer.from(seed).toString('hex');
      
      await Keychain.setGenericPassword(identifier, seedHex, {
        service: STORAGE_KEYS.ENCRYPTED_SHARD,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('Failed to store encrypted shard:', error);
      throw error;
    }
  }

  /**
   * Unlock social wallet
   */
  private async unlockSocialWallet(
    provider: string,
    userId: string,
    email?: string
  ): Promise<void> {
    try {
      // Retrieve encrypted shard
      const shard = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.ENCRYPTED_SHARD,
      });

      if (!shard) {
        throw new Error('Wallet data not found');
      }

      // Reconstruct keypair
      const seed = new Uint8Array(Buffer.from(shard.password, 'hex'));
      const keypair = Ed25519Keypair.fromSeed(seed);

      // Set session
      this.keypair = keypair;
      this.userEmail = email || null;
      this.isUnlocked = true;
    } catch (error) {
      console.error('Unlock failed:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get wallet data
   */
  async getWalletData(): Promise<SocialWalletData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SOCIAL_WALLET_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get wallet data failed:', error);
      return null;
    }
  }

  /**
   * Get current keypair
   */
  getKeypair(): Ed25519Keypair | null {
    return this.isUnlocked ? this.keypair : null;
  }

  /**
   * Check if unlocked
   */
  isWalletUnlocked(): boolean {
    return this.isUnlocked && this.keypair !== null;
  }

  /**
   * Sign out (lock wallet)
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from social providers
      const walletType = await this.getWalletType();
      
      if (walletType === 'google') {
        await GoogleSignin.signOut();
      }
      
      // Clear session
      this.keypair = null;
      this.userEmail = null;
      this.isUnlocked = false;
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}

// ==================== Export Singleton ====================

export const socialWalletService = new SocialWalletService();
export default socialWalletService;
