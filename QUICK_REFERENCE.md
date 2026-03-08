# 📋 Sui Shop Quick Reference Card

Keep this handy while working with your marketplace!

## 🚀 Quick Start Commands

```bash
# 1. Extract and setup
unzip sui-commerce.zip
cd sui-commerce
chmod +x setup.sh

# 2. Deploy smart contract
cd move
sui move build
sui move test
sui client publish --gas-budget 100000000

# 3. Setup frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your contract addresses

# 4. Run the app
npm run dev
# Visit: http://localhost:3000
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `GETTING_STARTED.md` | **START HERE** - Complete setup guide |
| `README.md` | Project overview |
| `move/marketplace.move` | Smart contract code |
| `frontend/src/components/MarketplacePage.tsx` | Main UI |
| `docs/DEPLOYMENT.md` | Deployment guide |
| `docs/SECURITY_AUDIT.md` | Security documentation |

## 🔑 Key Addresses to Save

After deploying, save these:

```
Package ID:       0x________________
Marketplace ID:   0x________________
AdminCap ID:      0x________________
Your Address:     0x________________
```

## ⚡ Essential Sui Commands

```bash
# Check Sui version
sui --version

# Check your address
sui client active-address

# Check gas balance
sui client gas

# Switch networks
sui client switch --env testnet
sui client switch --env mainnet

# View object
sui client object <OBJECT_ID>

# Request testnet tokens
# Go to Discord: https://discord.gg/sui
# Use #testnet-faucet: /faucet YOUR_ADDRESS
```

## 🌐 Frontend Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## 🔐 Security Checklist

Before going live:
- [ ] Smart contracts tested thoroughly
- [ ] Professional security audit completed
- [ ] Admin keys stored in hardware wallet
- [ ] Environment variables configured
- [ ] Rate limits set appropriately
- [ ] Emergency procedures documented
- [ ] Legal review completed

## 📊 Network Information

**Testnet:**
- RPC: https://fullnode.testnet.sui.io:443
- Explorer: https://suiscan.xyz/testnet
- Faucet: Discord #testnet-faucet

**Mainnet:**
- RPC: https://fullnode.mainnet.sui.io:443
- Explorer: https://suiscan.xyz/mainnet
- Bridge: https://bridge.sui.io

## 💰 Estimated Costs

**Testnet:** FREE
- Gas: FREE (from faucet)
- Hosting: FREE (Vercel free tier)

**Mainnet:**
- Contract Deploy: ~0.1 SUI (~$0.10)
- Create Profile: ~0.02 SUI
- List Product: ~0.015 SUI
- Purchase: ~0.025 SUI

## 🐛 Troubleshooting

**Can't connect wallet?**
```bash
# 1. Check network matches (testnet vs mainnet)
# 2. Clear browser cache
# 3. Verify contract addresses in .env.local
# 4. Rebuild: npm run build
```

**Transaction failed?**
```bash
# 1. Check gas balance: sui client gas
# 2. Verify object IDs are correct
# 3. Check transaction: sui client tx-block <TX_DIGEST>
```

**Build errors?**
```bash
# 1. Delete node_modules: rm -rf node_modules
# 2. Reinstall: npm install
# 3. Clear cache: npm cache clean --force
```

## 📞 Support Resources

| Resource | Link |
|----------|------|
| Sui Docs | https://docs.sui.io |
| Sui Discord | https://discord.gg/sui |
| Move Docs | https://move-language.github.io/move/ |
| Sui Explorer | https://suiscan.xyz |

## 🎯 Common Tasks

**Update product price:**
```typescript
updateProductPrice(productId, newPriceInSUI)
```

**Pause marketplace (admin only):**
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function set_pause_state \
  --args <ADMIN_CAP_ID> <MARKETPLACE_ID> true \
  --gas-budget 5000000
```

**Withdraw platform fees (admin only):**
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function withdraw_fees \
  --args <ADMIN_CAP_ID> <MARKETPLACE_ID> <AMOUNT> <RECIPIENT> \
  --gas-budget 5000000
```

## 📈 Success Metrics

Track these KPIs:
- Total products listed
- Total sales volume (SUI)
- Active sellers count
- Average rating
- Platform fees collected
- Transaction success rate

## 🔄 Regular Maintenance

**Daily:** Monitor transactions, check error logs
**Weekly:** Review user feedback, update dependencies
**Monthly:** Security review, performance optimization
**Quarterly:** Feature updates, comprehensive audit

---

**Need detailed help?** Open `GETTING_STARTED.md`  
**Security questions?** Read `docs/SECURITY_AUDIT.md`  
**Ready to deploy?** Follow `docs/DEPLOYMENT.md`

**Version 1.0.0** | February 2026
