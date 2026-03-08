# Sui Shop - Security-Hardened Social Commerce Platform

A production-ready, security-first decentralized marketplace built on Sui blockchain with comprehensive protection against common web3 vulnerabilities.

## 🛡️ Security Features

### Smart Contract Security (Move)
- **Formal Verification**: Leverages Move's built-in safety guarantees
- **Role-Based Access Control**: Admin capabilities separated from user functions
- **Reentrancy Protection**: Built into Move's resource model
- **Input Validation**: All parameters validated before processing
- **Emergency Pause**: Circuit breaker for critical situations
- **Rate Limiting**: Prevents spam and abuse at contract level
- **Event Emission**: Full audit trail of all operations
- **Protected Transfers**: Type-safe object ownership

### Frontend Security (React/Next.js)
- **Input Sanitization**: DOMPurify for XSS prevention
- **Schema Validation**: Zod for runtime type checking
- **URL Validation**: Prevents SSRF and malicious redirects
- **Rate Limiting**: Client-side transaction throttling
- **Secure Error Handling**: No sensitive data in error messages
- **Transaction Timeouts**: Prevents hanging transactions
- **Content Security**: Spam and profanity detection
- **Safe File Handling**: Image validation and secure naming

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Sui CLI installed ([Installation Guide](https://docs.sui.io/build/install))
- Sui wallet (Sui Wallet, Ethos, or Suiet)

### 1. Deploy Smart Contracts

```bash
cd move

# Build the package
sui move build

# Test the contracts
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000

# Save the Package ID and Marketplace Object ID from the output
```

### 2. Configure Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your deployed addresses
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=<your-package-id>
NEXT_PUBLIC_MARKETPLACE_OBJECT=<your-marketplace-object-id>
```

### 3. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and connect your Sui wallet!

## 📝 Key Functions

### User Operations
- `create_seller_profile` - Create a seller profile
- `list_product` - List a new product for sale
- `purchase_product` - Buy a product
- `post_review` - Leave a review
- `follow_seller` - Follow a seller

### Admin Operations (Require AdminCap)
- `set_pause_state` - Emergency pause
- `set_seller_ban_status` - Ban/unban sellers
- `update_platform_fee` - Adjust platform fee
- `withdraw_fees` - Withdraw accumulated fees

## 🔒 Security Best Practices

### For Developers
1. **Never expose private keys** in code or version control
2. **Validate all inputs** before blockchain interactions
3. **Use rate limiting** for transaction-heavy operations
4. **Implement proper error handling**
5. **Test thoroughly** on testnet before mainnet

### For Users
1. **Verify contract addresses** before interacting
2. **Check transaction details** before signing
3. **Use hardware wallets** for significant holdings
4. **Beware of phishing** - always verify URLs

## 🛠️ Technology Stack

- **Blockchain**: Sui Network
- **Smart Contracts**: Move Language
- **Frontend**: Next.js 14, React 18
- **Wallet Integration**: @mysten/dapp-kit
- **Styling**: Tailwind CSS
- **Security**: DOMPurify, Zod, Custom validators

## 📊 Platform Features

### For Sellers
- Professional seller profiles
- List unlimited products
- Track sales and revenue
- Build follower base
- Instant payments

### For Buyers
- Browse categorized products
- Instant purchase with SUI
- Leave verified reviews
- Follow favorite sellers
- Purchase receipt NFTs

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Always test on testnet before using real funds.

---

Built with ❤️ on Sui Blockchain
# sui-shop
