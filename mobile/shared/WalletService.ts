/**
 * Sui Shop Mobile - Secure Wallet Service
 * 
 * Handles wallet creation, storage, and management with encryption
 * and biometric authentication support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics from 'react-native-biometrics';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import nacl from 'tweetnacl';

// ==================== Types ====================

interface WalletData {
  address: string;
  publicKey: string;
  createdAt: number;
  hasBackup: boolean;
}

interface WalletConfig {
  useBiometrics: boolean;
  autoLock: boolean;
  autoLockTimeout: number; // minutes
}

// ==================== Constants ====================

const STORAGE_KEYS = {
  WALLET_DATA: '@sui_shop:wallet_data',
  WALLET_CONFIG: '@sui_shop:wallet_config',
  ENCRYPTED_MNEMONIC: '@sui_shop:encrypted_mnemonic',
};

const SUI_DERIVATION_PATH = "m/44'/784'/0'/0'/0'"; // Sui's standard path

// ==================== Wallet Service ====================

class WalletService {
  private keypair: Ed25519Keypair | null = null;
  private mnemonic: string | null = null;
  private biometrics: ReactNativeBiometrics;
  private isUnlocked: boolean = false;
  private autoLockTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.biometrics = new ReactNativeBiometrics();
  }

  // ==================== Initialization ====================

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    try {
      const walletData = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_DATA);
      return walletData !== null;
    } catch (error) {
      console.error('Error checking wallet:', error);
      return false;
    }
  }

  /**
   * Check if biometrics are available
   */
  async isBiometricsAvailable(): Promise<boolean> {
    try {
      const { available, biometryType } = await this.biometrics.isSensorAvailable();
      return available && (biometryType === 'FaceID' || biometryType === 'TouchID' || biometryType === 'Biometrics');
    } catch (error) {
      console.error('Biometrics check failed:', error);
      return false;
    }
  }

  // ==================== Wallet Creation ====================

  /**
   * Create new wallet with mnemonic phrase
   */
  async createWallet(useBiometrics: boolean = true): Promise<{
    address: string;
    mnemonic: string;
    publicKey: string;
  }> {
    try {
      // Generate 12-word mnemonic
      const mnemonic = generateMnemonic(128); // 128 bits = 12 words
      
      // Derive keypair from mnemonic
      const seed = mnemonicToSeedSync(mnemonic);
      const derivedSeed = derivePath(SUI_DERIVATION_PATH, seed.toString('hex')).key;
      const keypair = Ed25519Keypair.fromSeed(derivedSeed);

      // Get address and public key
      const address = keypair.getPublicKey().toSuiAddress();
      const publicKey = keypair.getPublicKey().toBase64();

      // Store encrypted mnemonic
      await this.storeMnemonic(mnemonic, useBiometrics);

      // Store wallet data (non-sensitive)
      const walletData: WalletData = {
        address,
        publicKey,
        createdAt: Date.now(),
        hasBackup: false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(walletData));

      // Store config
      const config: WalletConfig = {
        useBiometrics,
        autoLock: true,
        autoLockTimeout: 5, // 5 minutes
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_CONFIG, JSON.stringify(config));

      // Set current session
      this.keypair = keypair;
      this.mnemonic = mnemonic;
      this.isUnlocked = true;
      this.startAutoLockTimer();

      return { address, mnemonic, publicKey };
    } catch (error) {
      console.error('Wallet creation failed:', error);
      throw new Error('Failed to create wallet. Please try again.');
    }
  }

  /**
   * Import wallet from mnemonic
   */
  async importWallet(mnemonic: string, useBiometrics: boolean = true): Promise<{
    address: string;
    publicKey: string;
  }> {
    try {
      // Validate mnemonic
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid recovery phrase');
      }

      // Derive keypair
      const seed = mnemonicToSeedSync(mnemonic);
      const derivedSeed = derivePath(SUI_DERIVATION_PATH, seed.toString('hex')).key;
      const keypair = Ed25519Keypair.fromSeed(derivedSeed);

      const address = keypair.getPublicKey().toSuiAddress();
      const publicKey = keypair.getPublicKey().toBase64();

      // Store encrypted mnemonic
      await this.storeMnemonic(mnemonic, useBiometrics);

      // Store wallet data
      const walletData: WalletData = {
        address,
        publicKey,
        createdAt: Date.now(),
        hasBackup: true, // Imported wallets are considered backed up
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(walletData));

      // Store config
      const config: WalletConfig = {
        useBiometrics,
        autoLock: true,
        autoLockTimeout: 5,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_CONFIG, JSON.stringify(config));

      // Set current session
      this.keypair = keypair;
      this.mnemonic = mnemonic;
      this.isUnlocked = true;
      this.startAutoLockTimer();

      return { address, publicKey };
    } catch (error) {
      console.error('Wallet import failed:', error);
      throw new Error('Failed to import wallet. Please check your recovery phrase.');
    }
  }

  // ==================== Mnemonic Storage ====================

  /**
   * Store mnemonic securely with optional biometric protection
   */
  private async storeMnemonic(mnemonic: string, useBiometrics: boolean): Promise<void> {
    try {
      if (useBiometrics) {
        const biometricsAvailable = await this.isBiometricsAvailable();
        if (biometricsAvailable) {
          // Create biometric key
          await this.biometrics.createKeys();

          // Store in Keychain with biometric protection
          await Keychain.setGenericPassword(
            'sui_shop_wallet',
            mnemonic,
            {
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );
          return;
        }
      }

      // Fallback: Encrypt and store in Keychain (no biometrics)
      await Keychain.setGenericPassword('sui_shop_wallet', mnemonic, {
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('Mnemonic storage failed:', error);
      throw new Error('Failed to secure wallet. Please try again.');
    }
  }

  /**
   * Retrieve mnemonic from secure storage
   */
  private async retrieveMnemonic(useBiometrics: boolean = true): Promise<string> {
    try {
      if (useBiometrics) {
        const biometricsAvailable = await this.isBiometricsAvailable();
        if (biometricsAvailable) {
          // Prompt for biometric authentication
          const { success } = await this.biometrics.simplePrompt({
            promptMessage: 'Authenticate to unlock wallet',
          });

          if (!success) {
            throw new Error('Biometric authentication failed');
          }
        }
      }

      // Retrieve from Keychain
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        throw new Error('Wallet not found');
      }

      return credentials.password;
    } catch (error) {
      console.error('Mnemonic retrieval failed:', error);
      throw new Error('Failed to unlock wallet');
    }
  }

  // ==================== Wallet Unlock/Lock ====================

  /**
   * Unlock wallet for use
   */
  async unlockWallet(): Promise<string> {
    try {
      // Get config
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_CONFIG);
      const config: WalletConfig = configStr ? JSON.parse(configStr) : { useBiometrics: false };

      // Retrieve mnemonic
      const mnemonic = await this.retrieveMnemonic(config.useBiometrics);

      // Derive keypair
      const seed = mnemonicToSeedSync(mnemonic);
      const derivedSeed = derivePath(SUI_DERIVATION_PATH, seed.toString('hex')).key;
      const keypair = Ed25519Keypair.fromSeed(derivedSeed);

      // Set session
      this.keypair = keypair;
      this.mnemonic = mnemonic;
      this.isUnlocked = true;

      // Start auto-lock timer
      if (config.autoLock) {
        this.startAutoLockTimer(config.autoLockTimeout);
      }

      return keypair.getPublicKey().toSuiAddress();
    } catch (error) {
      console.error('Unlock failed:', error);
      throw error;
    }
  }

  /**
   * Lock wallet (clear session)
   */
  lockWallet(): void {
    this.keypair = null;
    this.mnemonic = null;
    this.isUnlocked = false;
    this.stopAutoLockTimer();
  }

  /**
   * Check if wallet is unlocked
   */
  isWalletUnlocked(): boolean {
    return this.isUnlocked && this.keypair !== null;
  }

  // ==================== Auto-Lock Timer ====================

  private startAutoLockTimer(timeoutMinutes: number = 5): void {
    this.stopAutoLockTimer();
    this.autoLockTimer = setTimeout(() => {
      this.lockWallet();
    }, timeoutMinutes * 60 * 1000);
  }

  private stopAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  /**
   * Reset auto-lock timer (call on user activity)
   */
  resetAutoLockTimer(): void {
    if (this.isUnlocked) {
      AsyncStorage.getItem(STORAGE_KEYS.WALLET_CONFIG).then(configStr => {
        const config: WalletConfig = configStr ? JSON.parse(configStr) : { autoLock: true, autoLockTimeout: 5 };
        if (config.autoLock) {
          this.startAutoLockTimer(config.autoLockTimeout);
        }
      });
    }
  }

  // ==================== Wallet Info ====================

  /**
   * Get wallet data
   */
  async getWalletData(): Promise<WalletData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get wallet data failed:', error);
      return null;
    }
  }

  /**
   * Get current address
   */
  getCurrentAddress(): string | null {
    if (!this.keypair) return null;
    return this.keypair.getPublicKey().toSuiAddress();
  }

  /**
   * Get mnemonic (only when unlocked)
   */
  getMnemonic(): string | null {
    return this.isUnlocked ? this.mnemonic : null;
  }

  /**
   * Mark backup as complete
   */
  async markBackupComplete(): Promise<void> {
    try {
      const data = await this.getWalletData();
      if (data) {
        data.hasBackup = true;
        await AsyncStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Mark backup failed:', error);
    }
  }

  // ==================== Transaction Signing ====================

  /**
   * Sign transaction
   */
  async signTransaction(txb: TransactionBlock): Promise<string> {
    if (!this.keypair || !this.isUnlocked) {
      throw new Error('Wallet is locked. Please unlock first.');
    }

    try {
      // Reset auto-lock timer on activity
      this.resetAutoLockTimer();

      // Build transaction bytes
      const txBytes = await txb.build({ client: new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' }) });

      // Sign
      const signature = await this.keypair.signTransactionBlock(txBytes);
      return signature.signature;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error('Failed to sign transaction');
    }
  }

  /**
   * Sign and execute transaction
   */
  async signAndExecuteTransaction(
    txb: TransactionBlock,
    client: SuiClient
  ): Promise<any> {
    if (!this.keypair || !this.isUnlocked) {
      throw new Error('Wallet is locked. Please unlock first.');
    }

    try {
      this.resetAutoLockTimer();

      // Sign and execute
      const result = await client.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keypair,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      return result;
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }

  // ==================== Wallet Reset ====================

  /**
   * Delete wallet completely (DANGEROUS!)
   */
  async deleteWallet(): Promise<void> {
    try {
      // Clear session
      this.lockWallet();

      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.WALLET_CONFIG);
      await Keychain.resetGenericPassword();

      // Reset biometrics
      await this.biometrics.deleteKeys();
    } catch (error) {
      console.error('Wallet deletion failed:', error);
      throw new Error('Failed to delete wallet');
    }
  }

  // ==================== Validation ====================

  /**
   * Validate mnemonic phrase
   */
  private validateMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  }

  /**
   * Validate Sui address
   */
  validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }
}

// ==================== Export Singleton ====================

export const walletService = new WalletService();
export default walletService;
