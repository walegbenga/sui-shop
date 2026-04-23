/// Secure Social Commerce Platform on Sui
module sui_commerce::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use sui::clock::{Self, Clock};
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
    const ENotTokenOwner: u64 = 11;
    const EAlreadyListedForResale: u64 = 12;
    const ENotListedForResale: u64 = 13;
    
    // License errors
    const ELicenseExpired: u64 = 14;
    const ELicenseRevoked: u64 = 15;
    const EMaxActivationsReached: u64 = 16;
    const EDeviceAlreadyActivated: u64 = 17;
    const EDeviceNotActivated: u64 = 18;
    const ELicenseNotExpired: u64 = 19;
    const ENotLicenseOwner: u64 = 20;

    // ======== Constants ========
    const PLATFORM_FEE_BPS: u64 = 200;
    const ROYALTY_FEE_BPS: u64 = 250;
    const MAX_FEE_BPS: u64 = 10000;
    const MIN_RATING: u8 = 1;
    const MAX_RATING: u8 = 5;
    const MAX_DESCRIPTION_LENGTH: u64 = 1000;
    const MAX_REVIEW_LENGTH: u64 = 500;

    // License types
    const LICENSE_TYPE_NONE: u8 = 0;       // No license (free download)
    const LICENSE_TYPE_SINGLE: u8 = 1;     // Single device
    const LICENSE_TYPE_MULTI: u8 = 2;      // Multiple devices (seller sets count)
    const LICENSE_TYPE_UNLIMITED: u8 = 3;  // Unlimited activations

    // License status
    const LICENSE_STATUS_ACTIVE: u8 = 0;
    const LICENSE_STATUS_EXPIRED: u8 = 1;
    const LICENSE_STATUS_REVOKED: u8 = 2;

    // ======== Core Structs ========

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

    // ======== Resellable Product Structs ========

    public struct OwnershipToken has key, store {
        id: UID,
        original_product_id: ID,
        current_owner: address,
        previous_owner: address,
        original_seller: address,
        purchase_price: u64,
        purchase_timestamp: u64,
        is_listed_for_resale: bool,
        resale_price: u64,
        file_cid: String,
    }

    /// ✅ Token is stored INSIDE the listing — buyer never needs to own it
    public struct ResaleListing has key, store {
        id: UID,
        token: OwnershipToken,      // ← token lives here, not in seller's wallet
        seller: address,
        price: u64,
        original_product_id: ID,
        original_seller: address,
        listed_at: u64,
    }

    // ======== License Structs ========

    /// SoftwareLicense — minted to buyer when purchasing a licensed product
    public struct SoftwareLicense has key, store {
        id: UID,
        product_id: ID,
        owner: address,
        seller: address,                    // original seller (for renewals)
        license_type: u8,
        max_activations: u64,               // 0 = unlimited
        current_activations: u64,
        activated_devices: vector<String>,  // hashed device IDs
        issue_timestamp: u64,
        expiry_timestamp: u64,              // 0 = lifetime (no expiry)
        renewal_price: u64,                 // price to renew in MIST (0 = not renewable)
        status: u8,                         // 0=active, 1=expired, 2=revoked
        renewal_count: u64,                 // how many times renewed
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

    public struct ResaleListed has copy, drop {
        listing_id: ID,
        token_id: ID,
        seller: address,
        price: u64,
        original_product_id: ID,
        timestamp: u64,
    }

    public struct ResalePurchased has copy, drop {
        token_id: ID,
        listing_id: ID,
        buyer: address,
        seller: address,
        price: u64,
        original_product_id: ID,
        timestamp: u64,
    }

    public struct ResaleDelisted has copy, drop {
        listing_id: ID,
        token_id: ID,
        seller: address,
        timestamp: u64,
    }

    public struct LicenseIssued has copy, drop {
        license_id: ID,
        product_id: ID,
        buyer: address,
        license_type: u8,
        max_activations: u64,
        expiry_timestamp: u64,
        timestamp: u64,
    }

    public struct LicenseActivated has copy, drop {
        license_id: ID,
        owner: address,
        device_id: String,
        activations_used: u64,
        timestamp: u64,
    }

    public struct LicenseDeactivated has copy, drop {
        license_id: ID,
        owner: address,
        device_id: String,
        activations_used: u64,
        timestamp: u64,
    }

    public struct LicenseRenewed has copy, drop {
        license_id: ID,
        owner: address,
        new_expiry: u64,
        renewal_count: u64,
        timestamp: u64,
    }

    public struct LicenseRevoked has copy, drop {
        license_id: ID,
        product_id: ID,
        owner: address,
        timestamp: u64,
    }

    // ======== Initialization ========

    fun init(_witness: MARKETPLACE, ctx: &mut TxContext) {
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

        product.quantity_available = product.quantity_available - quantity;
        product.total_sold = product.total_sold + quantity;

        if (product.quantity_available == 0) {
            product.is_active = false;
        };

        let buyer = tx_context::sender(ctx);
        //let now = clock::timestamp_ms(clock);

        // Issue ownership token for resellable products
        if (product.resellable) {
            let token = OwnershipToken {
                id: object::new(ctx),
                original_product_id: object::uid_to_inner(&product.id),
                current_owner: buyer,
                previous_owner: product.seller,
                original_seller: product.seller,
                purchase_price: total_price,
                purchase_timestamp: clock::timestamp_ms(clock),
                is_listed_for_resale: false,
                resale_price: 0,
                file_cid: product.file_cid,
            };
            transfer::transfer(token, buyer);
        };

        // Issue software license if product requires one
        if (product.license_type != LICENSE_TYPE_NONE) {
            // Calculate expiry: 0 = lifetime, else now + duration_days in ms
            let expiry_timestamp = if (product.license_duration_days == 0) {
                0 // lifetime
            } else {
                now + (product.license_duration_days * 24 * 60 * 60 * 1000)
            };

            let license_id = object::new(ctx);
            let license_id_copy = object::uid_to_inner(&license_id);
            let product_id_inner = object::uid_to_inner(&product.id);

            let license = SoftwareLicense {
                id: license_id,
                product_id: product_id_inner,
                owner: buyer,
                seller: product.seller,
                license_type: product.license_type,
                max_activations: product.license_max_activations,
                current_activations: 0,
                activated_devices: vector::empty<String>(),
                issue_timestamp: now,
                expiry_timestamp,
                renewal_price: product.license_renewal_price,
                status: LICENSE_STATUS_ACTIVE,
                renewal_count: 0,
            };

            event::emit(LicenseIssued {
                license_id: license_id_copy,
                product_id: product_id_inner,
                buyer,
                license_type: product.license_type,
                max_activations: product.license_max_activations,
                expiry_timestamp,
                timestamp: now,
            });

            transfer::transfer(license, buyer);
        };

        let receipt = PurchaseReceipt {
            id: object::new(ctx),
            product_id: object::uid_to_inner(&product.id),
            buyer,
            seller: product.seller,
            amount_paid: total_price,
            platform_fee,
            quantity,
            timestamp: clock::timestamp_ms(clock),
        };

        event::emit(ProductPurchased {
            product_id: object::uid_to_inner(&product.id),
            buyer,
            seller: product.seller,
            price: total_price,
            quantity,
            platform_fee,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(receipt, buyer);
    }


    / ======== License Functions ========

    /// Activate a license on a device
    /// device_id should be a hash of hardware identifiers from the client software
    public entry fun activate_license(
        license: &mut SoftwareLicense,
        device_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(license.owner == caller, ENotLicenseOwner);
        assert!(license.status == LICENSE_STATUS_ACTIVE, ELicenseRevoked);

        let now = clock::timestamp_ms(clock);

        // Check expiry (0 = lifetime)
        if (license.expiry_timestamp > 0) {
            assert!(now < license.expiry_timestamp, ELicenseExpired);
        };

        let device_str = string::utf8(device_id);

        // Check device not already activated
        let len = vector::length(&license.activated_devices);
        let mut i = 0;
        while (i < len) {
            assert!(*vector::borrow(&license.activated_devices, i) != device_str, EDeviceAlreadyActivated);
            i = i + 1;
        };

        // Check max activations (0 = unlimited)
        if (license.max_activations > 0) {
            assert!(license.current_activations < license.max_activations, EMaxActivationsReached);
        };

        vector::push_back(&mut license.activated_devices, device_str);
        license.current_activations = license.current_activations + 1;

        event::emit(LicenseActivated {
            license_id: object::uid_to_inner(&license.id),
            owner: caller,
            device_id: device_str,
            activations_used: license.current_activations,
            timestamp: now,
        });
    }

    /// Deactivate a license on a device (frees up an activation slot)
    public entry fun deactivate_license(
        license: &mut SoftwareLicense,
        device_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(license.owner == caller, ENotLicenseOwner);

        let device_str = string::utf8(device_id);
        let len = vector::length(&license.activated_devices);
        let mut found = false;
        let mut idx = 0;
        let mut i = 0;

        while (i < len) {
            if (*vector::borrow(&license.activated_devices, i) == device_str) {
                found = true;
                idx = i;
            };
            i = i + 1;
        };

        assert!(found, EDeviceNotActivated);

        vector::remove(&mut license.activated_devices, idx);
        license.current_activations = license.current_activations - 1;

        event::emit(LicenseDeactivated {
            license_id: object::uid_to_inner(&license.id),
            owner: caller,
            device_id: device_str,
            activations_used: license.current_activations,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Renew an expired (or about-to-expire) license
    /// Buyer pays renewal_price to the seller, license expiry extends by original duration
    public entry fun renew_license(
        platform: &mut Platform,
        license: &mut SoftwareLicense,
        product: &Product,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(license.owner == caller, ENotLicenseOwner);
        assert!(license.status != LICENSE_STATUS_REVOKED, ELicenseRevoked);
        assert!(license.renewal_price > 0, EInvalidPrice); // must be renewable
        assert!(coin::value(&payment) == license.renewal_price, EInsufficientPayment);

        // License must be expired OR within 30 days of expiry to renew
        let now = clock::timestamp_ms(clock);
        if (license.expiry_timestamp > 0) {
            let thirty_days_ms: u64 = 30 * 24 * 60 * 60 * 1000;
            let can_renew = now >= license.expiry_timestamp ||
                            (license.expiry_timestamp - now) <= thirty_days_ms;
            assert!(can_renew, ELicenseNotExpired);
        };

        // Split payment: platform fee + rest to seller
        let platform_fee = calculate_fee(license.renewal_price, platform.platform_fee_bps);
        let mut payment_balance = coin::into_balance(payment);
        let fee_balance = balance::split(&mut payment_balance, platform_fee);
        balance::join(&mut platform.treasury, fee_balance);
        platform.total_sales = platform.total_sales + 1;

        let seller_coin = coin::from_balance(payment_balance, ctx);
        transfer::public_transfer(seller_coin, license.seller);

        // Extend expiry — use product's original duration
        let new_expiry = if (product.license_duration_days == 0) {
            0 // becomes lifetime on renewal
        } else {
            let duration_ms = product.license_duration_days * 24 * 60 * 60 * 1000;
            if (now >= license.expiry_timestamp) {
                // Already expired — renew from now
                now + duration_ms
            } else {
                // Not yet expired — extend from current expiry
                license.expiry_timestamp + duration_ms
            }
        };

        license.expiry_timestamp = new_expiry;
        license.status = LICENSE_STATUS_ACTIVE;
        license.renewal_count = license.renewal_count + 1;

        event::emit(LicenseRenewed {
            license_id: object::uid_to_inner(&license.id),
            owner: caller,
            new_expiry,
            renewal_count: license.renewal_count,
            timestamp: now,
        });
    }

    /// Admin or seller can revoke a license
    public entry fun revoke_license(
        platform: &Platform,
        license: &mut SoftwareLicense,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        // Only platform admin or the original seller can revoke
        assert!(
            caller == platform.admin || caller == license.seller,
            EUnauthorized
        );

        license.status = LICENSE_STATUS_REVOKED;

        event::emit(LicenseRevoked {
            license_id: object::uid_to_inner(&license.id),
            product_id: license.product_id,
            owner: license.owner,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // ======== Resale Functions ========

    /// Seller passes their token — it gets consumed into the listing
    public entry fun list_for_resale(
        token: OwnershipToken,          // ← consumed (not &mut)
        price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(token.current_owner == sender, ENotTokenOwner);
        assert!(!token.is_listed_for_resale, EAlreadyListedForResale);
        assert!(price > 0, EInvalidPrice);

        let token_id            = object::uid_to_inner(&token.id);
        let original_product_id = token.original_product_id;
        let original_seller     = token.original_seller;

        let listing_uid      = object::new(ctx);
        let listing_id_copy  = object::uid_to_inner(&listing_uid);

        let listing = ResaleListing {
            id: listing_uid,
            token,                  // ← token stored inside listing
            seller: sender,
            price,
            original_product_id,
            original_seller,
            listed_at: clock::timestamp_ms(clock),
        };

        transfer::share_object(listing);

        event::emit(ResaleListed {
            listing_id: listing_id_copy,
            token_id,
            seller: sender,
            price,
            original_product_id,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Cancel listing — token returned to seller
    public entry fun delist_resale(
        listing: ResaleListing,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(listing.seller == sender, EUnauthorized);

        let ResaleListing {
            id,
            token,
            seller: _,
            price: _,
            original_product_id: _,
            original_seller: _,
            listed_at: _,
        } = listing;

        let token_id   = object::uid_to_inner(&token.id);
        let listing_id = object::uid_to_inner(&id);

        // Return token to seller
        transfer::transfer(token, sender);
        object::delete(id);

        event::emit(ResaleDelisted {
            listing_id,
            token_id,
            seller: sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Buy a resale — only needs listing, no separate token arg
    public entry fun purchase_resale(
        platform: &mut Platform,
        listing: ResaleListing,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        assert!(buyer != listing.seller, EUnauthorized);

        let price = listing.price;
        assert!(coin::value(&payment) == price, EInsufficientPayment);

        let platform_fee = calculate_fee(price, platform.platform_fee_bps);
        let royalty_fee  = calculate_fee(price, ROYALTY_FEE_BPS);
        assert!(platform_fee + royalty_fee <= price, EPlatformFeeOverflow);

        let mut payment_balance = coin::into_balance(payment);
        let fee_balance         = balance::split(&mut payment_balance, platform_fee);
        let royalty_balance     = balance::split(&mut payment_balance, royalty_fee);

        balance::join(&mut platform.treasury, fee_balance);
        platform.total_sales = platform.total_sales + 1;

        let royalty_coin = coin::from_balance(royalty_balance, ctx);
        transfer::public_transfer(royalty_coin, listing.original_seller);

        let seller_coin = coin::from_balance(payment_balance, ctx);
        transfer::public_transfer(seller_coin, listing.seller);

        // Destructure listing to get token out
        let ResaleListing {
            id,
            mut token,
            seller,
            price: _,
            original_product_id,
            original_seller: _,
            listed_at: _,
        } = listing;

        let token_id   = object::uid_to_inner(&token.id);
        let listing_id = object::uid_to_inner(&id);

        // Transfer ownership
        token.previous_owner       = token.current_owner;
        token.current_owner        = buyer;
        token.is_listed_for_resale = false;
        token.resale_price         = 0;
        token.purchase_price       = price;
        token.purchase_timestamp   = clock::timestamp_ms(clock);

        // Transfer token to new owner
        transfer::transfer(token, buyer);
        object::delete(id);

        // Issue receipt to buyer
        let receipt = PurchaseReceipt {
            id: object::new(ctx),
            product_id: original_product_id,
            buyer,
            seller,
            amount_paid: price,
            platform_fee,
            quantity: 1,
            timestamp: clock::timestamp_ms(clock),
        };
        transfer::transfer(receipt, buyer);

        event::emit(ResalePurchased {
            token_id,
            listing_id,
            buyer,
            seller,
            price,
            original_product_id,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // ======== Review Functions ========

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
        if (product.review_count == 0) { return 0 };
        product.total_rating_sum / product.review_count
    }

    public fun get_product_details(product: &Product): (address, u64, u64, bool, u64) {
        (product.seller, product.price, product.quantity_available, product.is_active, product.review_count)
    }

    public fun get_seller_stats(profile: &SellerProfile): (u64, u64, bool) {
        (profile.total_sales, profile.average_rating, profile.is_verified)
    }

    public fun get_token_details(token: &OwnershipToken): (ID, address, address, u64, bool, u64) {
        (token.original_product_id, token.current_owner, token.original_seller, token.purchase_price, token.is_listed_for_resale, token.resale_price)
    }

    public fun get_product_license_config(product: &Product): (u8, u64, u64, u64) {
        (product.license_type, product.license_max_activations, product.license_duration_days, product.license_renewal_price)
    }

    public fun get_license_details(license: &SoftwareLicense): (u8, u64, u64, u64, u64, u8) {
        (license.license_type, license.max_activations, license.current_activations,
         license.expiry_timestamp, license.renewal_price, license.status)
    }

    public fun is_license_valid(license: &SoftwareLicense, clock: &Clock): bool {
        if (license.status != LICENSE_STATUS_ACTIVE) { return false };
        if (license.expiry_timestamp == 0) { return true };
        clock::timestamp_ms(clock) < license.expiry_timestamp
    }

    // ======== Test Functions ========
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(MARKETPLACE {}, ctx);
    }
}