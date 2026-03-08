# 🚀 Getting Started with Sui Shop

Welcome! This guide will walk you through setting up and deploying your Sui Shop social commerce platform from scratch.

## 📦 What You Have

You've received a complete, production-ready web3 marketplace with:
- **Smart Contracts**: Security-hardened Move code for Sui blockchain
- **Frontend**: Modern Next.js + React application
- **Documentation**: Complete deployment and user guides
- **Security**: Enterprise-grade protection against common attacks

## ⚡ Quick Start (5 Minutes)

### Step 1: Extract the Files

```bash
# Unzip the archive
unzip sui-commerce.zip
cd sui-commerce

# Make setup script executable
chmod +x setup.sh
```

### Step 2: Choose Your Path

**Path A: Just Want to See It Work? (Testnet)**
- Follow the "Fast Track Setup" below (15 minutes)
- No blockchain experience needed
- Free testnet tokens provided

**Path B: Ready for Production? (Mainnet)**
- Complete professional audit first
- See "Production Deployment" section
- Budget: ~$2000-5000 for audit

## 🎯 Fast Track Setup (Testnet)

### Prerequisites Installation

**1. Install Node.js** (if not installed)
```bash
# Check if you have Node.js
node --version  # Should be 18 or higher

# If not, download from: https://nodejs.org/
# Choose the LTS (Long Term Support) version
```

**2. Install Sui CLI**
```bash
# For macOS/Linux
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# For Windows, follow: https://docs.sui.io/build/install

# Verify installation
sui --version
```

**3. Set Up Sui Wallet**
```bash
# Create a new wallet address
sui client new-address ed25519

# This will show you your address - SAVE IT!
# Example: 0x1234567890abcdef...

# Export your address for easy access
export SUI_ADDRESS=$(sui client active-address)
```

**4. Get Testnet Tokens (FREE)**
```bash
# Join Sui Discord: https://discord.gg/sui
# Go to #testnet-faucet channel
# Type: /faucet YOUR_ADDRESS_HERE

# Or use the web faucet:
# https://discord.com/channels/916379725201563759/971488439931392130

# Check your balance
sui client gas
```

### Deploy Smart Contracts (5 Minutes)

```bash
# Navigate to Move directory
cd move

# Build the contracts
sui move build

# You should see:
# BUILDING sui_commerce
# Successfully verified dependencies on-chain against source.

# Run tests to verify everything works
sui move test

# Deploy to testnet (this costs ~0.1 SUI in gas)
sui client publish --gas-budget 100000000
```

**IMPORTANT**: After deployment, you'll see output like this:

```
╭───────────────────────────────────────────────────────────╮
│ Package ID: 0xabc123def456...                             │
├───────────────────────────────────────────────────────────┤
│ Created Objects:                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Marketplace (Shared Object)                         │ │
│  │   ID: 0xdef456ghi789...                             │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ AdminCap (Owned Object)                             │ │
│  │   ID: 0xghi789jkl012...                             │ │
│  └─────────────────────────────────────────────────────┘ │
╰───────────────────────────────────────────────────────────╯
```

**COPY AND SAVE THESE VALUES** - you'll need them next!

### Set Up Frontend (5 Minutes)

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies (this may take 2-3 minutes)
npm install

# Create environment configuration
cp .env.example .env.local

# Edit the configuration file
nano .env.local
# (or use your preferred text editor: code .env.local, vim .env.local, etc.)
```

**In `.env.local`, add your values:**
```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=0xabc123def456...  # Your Package ID
NEXT_PUBLIC_MARKETPLACE_OBJECT=0xdef456ghi789...   # Your Marketplace Object ID
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save the file (Ctrl+X, then Y, then Enter in nano).

### Launch the App! (1 Minute)

```bash
# Build the application
npm run build

# Start the development server
npm run dev
```

**🎉 Success!** Visit: http://localhost:3000

You should see your marketplace!

### First Steps in Your Marketplace

**1. Connect Your Wallet**
- Install [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet) Chrome extension
- Import your wallet using the recovery phrase from earlier
- Click "Connect Wallet" on the site
- Approve the connection

**2. Create Your Seller Profile**
- Click "Become a Seller"
- Enter a display name and bio
- Approve the transaction in your wallet
- Wait for confirmation (~1 second)

**3. List Your First Product**
- Click "List Product"
- Fill in:
  - Title: "Test NFT Art"
  - Description: "Beautiful digital artwork"
  - Price: "1.0" (SUI)
  - Category: "art"
  - Image URL: Use any public image URL (e.g., from Imgur)
- Submit and approve transaction

**4. Test Purchasing**
- Create a second wallet address: `sui client new-address ed25519`
- Get testnet tokens for it
- Switch to that address in Sui Wallet
- Buy the product you listed
- Check that you received a Purchase Receipt NFT!

## 📁 Project Structure

```
sui-commerce/
│
├── 📄 README.md                    ← Start here for overview
├── 📄 CHECKLIST.md                 ← Pre-deployment checklist
├── 📄 setup.sh                     ← Quick setup script
│
├── 📂 move/                        ← Smart Contracts
│   ├── marketplace.move           ← Main contract (800+ lines)
│   └── Move.toml                  ← Sui package config
│
├── 📂 frontend/                    ← Web Application
│   ├── src/
│   │   ├── components/            ← UI components
│   │   ├── hooks/                 ← Blockchain interactions
│   │   ├── utils/                 ← Security utilities
│   │   ├── config/                ← Configuration
│   │   └── pages/                 ← Next.js pages
│   ├── package.json
│   └── .env.example               ← Configuration template
│
└── 📂 docs/                        ← Documentation
    ├── DEPLOYMENT.md              ← Detailed deployment guide
    ├── SECURITY_AUDIT.md          ← Security analysis
    ├── USER_GUIDE.md              ← End-user documentation
    └── PROJECT_OVERVIEW.md        ← Architecture details
```

## 🔧 Common Issues & Solutions

### Issue: "sui: command not found"
**Solution**: Sui CLI not installed
```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

### Issue: "Insufficient gas"
**Solution**: Get more testnet tokens
```bash
# Request from Discord faucet: https://discord.gg/sui
# Channel: #testnet-faucet
# Command: /faucet YOUR_ADDRESS
```

### Issue: "npm install fails"
**Solution**: Node version too old
```bash
# Check version
node --version

# Update to Node 18+ from: https://nodejs.org/
```

### Issue: "Wallet won't connect"
**Solution**: Wrong network
```bash
# Make sure:
# 1. Sui Wallet is set to "Testnet" (not Mainnet)
# 2. .env.local has NEXT_PUBLIC_NETWORK=testnet
# 3. Clear browser cache and reload
```

### Issue: "Transaction failed"
**Solution**: Contract address incorrect
```bash
# Verify you copied the correct addresses from deployment output
# Check .env.local matches your deployment
# Rebuild: npm run build
```

### Issue: "Build warnings"
**Solution**: Usually safe to ignore
```bash
# TypeScript warnings about unused variables are normal
# The app will still work
# Only worry about ERROR messages (red), not warnings (yellow)
```

## 📚 Next Steps

### Learning Resources
1. **Understand the Code**
   - Read `docs/PROJECT_OVERVIEW.md` for architecture
   - Review `move/marketplace.move` for smart contract logic
   - Check `frontend/src/hooks/useSuiTransactions.ts` for blockchain interactions

2. **Customize Your Marketplace**
   - Change colors in `frontend/src/components/MarketplacePage.tsx`
   - Modify platform fee in smart contract
   - Add new categories

3. **Security Deep Dive**
   - Read `docs/SECURITY_AUDIT.md`
   - Understand each security layer
   - Learn about common web3 vulnerabilities

### Before Going to Mainnet
- [ ] Run for 1-2 months on testnet
- [ ] Get professional security audit ($2000-5000)
- [ ] Launch bug bounty program
- [ ] Complete legal review
- [ ] Set up monitoring and alerts
- [ ] Prepare emergency procedures
- [ ] Read `docs/DEPLOYMENT.md` fully

### Extending the Platform
Ideas for additional features:
- IPFS integration for decentralized image storage
- Mobile app (React Native)
- Advanced search and filters
- Escrow system for high-value items
- Dispute resolution mechanism
- Multi-currency support
- Analytics dashboard

## 💰 Cost Breakdown

### Testnet (Learning/Testing)
- **Smart Contract Deployment**: FREE (testnet tokens)
- **Frontend Hosting**: FREE (Vercel free tier)
- **Total**: $0

### Mainnet (Production)
- **Smart Contract Deployment**: ~0.1 SUI (~$0.10)
- **Security Audit**: $2,000 - $5,000
- **Frontend Hosting**: $0-20/month (Vercel/Netlify)
- **Domain**: $10-15/year
- **Legal Review**: $500-2,000 (recommended)
- **Total Initial**: $2,500 - $7,000

### Per Transaction Costs
- **Listing Product**: ~0.015 SUI (~$0.015)
- **Purchasing**: ~0.025 SUI (~$0.025)
- **Platform Fee**: 2% of sale price (your revenue)

## 🆘 Getting Help

### Documentation
- Start with the README in each folder
- Check `docs/` folder for detailed guides
- All functions are documented with comments

### Community Support
- [Sui Discord](https://discord.gg/sui) - Active community
- [Sui Documentation](https://docs.sui.io) - Official docs
- [GitHub Issues](https://github.com/MystenLabs/sui/issues) - Sui blockchain issues

### Professional Help
For production deployment:
- Smart contract audits: [Ottersec](https://osec.io/), [MoveBit](https://movebit.xyz/)
- Legal: Crypto-specialized law firms
- DevOps: Web3 infrastructure providers

## ✅ Success Checklist

You know you're ready when:
- [ ] Smart contracts deployed successfully
- [ ] Frontend loads without errors
- [ ] Can connect wallet
- [ ] Can create seller profile
- [ ] Can list products
- [ ] Can purchase products
- [ ] Can leave reviews
- [ ] Understand the security features
- [ ] Read the documentation

## 🎓 Learning Path

**Week 1: Setup & Testing**
- Deploy to testnet
- Test all features
- Invite friends to test
- Collect feedback

**Week 2-3: Customization**
- Modify UI to match your brand
- Adjust categories for your niche
- Test edge cases
- Fix any bugs

**Week 4-8: Community Building**
- Share on social media
- Get user feedback
- Iterate on features
- Build trust

**Month 3+: Production Planning**
- Security audit
- Legal review
- Marketing strategy
- Mainnet deployment

## 🚀 You're Ready!

You now have everything you need to:
1. ✅ Deploy a working marketplace on testnet
2. ✅ Understand how it works
3. ✅ Customize it for your needs
4. ✅ Plan for production

**Start with Step 1** above and you'll be running in 15 minutes!

Questions? Check the documentation in the `docs/` folder or the common issues section above.

Good luck with your marketplace! 🎉

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**License**: MIT  
**Support**: See documentation for help resources
