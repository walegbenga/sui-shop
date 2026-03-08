#[test_only]
module sui_commerce::marketplace_tests {
    use sui_commerce::marketplace::{Self, Platform, Product, SellerProfile, PurchaseReceipt};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_utils;
    use sui::clock::{Self, Clock};

    // Test addresses
    const ADMIN: address = @0xAD;
    const SELLER: address = @0xSELL;
    const BUYER: address = @0xBUY;
    const BUYER2: address = @0xBUY2;

    // Test values
    const PRODUCT_PRICE: u64 = 1000000; // 0.001 SUI
    const PRODUCT_QUANTITY: u64 = 10;

    #[test]
    fun test_platform_initialization() {
        let mut scenario = ts::begin(ADMIN);
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let platform = ts::take_shared<Platform>(&scenario);
            ts::return_shared(platform);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_seller_profile() {
        let mut scenario = ts::begin(SELLER);
        
        // Initialize platform
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            marketplace::create_seller_profile(
                b"Test Seller",
                &clock,
                ts::ctx(&mut scenario)
            );
            clock::destroy_for_testing(clock);
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let profile = ts::take_from_sender<SellerProfile>(&scenario);
            let (sales, rating, verified) = marketplace::get_seller_stats(&profile);
            assert!(sales == 0, 0);
            assert!(rating == 0, 1);
            assert!(!verified, 2);
            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_list_product() {
        let mut scenario = ts::begin(SELLER);
        
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::list_product(
                &mut platform,
                b"Test Product",
                b"A great product for testing",
                PRODUCT_PRICE,
                PRODUCT_QUANTITY,
                b"Electronics",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let product = ts::take_shared<Product>(&scenario);
            let (seller, price, quantity, is_active, reviews) = marketplace::get_product_details(&product);
            
            assert!(seller == SELLER, 0);
            assert!(price == PRODUCT_PRICE, 1);
            assert!(quantity == PRODUCT_QUANTITY, 2);
            assert!(is_active, 3);
            assert!(reviews == 0, 4);
            
            ts::return_shared(product);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_purchase_product() {
        let mut scenario = ts::begin(SELLER);
        
        // Setup
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        // List product
        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::list_product(
                &mut platform,
                b"Test Product",
                b"Test Description",
                PRODUCT_PRICE,
                PRODUCT_QUANTITY,
                b"Test",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
        };

        // Purchase product
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let mut product = ts::take_shared<Product>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            // Create payment coin
            let payment = coin::mint_for_testing<SUI>(PRODUCT_PRICE, ts::ctx(&mut scenario));
            
            marketplace::purchase_product(
                &mut platform,
                &mut product,
                payment,
                1,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
            ts::return_shared(product);
        };

        // Verify purchase
        ts::next_tx(&mut scenario, BUYER);
        {
            let receipt = ts::take_from_sender<PurchaseReceipt>(&scenario);
            ts::return_to_sender(&scenario, receipt);
            
            let product = ts::take_shared<Product>(&scenario);
            let (_, _, quantity, _, _) = marketplace::get_product_details(&product);
            assert!(quantity == PRODUCT_QUANTITY - 1, 0);
            ts::return_shared(product);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_review_product() {
        let mut scenario = ts::begin(SELLER);
        
        // Setup and list product
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::list_product(
                &mut platform,
                b"Test Product",
                b"Test",
                PRODUCT_PRICE,
                PRODUCT_QUANTITY,
                b"Test",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
        };

        // Purchase
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let mut product = ts::take_shared<Product>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(PRODUCT_PRICE, ts::ctx(&mut scenario));
            
            marketplace::purchase_product(
                &mut platform,
                &mut product,
                payment,
                1,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
            ts::return_shared(product);
        };

        // Review
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut product = ts::take_shared<Product>(&scenario);
            let receipt = ts::take_from_sender<PurchaseReceipt>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::review_product(
                &mut product,
                &receipt,
                5,
                b"Great product!",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            let rating = marketplace::get_product_rating(&product);
            assert!(rating == 5, 0);
            
            clock::destroy_for_testing(clock);
            ts::return_to_sender(&scenario, receipt);
            ts::return_shared(product);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = marketplace::EInsufficientPayment)]
    fun test_insufficient_payment_fails() {
        let mut scenario = ts::begin(SELLER);
        
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::list_product(
                &mut platform,
                b"Test",
                b"Test",
                PRODUCT_PRICE,
                PRODUCT_QUANTITY,
                b"Test",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
        };

        ts::next_tx(&mut scenario, BUYER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let mut product = ts::take_shared<Product>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            // Try to pay less than required
            let payment = coin::mint_for_testing<SUI>(PRODUCT_PRICE - 1, ts::ctx(&mut scenario));
            
            marketplace::purchase_product(
                &mut platform,
                &mut product,
                payment,
                1,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
            ts::return_shared(product);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = marketplace::ENotProductOwner)]
    fun test_unauthorized_update_fails() {
        let mut scenario = ts::begin(SELLER);
        
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::list_product(
                &mut platform,
                b"Test",
                b"Test",
                PRODUCT_PRICE,
                PRODUCT_QUANTITY,
                b"Test",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
        };

        // Different user tries to update
        ts::next_tx(&mut scenario, BUYER);
        {
            let mut product = ts::take_shared<Product>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::update_product(
                &mut product,
                2000000,
                5,
                b"Hacked description",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(product);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = marketplace::ESelfReview)]
    fun test_self_review_fails() {
        let mut scenario = ts::begin(SELLER);
        
        {
            marketplace::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::list_product(
                &mut platform,
                b"Test",
                b"Test",
                PRODUCT_PRICE,
                PRODUCT_QUANTITY,
                b"Test",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
        };

        // Seller tries to buy own product
        ts::next_tx(&mut scenario, SELLER);
        {
            let mut platform = ts::take_shared<Platform>(&scenario);
            let mut product = ts::take_shared<Product>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(PRODUCT_PRICE, ts::ctx(&mut scenario));
            
            marketplace::purchase_product(
                &mut platform,
                &mut product,
                payment,
                1,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(platform);
            ts::return_shared(product);
        };

        // Seller tries to review own product
        ts::next_tx(&mut scenario, SELLER);
        {
            let mut product = ts::take_shared<Product>(&scenario);
            let receipt = ts::take_from_sender<PurchaseReceipt>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            marketplace::review_product(
                &mut product,
                &receipt,
                5,
                b"Great!",
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_to_sender(&scenario, receipt);
            ts::return_shared(product);
        };

        ts::end(scenario);
    }
}
