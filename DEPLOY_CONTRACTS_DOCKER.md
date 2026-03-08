# 🐳 Deploy Sui Contracts with Docker

Complete guide to deploy your Move smart contracts to Sui testnet using Docker.

---

## 🎯 What This Does

**Deploys your smart contracts to Sui testnet** in a Docker container with:
- ✅ Sui CLI pre-installed
- ✅ Automatic wallet creation
- ✅ Test token requests
- ✅ Contract compilation
- ✅ Deployment to testnet
- ✅ Package ID extraction

**No need to install Sui CLI on your machine!** Everything runs in Docker.

---

## 🚀 Quick Start (10 Minutes)

### **One-Command Deployment:**

```bash
cd sui-commerce
./deploy-sui-contracts.sh
```

**That's it!** The script does everything automatically.

---

## 📋 Step-by-Step Guide

### **Step 1: Make Sure Docker is Running**

```bash
# Check Docker
docker --version

# Should show: Docker version 24.x.x
```

If not installed, download: https://www.docker.com/products/docker-desktop

---

### **Step 2: Navigate to Project**

```bash
cd sui-commerce
```

---

### **Step 3: Run Deployment Script**

```bash
./deploy-sui-contracts.sh
```

**What happens:**

```
🐳 Sui Shop - Contract Deployment
==================================

✅ Docker is running

🔨 Building Sui deployment container...
   This will take 5-10 minutes (first time only)

   [Building Rust environment...]
   [Installing Sui CLI...]
   [Setting up container...]

✅ Container built successfully

🚀 Starting deployment container...

📍 Inside deployment container

🔧 Initializing Sui client...
✅ Client initialized

👛 Setting up wallet...
📝 Creating new wallet address...
✅ Wallet created: 0x1234...abcd

🌐 Switching to testnet...
✅ Switched to testnet

💰 Requesting test SUI tokens from faucet...
✅ Received 1.0 SUI

💵 Checking balance...
   Gas objects: 1.0 SUI available

🔨 Building Move contracts...
   [Compiling marketplace.move...]
✅ Build successful!

🚀 Deploying to Sui testnet...
   Gas budget: 100000000 (0.1 SUI)
   
   [Transaction executing...]
   
✅ Deployment successful!

📦 Package ID: 0xabcd1234...

✅ Saved deployment info to: move/deployed_testnet.env

📋 Next steps:

1. Copy the Package ID above

2. Update your frontend .env.local:
   NEXT_PUBLIC_PACKAGE_ID=0xabcd1234...
   NEXT_PUBLIC_SUI_NETWORK=testnet

3. Restart your frontend:
   docker-compose restart frontend

4. Your contracts are now live on Sui testnet! 🎉

💡 Your wallet address (save this):
   0x1234...abcd

   Fund it here: https://faucet.testnet.sui.io
   View on explorer: https://suiexplorer.com/?network=testnet

✅ Done!
```

---

## 📊 What Gets Deployed

### **Your Smart Contracts:**

```
Sui Testnet
├── Marketplace Contract
│   ├── create_product()
│   ├── purchase_product()
│   ├── add_review()
│   ├── follow_seller()
│   └── update_profile()
│
├── Product Objects (Shared)
├── Review Objects (Shared)
├── Receipt NFTs (Owned)
└── Profile Objects (Owned)
```

### **After Deployment:**

```
move/deployed_testnet.env (Created)
├── NEXT_PUBLIC_PACKAGE_ID=0xabc...
├── NEXT_PUBLIC_SUI_NETWORK=testnet
└── DEPLOYED_AT=2024-02-07T12:00:00Z
```

---

## 🔧 Manual Deployment (Advanced)

If you want more control:

### **Step 1: Build Container**

```bash
docker-compose -f docker-compose-deploy.yml build
```

### **Step 2: Run Interactive Shell**

```bash
docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash
```

### **Step 3: Inside Container**

```bash
# Initialize Sui (if first time)
sui client

# Create wallet
sui client new-address ed25519

# Switch to testnet
sui client switch --env testnet

# Check address
sui client active-address

# Request tokens
sui client faucet

# Check balance
sui client gas

# Build contracts
cd /contracts
sui move build

# Deploy
sui client publish --gas-budget 100000000

# Save the Package ID from output!
```

### **Step 4: Exit Container**

```bash
exit
```

---

## 📝 Update Frontend with Package ID

### **After Deployment:**

1. **Copy Package ID** from deployment output
   ```
   Package ID: 0xabcd1234567890...
   ```

2. **Update frontend/.env.local:**
   ```bash
   cd frontend
   nano .env.local
   
   # Add these lines:
   NEXT_PUBLIC_PACKAGE_ID=0xabcd1234567890...
   NEXT_PUBLIC_SUI_NETWORK=testnet
   ```

3. **Restart frontend:**
   ```bash
   docker-compose restart frontend
   ```

4. **Test it:**
   ```
   http://localhost:3000
   → Connect wallet
   → Should interact with deployed contracts!
   ```

---

## 🎯 Verification

### **Verify Deployment on Sui Explorer:**

1. **Go to Sui Explorer:**
   ```
   https://suiexplorer.com/?network=testnet
   ```

2. **Search for your Package ID:**
   ```
   Paste: 0xabcd1234...
   ```

3. **You should see:**
   - ✅ Package details
   - ✅ Module: marketplace
   - ✅ Functions listed
   - ✅ Transaction history

---

## 🔄 Redeployment

**To redeploy (after changes):**

```bash
# 1. Update your Move code
nano move/marketplace.move

# 2. Run deployment again
./deploy-sui-contracts.sh

# 3. Update Package ID in frontend
# (You'll get a NEW Package ID)

# 4. Restart frontend
docker-compose restart frontend
```

**Note:** Each deployment creates a NEW package with a NEW Package ID!

---

## 💾 Wallet Persistence

### **Your Wallet is Saved in Docker Volume:**

```bash
# See wallet volume
docker volume ls | grep sui-wallet

# Your wallet persists between deployments!
# Same wallet = same address
```

### **Export Wallet (for backup):**

```bash
# Enter container
docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash

# Export wallet
cat ~/.sui/sui_config/client.yaml

# Copy the contents and save securely!

exit
```

### **Import Wallet (on another machine):**

```bash
# 1. Start container
docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash

# 2. Create config directory
mkdir -p ~/.sui/sui_config

# 3. Paste your saved client.yaml
nano ~/.sui/sui_config/client.yaml
# Paste contents, save

# 4. Now you have same wallet!
sui client active-address
```

---

## 🐛 Troubleshooting

### **Problem: Container build fails**

```bash
# Check Docker resources
# Docker Desktop → Settings → Resources
# Recommended: 4GB RAM, 2GB Swap

# Try building again
docker-compose -f docker-compose-deploy.yml build --no-cache
```

---

### **Problem: Not enough gas**

```
Error: InsufficientGas
```

**Solution:**

```bash
# Enter container
docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash

# Request more tokens
sui client faucet

# Wait 30 seconds, try again
sui client faucet

# Check balance
sui client gas

# Try deployment again
sui client publish --gas-budget 100000000
```

---

### **Problem: Network timeout**

```
Error: Connection timeout
```

**Solution:**

```bash
# Check internet connection
ping sui.io

# Try again (network might be temporarily down)
./deploy-sui-contracts.sh

# Or increase timeout in deployment script
```

---

### **Problem: Build errors**

```
Error: Unexpected token
```

**Solution:**

```bash
# Check your Move code syntax
nano move/marketplace.move

# Common issues:
# - Missing semicolons
# - Incorrect types
# - Import errors

# Test build locally
docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash
cd /contracts
sui move build

# Fix errors shown
```

---

## 📊 Deployment Checklist

### **Pre-Deployment:**
- [ ] Docker Desktop running
- [ ] In `sui-commerce` directory
- [ ] Move contracts in `move/` folder
- [ ] No syntax errors in Move code

### **During Deployment:**
- [ ] Build completes (5-10 min first time)
- [ ] Wallet created
- [ ] Test tokens received
- [ ] Contracts build successfully
- [ ] Deployment succeeds

### **Post-Deployment:**
- [ ] Package ID saved
- [ ] `deployed_testnet.env` file created
- [ ] Frontend `.env.local` updated
- [ ] Frontend restarted
- [ ] Verified on Sui Explorer
- [ ] Wallet address saved

---

## 🎯 Quick Commands Reference

```bash
# Deploy contracts
./deploy-sui-contracts.sh

# Enter deployment container
docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash

# Check wallet inside container
sui client active-address
sui client gas

# Request more test tokens
sui client faucet

# Build contracts
sui move build

# Deploy contracts
sui client publish --gas-budget 100000000

# View wallet config
cat ~/.sui/sui_config/client.yaml

# Clean up (remove wallet)
docker-compose -f docker-compose-deploy.yml down -v
```

---

## 💰 Gas Costs

**Testnet (Free!):**
- Deployment: ~0.05-0.1 SUI
- Test tokens: FREE from faucet
- Transactions: ~0.001 SUI each

**Mainnet (Real SUI):**
- Deployment: ~0.05-0.1 SUI (~$0.50-1.00)
- Transactions: ~0.001 SUI (~$0.01)

**For testnet:** Use faucet, it's unlimited!

---

## 🔐 Security Notes

### **Testnet Wallet:**
- ✅ Safe for testing
- ✅ No real value
- ✅ Can be recreated anytime

### **Mainnet Wallet:**
- ⚠️ Has real value!
- ⚠️ Backup seed phrase
- ⚠️ Never share private keys
- ⚠️ Use hardware wallet for large amounts

**For mainnet deployment:**
- Use secure environment
- Backup wallet properly
- Test thoroughly on testnet first
- Consider professional audit

---

## 🎓 Understanding Sui Deployment

### **What is a Package?**

```
Package = Collection of Move modules
├── Module: marketplace
├── Module: product (if separate)
└── Module: review (if separate)

Each deployment creates NEW package with NEW ID
```

### **Package ID vs Object ID:**

```
Package ID: 0xabc123... (immutable code)
└── Creates objects:
    ├── Marketplace: 0xdef456... (shared object)
    ├── Product: 0x789abc... (created later)
    └── Review: 0x012def... (created later)
```

### **Testnet vs Mainnet:**

```
Testnet:
- Free tokens
- Testing environment
- Data may be wiped
- Same code as mainnet

Mainnet:
- Real SUI tokens
- Production environment
- Permanent data
- Real transactions
```

---

## ✅ Success Criteria

**You know deployment succeeded when:**

1. ✅ Script completes without errors
2. ✅ Package ID displayed (0x...)
3. ✅ `deployed_testnet.env` file created
4. ✅ Can see package on Sui Explorer
5. ✅ Frontend connects to contracts

**Test it:**
```bash
# Frontend should show deployed package
curl http://localhost:3000/api/config

# Should return:
{
  "packageId": "0xabc123...",
  "network": "testnet"
}
```

---

## 🚀 Next Steps

**After successful deployment:**

1. **Test Contracts:**
   - Connect wallet extension
   - Try creating a product
   - Try purchasing
   - Check on Sui Explorer

2. **Update Documentation:**
   - Save Package ID
   - Note wallet address
   - Document any custom configs

3. **Share Testnet:**
   - Give Package ID to teammates
   - They can interact with your contracts
   - Collaborative testing!

4. **Prepare for Mainnet:**
   - Test thoroughly
   - Get security audit
   - Prepare real SUI tokens
   - Deploy to mainnet (same process!)

---

## 📚 Additional Resources

**Sui Documentation:**
- CLI: https://docs.sui.io/build/cli-client
- Move: https://docs.sui.io/build/move
- Testnet: https://docs.sui.io/build/sui-testnet

**Tools:**
- Faucet: https://faucet.testnet.sui.io
- Explorer: https://suiexplorer.com
- Wallet: https://sui.io/wallet

**Community:**
- Discord: https://discord.gg/sui
- Forum: https://forums.sui.io
- Twitter: @SuiNetwork

---

## ✨ Summary

**You can now:**
- ✅ Deploy contracts with one command
- ✅ No Sui CLI installation needed
- ✅ Everything runs in Docker
- ✅ Automatic wallet creation
- ✅ Testnet deployment in 10 minutes
- ✅ Package ID saved automatically

**Just run:**
```bash
./deploy-sui-contracts.sh
```

**And you're live on Sui testnet!** 🎉

---

**Questions about deployment? Check the troubleshooting section or ask!** 💬
