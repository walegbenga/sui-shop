# User Guide - Sui Shop

Complete guide for buyers, sellers, and administrators using Sui Shop.

## Table of Contents
1. [Getting Started](#getting-started)
2. [For Buyers](#for-buyers)
3. [For Sellers](#for-sellers)
4. [For Administrators](#for-administrators)
5. [Security Tips](#security-tips)
6. [FAQ](#faq)

## Getting Started

### 1. Set Up Your Wallet

**Option A: Sui Wallet (Recommended)**
1. Install [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet) Chrome extension
2. Create a new wallet or import existing
3. **CRITICAL**: Back up your recovery phrase securely
4. Never share your recovery phrase with anyone

**Option B: Other Wallets**
- Ethos Wallet
- Suiet Wallet
- Martian Wallet

### 2. Get Testnet SUI

For testing on testnet:
1. Join [Sui Discord](https://discord.gg/sui)
2. Go to #testnet-faucet channel
3. Type: `/faucet <YOUR_WALLET_ADDRESS>`
4. Wait for tokens to arrive (usually instant)

### 3. Connect to Sui Shop

1. Visit the marketplace URL
2. Click "Connect Wallet"
3. Select your wallet
4. Approve the connection
5. You're ready to start!

## For Buyers

### Browsing Products

**Filter by Category**:
- Click category buttons at the top
- Categories: Art, Collectibles, Gaming, Fashion, Tech

**View Product Details**:
- Product image and description
- Current price in SUI
- Seller information
- Rating (if reviewed)
- Total sales count

### Purchasing a Product

1. **Find a Product**:
   - Browse or search for products
   - Check product details and seller reputation

2. **Review the Purchase**:
   - Verify the price
   - Check seller's rating and sales history
   - Read existing reviews

3. **Complete Purchase**:
   - Click "Buy Now"
   - Review transaction details in wallet
   - Approve the transaction
   - Wait for confirmation (usually instant)

4. **Receive Receipt**:
   - You'll receive a Purchase Receipt NFT
   - This NFT proves your purchase
   - Keep it to leave a review later

**Transaction Breakdown**:
```
Product Price:     10.0000 SUI
Platform Fee (2%):  0.2000 SUI
Total Paid:        10.2000 SUI
Seller Receives:    9.8000 SUI
```

### Leaving Reviews

**Eligibility**: You must have purchased the product to review it.

1. **Access Review Form**:
   - Go to the product page
   - Click "Write Review"

2. **Submit Review**:
   - Rate 1-5 stars
   - Write detailed comment (10-1000 characters)
   - Submit transaction
   - Your review will be marked as "Verified Purchase"

**Review Guidelines**:
- Be honest and constructive
- Focus on product quality
- Mention both pros and cons
- Don't include personal information
- No spam or profanity

### Following Sellers

1. Visit seller's profile
2. Click "Follow"
3. See their products in your feed
4. Get notified of new listings (future feature)

## For Sellers

### Creating Your Seller Profile

1. **Connect Wallet**: Connect your Sui wallet first

2. **Create Profile**:
   - Click "Become a Seller"
   - Enter display name (2-50 characters)
   - Write bio (max 500 characters)
   - Submit transaction

3. **Profile Information**:
   - Your profile shows:
     - Total sales
     - Total revenue
     - Products listed
     - Follower count
     - Verification level

### Listing a Product

1. **Prepare Product Information**:
   - Title (1-100 characters, alphanumeric)
   - Description (10-1000 characters)
   - Price (minimum 0.000001 SUI)
   - Category
   - Image URL (must be valid HTTPS)

2. **Create Listing**:
   - Click "List Product"
   - Fill in all required fields
   - Review information carefully
   - Submit transaction

3. **Image Requirements**:
   - Format: JPG, PNG, GIF, or WebP
   - Size: Recommended max 5MB
   - Ratio: Square images (1:1) work best
   - Quality: High resolution recommended

**Listing Limits**:
- Maximum 10 products per hour (anti-spam)
- First 1000 listings free on testnet

### Managing Your Products

**Update Availability**:
```typescript
// Mark product as sold/unavailable
updateProductAvailability(productId, false)
```

**Update Price**:
```typescript
// Change product price
updateProductPrice(productId, newPriceInSUI)
```

**Note**: You cannot edit title or description after listing.

### Best Practices for Sellers

1. **High-Quality Images**:
   - Use clear, well-lit photos
   - Show product from multiple angles
   - Use consistent image style

2. **Detailed Descriptions**:
   - Be accurate and honest
   - Include dimensions/specifications
   - Mention condition (new/used)
   - Set realistic expectations

3. **Competitive Pricing**:
   - Research similar products
   - Factor in platform fee (2%)
   - Consider market demand

4. **Customer Service**:
   - Respond to questions promptly
   - Ship quickly (for physical items)
   - Handle issues professionally
   - Maintain high ratings

### Understanding Fees

**Platform Fee**: 2% of sale price
- Deducted automatically from each sale
- Goes to platform treasury
- Used for development and maintenance

**Example Sale**:
```
Item sells for:     100 SUI
Platform fee (2%):    2 SUI
You receive:         98 SUI
```

## For Administrators

### Admin Capabilities

Administrators have special permissions through the `AdminCap` object.

### Emergency Controls

**Pause Marketplace**:
```move
set_pause_state(admin_cap, marketplace, true)
```
Use this if:
- Critical bug discovered
- Security incident
- Network issues
- Planned maintenance

**Resume Operations**:
```move
set_pause_state(admin_cap, marketplace, false)
```

### Seller Management

**Ban a Seller**:
```move
set_seller_ban_status(admin_cap, marketplace, seller_address, true)
```

Reasons to ban:
- Fraudulent products
- Repeated violations
- Scam attempts
- Illegal content

**Unban a Seller**:
```move
set_seller_ban_status(admin_cap, marketplace, seller_address, false)
```

### Platform Configuration

**Update Platform Fee**:
```move
update_platform_fee(admin_cap, marketplace, new_fee_bps)
```

- Fee in basis points (200 = 2%)
- Maximum: 1000 (10%)
- Affects future sales only

**Withdraw Platform Fees**:
```move
withdraw_fees(admin_cap, marketplace, amount, recipient_address)
```

- Withdraw accumulated fees
- Specify amount in MIST
- Send to treasury address

### Monitoring

**Key Metrics to Track**:
- Total products listed
- Total sales volume
- Active sellers
- Transaction failures
- User complaints
- Average transaction value

**Use Sui Explorer**:
- Monitor marketplace events
- Track gas usage
- View transaction history
- Check object states

## Security Tips

### For All Users

1. **Wallet Security**:
   - ✅ Use hardware wallet for large amounts
   - ✅ Enable 2FA on wallet accounts
   - ✅ Keep recovery phrase offline
   - ❌ Never share private keys
   - ❌ Don't click suspicious links

2. **Transaction Safety**:
   - ✅ Verify contract address
   - ✅ Check transaction details before signing
   - ✅ Start with small amounts
   - ✅ Use official website only
   - ❌ Don't approve unlimited allowances

3. **Phishing Protection**:
   - ✅ Bookmark official URL
   - ✅ Check URL before connecting wallet
   - ✅ Verify SSL certificate (HTTPS)
   - ❌ Don't trust DMs offering support
   - ❌ Never enter seed phrase on websites

### For Sellers

1. **Protect Your Business**:
   - Use separate wallet for selling
   - Withdraw funds regularly
   - Keep records of all sales
   - Monitor for suspicious activity

2. **Avoid Scams**:
   - Don't accept off-platform payments
   - Beware of fake buyer messages
   - Don't share personal information

### For Buyers

1. **Verify Before Buying**:
   - Check seller's rating and history
   - Read recent reviews
   - Verify product authenticity
   - Compare prices

2. **Protect Yourself**:
   - Only buy what you can afford to lose
   - Keep Purchase Receipt NFTs
   - Report suspicious listings
   - Leave honest reviews

## FAQ

### General Questions

**Q: What is Sui Shop?**
A: A decentralized marketplace on Sui blockchain where users can buy and sell digital assets with complete transparency and security.

**Q: What can I buy/sell?**
A: Currently supports digital goods and NFTs. Categories include art, collectibles, gaming items, and more.

**Q: How do I get SUI?**
A: Buy on exchanges (Binance, OKX, etc.) or get testnet SUI from the faucet for testing.

**Q: Is my data private?**
A: All transactions are public on the blockchain. Personal information is not stored on-chain.

### Transaction Questions

**Q: How long do transactions take?**
A: Sui transactions finalize in under 1 second typically.

**Q: Can I cancel a purchase?**
A: No, blockchain transactions are irreversible once confirmed.

**Q: What if I sent too much SUI?**
A: Excess payment is automatically refunded in the same transaction.

**Q: What happens if a transaction fails?**
A: You keep your SUI, and can try again. Check error message for details.

### Seller Questions

**Q: How do I get paid?**
A: Instantly! Payment goes directly to your wallet when buyer completes purchase.

**Q: Can I edit my listing?**
A: You can update price and availability, but not title/description.

**Q: How do I ship physical items?**
A: This version is for digital goods only. Physical item features coming soon.

**Q: What if I make a mistake in my listing?**
A: Mark it unavailable and create a new listing with correct information.

### Buyer Questions

**Q: How do I know if a seller is trustworthy?**
A: Check their rating, number of sales, and read reviews from verified purchasers.

**Q: What if product doesn't match description?**
A: Leave an honest review. Future versions will include dispute resolution.

**Q: Can I resell items I purchase?**
A: Depends on the item type. Some NFTs can be relisted on the marketplace.

**Q: Do I need crypto experience?**
A: Basic wallet setup knowledge is helpful, but the interface is designed to be user-friendly.

### Technical Questions

**Q: Which wallets are supported?**
A: Sui Wallet, Ethos, Suiet, and other Sui-compatible wallets.

**Q: What are gas fees?**
A: Small fees paid to blockchain validators. Usually less than $0.01 on Sui.

**Q: Is the code open source?**
A: Yes, all code is available on GitHub for transparency and security review.

**Q: Has the code been audited?**
A: Self-audited currently. Professional audit recommended before mainnet launch.

## Getting Help

### Support Channels

1. **Documentation**: Read this guide and other docs
2. **GitHub Issues**: Report bugs or request features
3. **Discord**: Join community for help
4. **Email**: support@suimarket.example (update with real email)

### Reporting Issues

**For Bugs**:
1. Check if already reported
2. Include steps to reproduce
3. Add screenshots if possible
4. Note your wallet type and browser

**For Scams**:
1. Report to admin immediately
2. Provide seller address
3. Include transaction details
4. Save all evidence

### Emergency Contacts

**Critical Security Issue**:
- Email: security@suimarket.example (update)
- Discord: @admin (update)
- Response time: < 1 hour for critical issues

---

**Last Updated**: February 2026
**Version**: 1.0.0

Need more help? Join our [Discord community](https://discord.gg/suimarket)!
