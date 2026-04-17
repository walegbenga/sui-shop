/**
 * Central API URL configuration
 * - Local dev:  '${API_URL}
 * - Production: NEXT_PUBLIC_API_URL env var (your Railway API URL)
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || `${API_URL}`;
