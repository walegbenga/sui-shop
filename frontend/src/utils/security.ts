/**
 * Security Utilities - Updated for latest Sui SDK
 */

import { z } from 'zod';

// ==================== Validation Schemas ====================

export const ProductSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.number().positive().max(1000000),
  imageUrl: z.string().url(),
  category: z.string().min(2).max(50),
});

export const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5).max(500),
});

export const ProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().min(10).max(500),
});

// ==================== Rate Limiting ====================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Rate limiters
export const transactionRateLimiter = new RateLimiter(10, 60000); // 10 per minute
export const listingRateLimiter = new RateLimiter(5, 300000); // 5 per 5 minutes

// ==================== Conversion Utilities ====================

const MIST_PER_SUI = 1_000_000_000;

export function suiToMist(sui: number): bigint {
  return BigInt(Math.floor(sui * MIST_PER_SUI));
}

export function mistToSui(mist: bigint | string): number {
  const mistBigInt = typeof mist === 'string' ? BigInt(mist) : mist;
  return Number(mistBigInt) / MIST_PER_SUI;
}

// ==================== Error Handling ====================

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

// ==================== Transaction Timeout ====================

export async function createTransactionWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 60000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
    ),
  ]);
}

// ==================== Input Sanitization ====================

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

// ==================== Validation Helpers ====================

export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function isValidObjectId(id: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(id);
}

// ==================== Exports ====================

export default {
  ProductSchema,
  ReviewSchema,
  ProfileSchema,
  transactionRateLimiter,
  listingRateLimiter,
  suiToMist,
  mistToSui,
  getSafeErrorMessage,
  createTransactionWithTimeout,
  sanitizeInput,
  sanitizeUrl,
  isValidSuiAddress,
  isValidObjectId,
};