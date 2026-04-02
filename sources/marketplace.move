/// Secure Social Commerce Platform on Sui
/// Implements object-native marketplace with social features
/// Security features: Access control, reentrancy protection, overflow checks
module sui_commerce::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::vec_map::{Self, VecMap};
    use std::string::{Self, String};
    use std::vector;
    use sui::clock::{Self, Clock};
    use sui::dynamic_object_field as dof;
    use sui::dynamic_field as df;

    // ======== Error Codes ========
    const ENotProductOwner: u64 = 0;
    const EInsufficientPayment: u64 = 1;
    const EProductNotForSale: u64 = 2;
    const EUnauthorized: u64 = 3;
    const EInvalidPrice: u64 = 4;
    const EInvalidRating: u64 = 5;
    const ESelfReview: u64 = 6;
    const EAlreadyReviewed: u64 = 7;
    const EPlatformFeeOverflow: u64 = 8;
    const EProductSoldOut: u64 = 9;
    const EInvalidQuantity: u64 = 10;

    // ======== Constants ========
    const PLATFORM_FEE_BPS: u64 = 200;
    const MAX_FEE_BPS: u64 = 10000;
    const MIN_RATING: u8 = 1;
    const MAX_RATING: u8 = 5;
    const MAX_DESCRIPTION_LENGTH: u64 = 1000;
    const MAX_REVIEW_LENGTH: u64 = 500;

    // ======== Structs ========

    public struct MARKETPLACE has drop {}

    public struct Platform has key {
        id: UID,
        admin: address,
        treasury: Balance<SUI>,
        total_sales: u64,
        total_products: u64,
        platform_fee_bps: u64,
    }

    public struct SellerProfile has key, store {
        id: UID,
        owner: address,
        display_name: String,
        total_sales: u64,
        total_reviews: u64,
        average_rating: u64,
        created_at: u64,
        is_verified: bool,
    }

    public struct Product has key, store {
        id: UID,
        seller: address,
        name: String,
        description: String,
        price: u64,
        quantity_available: u64,
        total_sold: u64,
        is_active: bool,
        created_at: u64,
        updated_at: u64,
        category: String,
        review_count: u64,
        total_rating_sum: u64,
        resellable: bool,
        file_cid: String,
    }

    public struct Review has store, drop {
        reviewer: address,
        rating: u8,
        comment: String,
        timestamp: u64,
        verified_purchase: bool,
    }

    public struct PurchaseReceipt has key, store {
        id: UID,
        product_id: ID,
        buyer: address,
        seller: address,
        amount_paid: u64,
        platform_fee: u64,
        quantity: u64,
        timestamp: u64,
    }

    public struct BuyerBadge has key, store {
        id: UID,
        owner: address,
        total_purchases: u64,
        total_spent: u64,
        member_since: u64,
        tier: u8,
    }

    // ======== Events ========

    public struct ProductListed has copy, drop {
        product_id: ID,
        seller: address,
        price: u64,
        timestamp: u64,
    }

    public struct ProductPurchased has copy, drop {
        product_id: ID,
        buyer: address,
        seller: address,
        price: u64,
        quantity: u64,
        platform_fee: u64,
        timestamp: u64,
    }

    public struct ProductReviewed has copy, drop {
        product_id: ID,
        reviewer: address,
        rating: u8,
        timestamp: u64,
    }

    public struct SellerProfileCreated has copy, drop {
        seller: address,
        timestamp: u64,
    }

    // ======== Initialization ========

    fun init(witness: MARKETPLACE, ctx: &mut TxContext) {
        let platform = Platform {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            treasury: balance::zero(),
            total_sales: 0,
            total_products: 0,
            platform_fee_bps: PLATFORM_FEE_BPS,
        };
        transfer::share_object(platform);
    }

    // ======== Seller Functions ========

    public entry fun create_seller_profile(
        display_name: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let profile = SellerProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            display_name: string::utf8(display_name),
            total_sales: 0,
            total_reviews: 0,
            average_rating: 0,
            created_at: clock::timestamp_ms(clock),
            is_verified: false,
        };

        event::emit(SellerProfileCreated {
            seller: tx_context::sender(ctx),
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    public entry fun list_product(
        platform: &mut Platform,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        quantity: u64,
        category: vector<u8>,
        resellable: bool,
        file_cid: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(price > 0, EInvalidPrice);
        assert!(quantity > 0, EInvalidQuantity);
        assert!(vector::length(&description) <= MAX_DESCRIPTION_LENGTH, EInvalidQuantity);

        let product_id = object::new(ctx);
        let product_id_copy = object::uid_to_inner(&product_id);

        let product = Product {
            id: product_id,
            seller: tx_context::sender(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            price,
            quantity_available: quantity,
            total_sold: 0,
            is_active: true,
            created_at: clock::timestamp_ms(clock),
            updated_at: clock::timestamp_ms(clock),
            category: string::utf8(category),
            review_count: 0,
            total_rating_sum: 0,
            resellable,
            file_cid: string::utf8(file_cid),
        };

        platform.total_products = platform.total_products + 1;

        event::emit(ProductListed {
            product_id: product_id_copy,
            seller: tx_context::sender(ctx),
            price,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::share_object(product);
    }

    public entry fun update_product(
        product: &mut Product,
        new_price: u64,
        new_quantity: u64,
        new_description: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(product.seller == tx_context::sender(ctx), ENotProductOwner);
        assert!(new_price > 0, EInvalidPrice);
        assert!(vector::length(&new_description) <= MAX_DESCRIPTION_LENGTH, EInvalidQuantity);

        product.price = new_price;
        product.quantity_available = new_quantity;
        product.description = string::utf8(new_description);
        product.updated_at = clock::timestamp_ms(clock);
    }

    public entry fun deactivate_product(
        product: &mut Product,
        ctx: &mut TxContext
    ) {
        assert!(product.seller == tx_context::sender(ctx), ENotProductOwner);
        product.is_active = false;
    }

    // ======== Buyer Functions ========

    public entry fun purchase_product(
        platform: &mut Platform,
        product: &mut Product,
        payment: Coin<SUI>,
        quantity: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(product.is_active, EProductNotForSale);
        assert!(product.quantity_available >= quantity, EProductSoldOut);
        assert!(quantity > 0, EInvalidQuantity);

        let total_price = product.price * quantity;
        let payment_amount = coin::value(&payment);
        assert!(payment_amount == total_price, EInsufficientPayment);

        let platform_fee = calculate_fee(total_price, platform.platform_fee_bps);
        assert!(platform_fee <= total_price, EPlatformFeeOverflow);

        let mut payment_balance = coin::into_balance(payment);
        let fee_balance = balance::split(&mut payment_balance, platform_fee);

        balance::join(&mut platform.treasury, fee_balance);
        platform.total_sales = platform.total_sales + 1;

        let seller_coin = coin::from_balance(payment_balance, ctx);
        transfer::public_transfer(seller_coin, product.seller);

        // Update product state
        product.quantity_available = product.quantity_available - quantity;
        product.total_sold = product.total_sold + quantity;

        // Mark inactive if sold out
        if (product.quantity_available == 0) {
            product.is_active = false;
        };

        let receipt = PurchaseReceipt {
            id: object::new(ctx),
            product_id: object::uid_to_inner(&product.id),
            buyer: tx_context::sender(ctx),
            seller: product.seller,
            amount_paid: total_price,
            platform_fee,
            quantity,
            timestamp: clock::timestamp_ms(clock),
        };

        event::emit(ProductPurchased {
            product_id: object::uid_to_inner(&product.id),
            buyer: tx_context::sender(ctx),
            seller: product.seller,
            price: total_price,
            quantity,
            platform_fee,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(receipt, tx_context::sender(ctx));
    }

    public entry fun review_product(
        product: &mut Product,
        receipt: &PurchaseReceipt,
        rating: u8,
        comment: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(rating >= MIN_RATING && rating <= MAX_RATING, EInvalidRating);
        assert!(vector::length(&comment) <= MAX_REVIEW_LENGTH, EInvalidQuantity);

        let reviewer = tx_context::sender(ctx);

        assert!(reviewer != product.seller, ESelfReview);
        assert!(receipt.product_id == object::uid_to_inner(&product.id), EUnauthorized);
        assert!(receipt.buyer == reviewer, EUnauthorized);

        let review_key = reviewer;
        assert!(!df::exists_(&product.id, review_key), EAlreadyReviewed);

        let review = Review {
            reviewer,
            rating,
            comment: string::utf8(comment),
            timestamp: clock::timestamp_ms(clock),
            verified_purchase: true,
        };

        df::add(&mut product.id, review_key, review);

        product.review_count = product.review_count + 1;
        product.total_rating_sum = product.total_rating_sum + (rating as u64);

        event::emit(ProductReviewed {
            product_id: object::uid_to_inner(&product.id),
            reviewer,
            rating,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public entry fun create_buyer_badge(
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let badge = BuyerBadge {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            total_purchases: 0,
            total_spent: 0,
            member_since: clock::timestamp_ms(clock),
            tier: 0,
        };
        transfer::transfer(badge, tx_context::sender(ctx));
    }

    public fun update_buyer_badge(
        badge: &mut BuyerBadge,
        amount_spent: u64,
    ) {
        badge.total_purchases = badge.total_purchases + 1;
        badge.total_spent = badge.total_spent + amount_spent;

        if (badge.total_spent >= 10000000) {
            badge.tier = 3;
        } else if (badge.total_spent >= 5000000) {
            badge.tier = 2;
        } else if (badge.total_spent >= 1000000) {
            badge.tier = 1;
        };
    }

    // ======== Admin Functions ========

    public entry fun withdraw_fees(
        platform: &mut Platform,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(platform.admin == tx_context::sender(ctx), EUnauthorized);

        let withdrawn = balance::split(&mut platform.treasury, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, platform.admin);
    }

    public entry fun update_platform_fee(
        platform: &mut Platform,
        new_fee_bps: u64,
        ctx: &mut TxContext
    ) {
        assert!(platform.admin == tx_context::sender(ctx), EUnauthorized);
        assert!(new_fee_bps <= MAX_FEE_BPS, EPlatformFeeOverflow);

        platform.platform_fee_bps = new_fee_bps;
    }

    public entry fun verify_seller(
        platform: &Platform,
        profile: &mut SellerProfile,
        ctx: &mut TxContext
    ) {
        assert!(platform.admin == tx_context::sender(ctx), EUnauthorized);
        profile.is_verified = true;
    }

    // ======== Helper Functions ========

    fun calculate_fee(amount: u64, fee_bps: u64): u64 {
        let fee = (amount * fee_bps) / MAX_FEE_BPS;
        assert!(fee <= amount, EPlatformFeeOverflow);
        fee
    }

    // ======== View Functions ========

    public fun get_product_rating(product: &Product): u64 {
        if (product.review_count == 0) {
            return 0
        };
        product.total_rating_sum / product.review_count
    }

    public fun get_product_details(product: &Product): (address, u64, u64, bool, u64) {
        (
            product.seller,
            product.price,
            product.quantity_available,
            product.is_active,
            product.review_count
        )
    }

    public fun get_seller_stats(profile: &SellerProfile): (u64, u64, bool) {
        (
            profile.total_sales,
            profile.average_rating,
            profile.is_verified
        )
    }

    // ======== Test Functions ========
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(MARKETPLACE {}, ctx);
    }
}
