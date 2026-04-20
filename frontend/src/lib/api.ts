/**
 * Central API URL configuration
 * - Local dev:  http://localhost:4000
 * - Production: NEXT_PUBLIC_API_URL env var (your Railway API URL)
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_URL = BASE_URL
  ? BASE_URL.replace(/\/$/, '')
  : 'http://localhost:4000';
