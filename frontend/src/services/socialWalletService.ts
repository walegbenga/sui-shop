/**
 * Social Wallet Service - Web Version
 * Handles Google/Apple/Email login for web browsers
 */

//import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { API_URL } from '@/lib/api';


// Types
interface WalletData {
  address: string;
  publicKey: string;
  provider: 'google' | 'apple' | 'email';
  email: string;
  createdAt: number;
}

interface AuthResponse {
  success: boolean;
  authToken: string;
  email: string;
  googleId?: string;
  appleId?: string;
}

interface WalletResponse {
  success: boolean;
  address: string;
  seed: string;
  publicKey: string;
}

// ==================== Social Wallet Service ====================

class SocialWalletService {
  private keypair: Ed25519Keypair | null = null;
  private walletData: WalletData | null = null;
  private authToken: string | null = null;

  // ==================== Initialization ====================

  /**
   * Check if user has social wallet
   */
  hasSocialWallet(): boolean {
    const data = localStorage.getItem('sui_shop_social_wallet');
    return data !== null;
  }

  /**
   * Load existing wallet from storage
   */
  loadWallet(): WalletData | null {
    try {
      const data = localStorage.getItem('sui_shop_social_wallet');
      if (!data) return null;

      this.walletData = JSON.parse(data);
      return this.walletData;
    } catch (error) {
      console.error('Failed to load wallet:', error);
      return null;
    }
  }

  // ==================== Google Sign-In ====================

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ address: string; email: string }> {
    try {
      // Load Google Sign-In library
      await this.loadGoogleSignIn();

      // Initialize Google Sign-In
      const auth2 = await window.gapi.auth2.init({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'profile email',
      });

      // Sign in
      const googleUser = await auth2.signIn();
      const idToken = googleUser.getAuthResponse().id_token;
      const profile = googleUser.getBasicProfile();
      const email = profile.getEmail();

      // Verify token with backend
      const authResponse = await fetch(`${API_URL}/api/auth/verify-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const authData: AuthResponse = await authResponse.json();

      if (!authData.success) {
        throw new Error('Google authentication failed');
      }

      // Generate wallet from backend
      const walletResponse = await fetch(`${API_URL}/api/wallet/generate-seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          userIdentifier: `google:${authData.googleId}`,
          authToken: authData.authToken,
        }),
      });

      const walletData: WalletResponse = await walletResponse.json();

      if (!walletData.success) {
        throw new Error('Wallet generation failed');
      }

      // Store wallet data
      await this.storeWallet({
        address: walletData.address,
        publicKey: walletData.publicKey,
        provider: 'google',
        email,
        createdAt: Date.now(),
      });

      // Store encrypted seed in sessionStorage (more secure than localStorage)
      this.storeEncryptedSeed(walletData.seed);

      // Create keypair
      this.keypair = Ed25519Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(walletData.seed, 'hex'))
      );
      this.authToken = authData.authToken;

      return { address: walletData.address, email };
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Load Google Sign-In library
   */
  private loadGoogleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/platform.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('auth2', () => resolve());
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // ==================== Email Sign-In ====================

  /**
   * Send magic link to email
   */
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/send-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Magic link send failed:', error);
      return { success: false, message: 'Failed to send magic link' };
    }
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token: string): Promise<{ address: string; email: string }> {
    try {
      // Verify token with backend
      const authResponse = await fetch(`${API_URL}/api/auth/verify-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const authData: AuthResponse = await authResponse.json();

      if (!authData.success) {
        throw new Error('Magic link verification failed');
      }

      const email = authData.email;

      // Generate wallet from backend
      const walletResponse = await fetch(`${API_URL}/api/wallet/generate-seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'email',
          userIdentifier: `email:${email}`,
          authToken: authData.authToken,
        }),
      });

      const walletData: WalletResponse = await walletResponse.json();

      if (!walletData.success) {
        throw new Error('Wallet generation failed');
      }

      // Store wallet data
      await this.storeWallet({
        address: walletData.address,
        publicKey: walletData.publicKey,
        provider: 'email',
        email,
        createdAt: Date.now(),
      });

      // Store encrypted seed
      this.storeEncryptedSeed(walletData.seed);

      // Create keypair
      this.keypair = Ed25519Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(walletData.seed, 'hex'))
      );
      this.authToken = authData.authToken;

      return { address: walletData.address, email };
    } catch (error) {
      console.error('Magic link verification failed:', error);
      throw error;
    }
  }

  // ==================== Storage ====================

  /**
   * Store wallet data in localStorage
   */
  private async storeWallet(data: WalletData): Promise<void> {
    try {
      localStorage.setItem('sui_shop_social_wallet', JSON.stringify(data));
      this.walletData = data;
    } catch (error) {
      console.error('Failed to store wallet:', error);
      throw error;
    }
  }

  /**
   * Store encrypted seed in sessionStorage
   */
  private storeEncryptedSeed(seed: string): void {
    try {
      // In production, encrypt this with user password
      // For now, storing in sessionStorage (cleared on tab close)
      sessionStorage.setItem('sui_shop_wallet_seed', seed);
    } catch (error) {
      console.error('Failed to store seed:', error);
    }
  }

  /**
   * Retrieve seed from storage
   */
  private retrieveSeed(): string | null {
    try {
      return sessionStorage.getItem('sui_shop_wallet_seed');
    } catch (error) {
      console.error('Failed to retrieve seed:', error);
      return null;
    }
  }

  // ==================== Wallet Operations ====================

  /**
   * Unlock wallet (restore from session)
   */
  async unlockWallet(): Promise<boolean> {
    try {
      const seed = this.retrieveSeed();
      if (!seed) return false;

      this.keypair = Ed25519Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(seed, 'hex'))
      );

      return true;
    } catch (error) {
      console.error('Unlock failed:', error);
      return false;
    }
  }

  /**
   * Get current address
   */
  getCurrentAddress(): string | null {
    return this.walletData?.address || null;
  }

  /**
   * Get current email
   */
  getCurrentEmail(): string | null {
    return this.walletData?.email || null;
  }

  /**
   * Get keypair for signing transactions
   */
  getKeypair(): Ed25519Keypair | null {
    return this.keypair;
  }

  /**
   * Check if wallet is unlocked
   */
  isUnlocked(): boolean {
    return this.keypair !== null;
  }

  /**
   * Sign out (clear session)
   */
  async signOut(): Promise<void> {
    try {
      // Clear storage
      sessionStorage.removeItem('sui_shop_wallet_seed');
      
      // Sign out from Google if applicable
      if (this.walletData?.provider === 'google' && window.gapi?.auth2) {
        const auth2 = window.gapi.auth2.getAuthInstance();
        if (auth2) {
          await auth2.signOut();
        }
      }

      // Clear state
      this.keypair = null;
      this.authToken = null;
      
      // Don't clear localStorage (keeps wallet data for re-login)
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  /**
   * Delete wallet completely
   */
  async deleteWallet(): Promise<void> {
    try {
      await this.signOut();
      localStorage.removeItem('sui_shop_social_wallet');
      this.walletData = null;
    } catch (error) {
      console.error('Delete wallet failed:', error);
      throw error;
    }
  }
}

// ==================== Export Singleton ====================

export const socialWalletService = new SocialWalletService();
export default socialWalletService;

// ==================== Type Declarations ====================

declare global {
  interface Window {
    gapi: any;
  }
}
