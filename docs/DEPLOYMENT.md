# Deployment Guide - Sui Shop

Complete step-by-step guide to deploy Sui Shop to Sui testnet and mainnet.

## Prerequisites

- Sui CLI installed and configured
- Node.js 18+ installed
- Sui wallet with testnet/mainnet SUI
- Git for version control

## Part 1: Smart Contract Deployment

### Step 1: Prepare Your Environment

```bash
# Check Sui CLI version
sui --version

# Set up your wallet (if not already done)
sui client new-address ed25519

# Request testnet tokens
# Go to Sui Discord: https://discord.gg/sui
# Use #testnet-faucet channel

# Check your balance
sui client gas
```

### Step 2: Build and Test Contracts

```bash
cd move

# Build the package
sui move build

# Expected output:
# BUILDING sui_commerce
# Successfully verified dependencies on-chain against source.

# Run tests
sui move test

# Expected output:
# Running Move unit tests
# Test result: OK. Total tests: 0; passed: 0; failed: 0
```

### Step 3: Deploy to Testnet

```bash
# Deploy the package
sui client publish --gas-budget 100000000

# SAVE THIS OUTPUT - YOU'LL NEED IT!
# Look for:
# 1. PackageID (starts with 0x...)
# 2. Marketplace Object ID (in Created Objects section)
# 3. AdminCap Object ID (in Created Objects section)

# Example output structure:
# ╭──────────────────────────────────────────────────╮
# │ PackageID: 0xabc123...                           │
# ├──────────────────────────────────────────────────┤
# │ Created Objects:                                 │
# │  - Marketplace (Shared)                          │
# │    ID: 0xdef456...                               │
# │  - AdminCap (Owned)                              │
# │    ID: 0xghi789...                               │
# ╰──────────────────────────────────────────────────╯
```

### Step 4: Verify Deployment

```bash
# Check the package exists
sui client object <PACKAGE_ID>

# Check the marketplace object
sui client object <MARKETPLACE_OBJECT_ID>

# Verify AdminCap is in your wallet
sui client objects
```

### Step 5: Test Basic Operations

```bash
# Create a seller profile (replace with your IDs)
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function create_seller_profile \
  --args \
    '["T","e","s","t"," ","S","e","l","l","e","r"]' \
    '["T","e","s","t"," ","b","i","o"]' \
    "0x6" \
  --gas-budget 10000000

# List a test product
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function list_product \
  --args \
    <MARKETPLACE_OBJECT_ID> \
    '["T","e","s","t"," ","P","r","o","d","u","c","t"]' \
    '["T","e","s","t"," ","d","e","s","c","r","i","p","t","i","o","n"]' \
    "1000000000" \
    '["h","t","t","p","s",":","/"," ","e","x","a","m","p","l","e",".","c","o","m"]' \
    '["t","e","s","t"]' \
    "0x6" \
  --gas-budget 15000000
```

## Part 2: Frontend Deployment

### Step 1: Configure Environment

```bash
cd ../frontend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env.production

# Edit .env.production with your values
nano .env.production
```

Add these values:
```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=<YOUR_PACKAGE_ID>
NEXT_PUBLIC_MARKETPLACE_OBJECT=<YOUR_MARKETPLACE_OBJECT_ID>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 2: Build Frontend

```bash
# Build the application
npm run build

# Test the production build locally
npm start

# Visit http://localhost:3000 to verify
```

### Step 3: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name? sui-commerce
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 4: Configure Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following:

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=<YOUR_PACKAGE_ID>
NEXT_PUBLIC_MARKETPLACE_OBJECT=<YOUR_MARKETPLACE_OBJECT_ID>
NEXT_PUBLIC_APP_URL=<YOUR_VERCEL_URL>
```

5. Redeploy: `vercel --prod`

### Alternative: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build and deploy
netlify deploy --prod

# Follow prompts and set environment variables in Netlify dashboard
```

## Part 3: Post-Deployment Configuration

### Step 1: Secure Your Admin Key

```bash
# NEVER commit your private key to git
# Store AdminCap object ID securely
# Consider using a hardware wallet for admin operations

# Transfer AdminCap to hardware wallet (if available)
sui client transfer \
  --to <HARDWARE_WALLET_ADDRESS> \
  --object-id <ADMIN_CAP_OBJECT_ID> \
  --gas-budget 1000000
```

### Step 2: Configure Platform Settings

```bash
# Set appropriate platform fee (200 = 2%)
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function update_platform_fee \
  --args \
    <ADMIN_CAP_OBJECT_ID> \
    <MARKETPLACE_OBJECT_ID> \
    200 \
  --gas-budget 5000000
```

### Step 3: Set Up Monitoring

1. **Transaction Monitoring**:
   - Use SuiVision or SuiScan to monitor marketplace activity
   - Set up alerts for unusual activity

2. **Error Monitoring**:
   ```bash
   # Add Sentry to package.json
   npm install @sentry/nextjs
   
   # Configure in next.config.js
   ```

3. **Analytics**:
   - Set up Google Analytics or Plausible
   - Track user engagement metrics

### Step 4: Test Everything

```bash
# Checklist:
# [ ] Connect wallet works
# [ ] Create seller profile works
# [ ] List product works
# [ ] Purchase product works
# [ ] Leave review works
# [ ] Follow seller works
# [ ] Admin functions work (if admin)
```

## Part 4: Mainnet Deployment (When Ready)

### Important: Do NOT deploy to mainnet without:
1. Professional security audit
2. Extensive testnet testing (1-2 months)
3. Bug bounty program results
4. Insurance/emergency fund
5. Legal review

### Mainnet Deployment Steps

```bash
# 1. Switch to mainnet
sui client switch --env mainnet

# 2. Ensure you have sufficient SUI for gas
sui client gas

# 3. Deploy contract (same as testnet)
sui client publish --gas-budget 100000000

# 4. Update frontend environment variables
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=<NEW_MAINNET_PACKAGE_ID>
NEXT_PUBLIC_MARKETPLACE_OBJECT=<NEW_MAINNET_MARKETPLACE_ID>

# 5. Deploy frontend
vercel --prod

# 6. Start with limits (configure in admin panel)
# - Low max transaction amounts
# - Conservative rate limits
# - Close monitoring
```

## Troubleshooting

### Issue: "Insufficient gas"
```bash
# Solution: Increase gas budget
# Request more testnet tokens from faucet
```

### Issue: "Package verification failed"
```bash
# Solution: Clean build
rm -rf build/
sui move build
```

### Issue: "Object not found"
```bash
# Solution: Verify object IDs are correct
sui client objects
```

### Issue: "Transaction failed"
```bash
# Solution: Check transaction details
sui client tx-block <TRANSACTION_DIGEST>
```

### Issue: Frontend can't connect to wallet
```bash
# Solution: 
# 1. Check wallet is installed
# 2. Verify network matches (testnet/mainnet)
# 3. Clear browser cache
# 4. Check console for errors
```

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Monitor transaction volume
   - Check error logs
   - Review user feedback

2. **Monthly**:
   - Update dependencies
   - Security scan
   - Performance review

3. **Quarterly**:
   - Feature updates
   - Security audit
   - User survey

### Emergency Procedures

If critical bug found:

```bash
# 1. Pause marketplace immediately
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function set_pause_state \
  --args \
    <ADMIN_CAP_OBJECT_ID> \
    <MARKETPLACE_OBJECT_ID> \
    true \
  --gas-budget 5000000

# 2. Announce on social media
# 3. Fix bug
# 4. Deploy update
# 5. Un-pause when safe
```

## Costs Estimation

### Testnet (Free)
- Gas: Free (from faucet)
- Deployment: Free
- Frontend hosting: Free (Vercel/Netlify free tier)

### Mainnet
- Contract deployment: ~0.1 SUI
- Creating profile: ~0.02 SUI
- Listing product: ~0.015 SUI
- Purchase transaction: ~0.025 SUI + product price
- Frontend hosting: $0-20/month

## Support

- [Sui Documentation](https://docs.sui.io)
- [Sui Discord](https://discord.gg/sui)
- [GitHub Issues](your-repo-url/issues)

---

**Last Updated**: February 2026
**Version**: 1.0.0
