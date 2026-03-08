# Smart Contract API Documentation

## Overview

The Sui Commerce marketplace smart contract provides a secure, decentralized platform for buying and selling products with integrated review functionality.

## Data Structures

### Platform
```move
struct Platform has key {
    id: UID,
    admin: address,
    treasury: Balance<SUI>,
    total_sales: u64,
    total_products: u64,
    platform_fee_bps: u64, // Basis points (200 = 2%)
}
```

### SellerProfile
```move
struct SellerProfile has key, store {
    id: UID,
    owner: address,
    display_name: String,
    total_sales: u64,
    total_reviews: u64,
    average_rating: u64,
    created_at: u64,
    is_verified: bool,
}
```

### Product
```move
struct Product has key, store {
    id: UID,
    seller: address,
    name: String,
    description: String,
    price: u64,                    // Price in MIST
    quantity_available: u64,
    total_sold: u64,
    is_active: bool,
    created_at: u64,
    updated_at: u64,
    category: String,
    review_count: u64,
    total_rating_sum: u64,
}
```

### PurchaseReceipt
```move
struct PurchaseReceipt has key, store {
    id: UID,
    product_id: ID,
    buyer: address,
    seller: address,
    amount_paid: u64,
    platform_fee: u64,
    quantity: u64,
    timestamp: u64,
}
```

## Public Functions

### Seller Functions

#### create_seller_profile
Creates a new seller profile required before listing products.

**Parameters:**
- `display_name: vector<u8>` - UTF-8 encoded display name (2-50 chars)
- `clock: &Clock` - Sui system clock object (0x6)
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Display name length validated
- ✅ One profile per address

**Example:**
```typescript
const tx = new TransactionBlock();
tx.moveCall({
  target: `${PACKAGE_ID}::marketplace::create_seller_profile`,
  arguments: [
    tx.pure(Array.from(new TextEncoder().encode("My Shop"))),
    tx.object('0x6'),
  ],
});
```

---

#### list_product
Lists a new product for sale.

**Parameters:**
- `platform: &mut Platform` - Shared platform object
- `name: vector<u8>` - Product name (3-100 chars)
- `description: vector<u8>` - Product description (10-1000 chars)
- `price: u64` - Price in MIST (must be > 0)
- `quantity: u64` - Available quantity (must be > 0)
- `category: vector<u8>` - Product category (2-50 chars)
- `clock: &Clock` - Sui system clock
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ All inputs validated
- ✅ Price bounds checked
- ✅ String lengths enforced
- ✅ Emits ProductListed event

**Gas Estimate:** ~1,500,000 MIST

**Example:**
```typescript
const tx = listProductTx({
  name: "Gaming Laptop",
  description: "High-performance gaming laptop",
  price: 500000000, // 0.5 SUI in MIST
  quantity: 5,
  category: "Electronics",
  clockId: '0x6',
});
```

---

#### update_product
Updates existing product details (seller only).

**Parameters:**
- `product: &mut Product` - Product object to update
- `new_price: u64` - New price in MIST
- `new_quantity: u64` - New quantity
- `new_description: vector<u8>` - Updated description
- `clock: &Clock` - Sui system clock
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Owner-only access (checked via `product.seller == sender`)
- ✅ Input validation
- ✅ Updates timestamp

**Errors:**
- `ENotProductOwner (0)` - Caller is not the product owner

---

#### deactivate_product
Deactivates a product listing (seller only).

**Parameters:**
- `product: &mut Product` - Product to deactivate
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Owner-only access
- ✅ Product becomes unpurchasable

---

### Buyer Functions

#### purchase_product
Purchases a product with exact payment.

**Parameters:**
- `platform: &mut Platform` - Shared platform object
- `product: &mut Product` - Product to purchase
- `payment: Coin<SUI>` - Exact payment coin
- `quantity: u64` - Quantity to purchase
- `clock: &Clock` - Sui system clock
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Product must be active
- ✅ Sufficient quantity available
- ✅ Exact payment required (prevents overpayment)
- ✅ Platform fee calculated safely
- ✅ Atomic payment split (seller + platform)
- ✅ Purchase receipt created
- ✅ Emits ProductPurchased event

**Returns:** PurchaseReceipt object (transferred to buyer)

**Errors:**
- `EProductNotForSale (2)` - Product is inactive
- `EProductSoldOut (9)` - Insufficient quantity
- `EInsufficientPayment (1)` - Payment amount incorrect
- `EPlatformFeeOverflow (8)` - Fee calculation error

**Gas Estimate:** ~2,000,000 MIST

**Example:**
```typescript
// 1. Get user's coins
const coins = await client.getCoins({
  owner: address,
  coinType: '0x2::sui::SUI',
});

// 2. Split exact payment
const tx = new TransactionBlock();
const payment = splitCoinsForPayment(
  tx, 
  coins.data.map(c => c.coinObjectId),
  productPrice * quantity
);

// 3. Purchase
tx.moveCall({
  target: `${PACKAGE_ID}::marketplace::purchase_product`,
  arguments: [
    tx.object(PLATFORM_ID),
    tx.object(productId),
    payment,
    tx.pure(quantity, 'u64'),
    tx.object('0x6'),
  ],
});
```

---

#### review_product
Leaves a verified review for a purchased product.

**Parameters:**
- `product: &mut Product` - Product to review
- `receipt: &PurchaseReceipt` - Purchase receipt for verification
- `rating: u8` - Rating (1-5)
- `comment: vector<u8>` - Review comment (10-500 chars)
- `clock: &Clock` - Sui system clock
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Must own valid purchase receipt
- ✅ Receipt must match product
- ✅ Cannot review own products
- ✅ One review per buyer per product
- ✅ Rating bounded (1-5)
- ✅ Comment length validated
- ✅ Stores review as dynamic field
- ✅ Updates product rating stats

**Errors:**
- `EInvalidRating (5)` - Rating not in 1-5 range
- `ESelfReview (6)` - Attempting to review own product
- `EAlreadyReviewed (7)` - Already reviewed this product
- `EUnauthorized (3)` - Receipt doesn't match product

---

#### create_buyer_badge
Creates a buyer badge to track purchase history.

**Parameters:**
- `clock: &Clock` - Sui system clock
- `ctx: &mut TxContext` - Transaction context

**Returns:** BuyerBadge object

---

### Admin Functions

#### withdraw_fees
Withdraws platform fees (admin only).

**Parameters:**
- `platform: &mut Platform` - Platform object
- `amount: u64` - Amount to withdraw in MIST
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Admin-only access
- ✅ Cannot withdraw more than available

**Errors:**
- `EUnauthorized (3)` - Caller is not admin

---

#### update_platform_fee
Updates platform fee percentage (admin only).

**Parameters:**
- `platform: &mut Platform` - Platform object
- `new_fee_bps: u64` - New fee in basis points (max 10000)
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Admin-only access
- ✅ Fee capped at 100% (10000 basis points)

**Errors:**
- `EUnauthorized (3)` - Caller is not admin
- `EPlatformFeeOverflow (8)` - Fee exceeds maximum

---

#### verify_seller
Verifies a seller profile (admin only).

**Parameters:**
- `platform: &Platform` - Platform object
- `profile: &mut SellerProfile` - Profile to verify
- `ctx: &mut TxContext` - Transaction context

**Security:**
- ✅ Admin-only access
- ✅ Gives seller verified badge

---

## View Functions

### get_product_rating
Gets average rating for a product.

**Parameters:**
- `product: &Product` - Product to query

**Returns:** `u64` - Average rating (0 if no reviews)

---

### get_product_details
Gets core product information.

**Parameters:**
- `product: &Product` - Product to query

**Returns:** `(address, u64, u64, bool, u64)`
- seller address
- price
- quantity available
- is active
- review count

---

### get_seller_stats
Gets seller statistics.

**Parameters:**
- `profile: &SellerProfile` - Seller profile

**Returns:** `(u64, u64, bool)`
- total sales
- average rating
- is verified

---

## Events

### ProductListed
```move
struct ProductListed has copy, drop {
    product_id: ID,
    seller: address,
    price: u64,
    timestamp: u64,
}
```

### ProductPurchased
```move
struct ProductPurchased has copy, drop {
    product_id: ID,
    buyer: address,
    seller: address,
    price: u64,
    quantity: u64,
    platform_fee: u64,
    timestamp: u64,
}
```

### ProductReviewed
```move
struct ProductReviewed has copy, drop {
    product_id: ID,
    reviewer: address,
    rating: u8,
    timestamp: u64,
}
```

### SellerProfileCreated
```move
struct SellerProfileCreated has copy, drop {
    seller: address,
    timestamp: u64,
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | ENotProductOwner | Caller is not the product owner |
| 1 | EInsufficientPayment | Payment amount doesn't match price |
| 2 | EProductNotForSale | Product is not active |
| 3 | EUnauthorized | Unauthorized access attempt |
| 4 | EInvalidPrice | Price is zero or invalid |
| 5 | EInvalidRating | Rating not in 1-5 range |
| 6 | ESelfReview | Attempting to review own product |
| 7 | EAlreadyReviewed | Product already reviewed by buyer |
| 8 | EPlatformFeeOverflow | Fee calculation overflow |
| 9 | EProductSoldOut | Insufficient quantity available |
| 10 | EInvalidQuantity | Invalid quantity value |

---

## Constants

```move
PLATFORM_FEE_BPS: u64 = 200;           // 2% platform fee
MAX_FEE_BPS: u64 = 10000;              // 100% in basis points
MIN_RATING: u8 = 1;
MAX_RATING: u8 = 5;
MAX_DESCRIPTION_LENGTH: u64 = 1000;
MAX_REVIEW_LENGTH: u64 = 500;
```

---

## Best Practices

### For Developers

1. **Always use exact payments**
   ```typescript
   // Calculate exact amount
   const totalPrice = productPrice * quantity;
   
   // Split coins for exact payment
   const payment = await splitCoinsForPayment(tx, coinIds, totalPrice);
   ```

2. **Handle errors gracefully**
   ```typescript
   try {
     await executeTransaction(tx);
   } catch (error) {
     // Show user-friendly error
     toast.error(getSafeErrorMessage(error));
   }
   ```

3. **Validate inputs before transactions**
   ```typescript
   const validation = validateInput(schema, data);
   if (!validation.success) {
     throw new Error(validation.error);
   }
   ```

4. **Monitor events**
   ```typescript
   const events = result.events?.filter(
     e => e.type.includes('ProductPurchased')
   );
   ```

### For Users

1. Always verify product details before purchasing
2. Check seller ratings and reviews
3. Start with small test transactions
4. Keep your purchase receipts for reviews
5. Report suspicious listings

---

## Rate Limits

No on-chain rate limits, but consider:
- Gas costs for rapid transactions
- Network congestion during high activity
- Frontend rate limiting to prevent spam

---

## Support

For technical support:
- GitHub: Open an issue
- Discord: Sui developer community
- Documentation: https://docs.sui.io

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-01
