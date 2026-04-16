export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://digi-chainstore-production.up.railway.app' // Railway web generated address
  : 'http://localhost:4000';