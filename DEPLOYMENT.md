# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- Sui CLI installed and configured
- Wallet with sufficient SUI tokens
- Node.js 18+ and npm
- Git for version control

## Step-by-Step Deployment

### 1. Prepare Smart Contract

```bash
# Clone or navigate to project
cd sui-commerce

# Install Sui CLI if not already installed
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Verify Sui CLI
sui --version
```

### 2. Configure Wallet

```bash
# Create new wallet (if needed)
sui client new-address ed25519

# Or import existing wallet
sui keytool import <private-key> ed25519

# Check active address
sui client active-address

# Switch network (for devnet deployment)
sui client switch --env devnet

# Get devnet tokens
sui client faucet

# Check balance
sui client gas
```

### 3. Build and Test Smart Contract

```bash
# Navigate to project root
cd sui-commerce

# Build the Move package
sui move build

# Run comprehensive tests
sui move test

# Expected output: All tests should PASS
# - test_platform_initialization
# - test_create_seller_profile
# - test_list_product
# - test_purchase_product
# - test_review_product
# - test_insufficient_payment_fails
# - test_unauthorized_update_fails
# - test_self_review_fails
```

### 4. Deploy Smart Contract

```bash
# Deploy to devnet
sui client publish --gas-budget 100000000

# Save the output! You'll need:
# 1. Package ID (starts with 0x...)
# 2. Platform Object ID (look for "Platform" in Created Objects)

# Example output:
# ----- Transaction Effects ----
# Status : Success
# Created Objects:
#   ┌──
#   │ ObjectID: 0xabc123... (SAVE THIS - Platform Object)
#   │ Type: 0xdef456...::marketplace::Platform
#   ...
# Published Objects:
#   ┌──
#   │ PackageID: 0xdef456... (SAVE THIS - Package ID)
#   │ Modules: marketplace
```

### 5. Verify Deployment

```bash
# Check on Sui Explorer
# Devnet: https://suiexplorer.com/?network=devnet
# Search for your Package ID

# View platform object
sui client object <PLATFORM_OBJECT_ID>

# Verify package modules
sui client package <PACKAGE_ID>
```

### 6. Configure Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local

# Edit .env.local with your deployed addresses
nano .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_PACKAGE_ID_DEVNET=<YOUR_PACKAGE_ID>
NEXT_PUBLIC_PLATFORM_ID_DEVNET=<YOUR_PLATFORM_OBJECT_ID>
```

### 7. Test Frontend Locally

```bash
# Run development server
npm run dev

# Visit http://localhost:3000

# Test wallet connection
# - Click "Connect Wallet"
# - Select Sui Wallet or Suiet
# - Approve connection

# Test listing a product
# - Go to "Sell Product" tab
# - Fill in product details
# - Submit and approve transaction
# - Wait for confirmation

# Test purchasing
# - Go to "Marketplace" tab
# - Click on a product
# - Click "Buy Now"
# - Confirm purchase
```

### 8. Deploy Frontend

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings > Environment Variables
# Add all NEXT_PUBLIC_* variables

# Deploy to production
vercel --prod
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Set environment variables
netlify env:set NEXT_PUBLIC_NETWORK devnet
netlify env:set NEXT_PUBLIC_PACKAGE_ID_DEVNET <package-id>
netlify env:set NEXT_PUBLIC_PLATFORM_ID_DEVNET <platform-id>

# Production deployment
netlify deploy --prod
```

#### Option C: Custom Server

```bash
# Build production bundle
npm run build

# Start production server
npm run start

# Or use PM2 for process management
npm i -g pm2
pm2 start npm --name "sui-commerce" -- start
pm2 save
pm2 startup
```

### 9. Post-Deployment Verification

```bash
# Check deployment
# 1. Visit deployed URL
# 2. Connect wallet
# 3. Create seller profile
# 4. List a test product
# 5. Purchase test product (with different wallet)
# 6. Leave a review

# Monitor transactions on Sui Explorer
# - Check all transactions succeeded
# - Verify gas costs
# - Confirm events emitted correctly
```

## Mainnet Deployment

**⚠️ IMPORTANT: Mainnet uses real money. Be extremely careful!**

### Additional Steps for Mainnet

1. **Security Audit**
   ```bash
   # Get professional security audit
   # Recommended firms:
   # - Trail of Bits
   # - OpenZeppelin
   # - Quantstamp
   ```

2. **Switch to Mainnet**
   ```bash
   # Switch Sui CLI to mainnet
   sui client switch --env mainnet
   
   # Verify you have sufficient SUI
   sui client gas
   # You'll need ~0.1 SUI for deployment
   ```

3. **Deploy with Extra Caution**
   ```bash
   # Build and test one more time
   sui move test
   
   # Deploy to mainnet
   sui client publish --gas-budget 100000000
   
   # IMMEDIATELY save Package ID and Platform Object ID
   # Store them securely (password manager, encrypted file)
   ```

4. **Update Frontend Configuration**
   ```bash
   # Update .env.local
   NEXT_PUBLIC_NETWORK=mainnet
   NEXT_PUBLIC_PACKAGE_ID_MAINNET=<mainnet-package-id>
   NEXT_PUBLIC_PLATFORM_ID_MAINNET=<mainnet-platform-id>
   
   # Rebuild
   npm run build
   
   # Deploy to production
   vercel --prod
   ```

5. **Initial Testing on Mainnet**
   - Start with small test transactions
   - Verify all functions work correctly
   - Monitor gas costs
   - Test with trusted users first

6. **Setup Monitoring**
   ```bash
   # Set up error tracking (e.g., Sentry)
   npm install @sentry/nextjs
   
   # Configure monitoring for:
   # - Transaction failures
   # - Wallet connection issues
   # - Gas estimation errors
   # - Network errors
   ```

## Troubleshooting

### "Insufficient gas" Error
```bash
# Increase gas budget
sui client publish --gas-budget 200000000

# Or get more SUI
# Devnet: sui client faucet
# Mainnet: Buy SUI from exchange
```

### "Package already published" Error
```bash
# This is normal if you're re-deploying
# Each deployment creates a NEW package
# Update your frontend config with the new Package ID
```

### Frontend shows "Invalid Package ID"
```bash
# Verify Package ID format
# Should be: 0x followed by 64 hex characters
# Check .env.local is correctly configured
# Restart dev server after changing .env.local
```

### Wallet not connecting
```bash
# Clear browser cache
# Update wallet extension
# Try different wallet (Sui Wallet vs Suiet)
# Check network in wallet matches frontend
```

## Rollback Procedure

If issues occur after deployment:

1. **Smart Contract**
   - Cannot rollback deployed contracts
   - Must deploy new version with fixes
   - Update frontend to use new Package ID

2. **Frontend**
   ```bash
   # Revert to previous deployment
   vercel rollback
   
   # Or redeploy specific commit
   git checkout <previous-commit>
   vercel --prod
   ```

## Maintenance

### Regular Tasks
- Monitor transaction volume
- Check error logs
- Update dependencies
- Review gas costs
- Backup configuration

### Monthly Tasks
- Security review
- Performance optimization
- User feedback review
- Feature planning
- Documentation updates

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Sui documentation: https://docs.sui.io
3. Ask in Sui Discord: https://discord.gg/sui
4. Open GitHub issue with details

---

**Remember**: Always test thoroughly on devnet before deploying to mainnet!
