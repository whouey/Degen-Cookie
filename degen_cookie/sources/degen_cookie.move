/// Module: degen_cookie (Simplified for Hackathon)
/// Frontend controls game timing and explosion logic
/// Contract only handles: Airdrop, Mint on win, Burn on loss
module degen_cookie::degen_cookie {
    use iota::coin::{Self, Coin, TreasuryCap};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::event;
    use iota::object::{Self, UID};
    use degen_cookie::cookie_coin::{Self, COOKIE_COIN};

    // ===== Error Codes =====
    const EAlreadyClaimed: u64 = 1;
    const EInsufficientBet: u64 = 2;
    const EInvalidMultiplier: u64 = 3;

    // ===== Constants =====
    const MIN_BET: u64 = 100_000_000;         // Minimum bet (0.1 CKIE)
    const AIRDROP_AMOUNT: u64 = 100_000_000_000; // 100 CKIE airdrop
    const MAX_MULTIPLIER: u64 = 350;          // Max 3.5x multiplier (350%) - matches frontend 3-8s timing

    // ===== Structs =====

    /// Track airdrop claims
    public struct AirdropRegistry has key {
        id: UID,
        claimed: vector<address>,
    }

    // ===== Events =====

    public struct AirdropClaimed has copy, drop {
        player: address,
        amount: u64,
    }

    public struct GameWon has copy, drop {
        player: address,
        bet_amount: u64,
        reward_amount: u64,
        total_received: u64,
    }

    public struct GameLost has copy, drop {
        player: address,
        burned_amount: u64,
    }

    // ===== Initialization =====

    fun init(ctx: &mut TxContext) {
        let registry = AirdropRegistry {
            id: object::new(ctx),
            claimed: vector::empty(),
        };
        transfer::share_object(registry);
    }

    // ===== Public Entry Functions =====

    /// Claim initial airdrop of 100 CKIE (one time per address)
    public entry fun claim_airdrop(
        registry: &mut AirdropRegistry,
        treasury_cap: &mut TreasuryCap<COOKIE_COIN>,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);

        // Check if already claimed
        assert!(!vector::contains(&registry.claimed, &player), EAlreadyClaimed);

        // Mark as claimed
        vector::push_back(&mut registry.claimed, player);

        // Mint and send airdrop
        cookie_coin::airdrop(treasury_cap, player, AIRDROP_AMOUNT, ctx);

        event::emit(AirdropClaimed {
            player,
            amount: AIRDROP_AMOUNT,
        });
    }

    /// Player wins! Return bet + mint reward
    /// Frontend calculates multiplier_percent (100 = 1x, 150 = 1.5x, 350 = 3.5x)
    public entry fun play_and_win(
        mut bet: Coin<COOKIE_COIN>,
        multiplier_percent: u64,
        treasury_cap: &mut TreasuryCap<COOKIE_COIN>,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        let bet_amount = coin::value(&bet);

        // Validate
        assert!(bet_amount >= MIN_BET, EInsufficientBet);
        assert!(multiplier_percent >= 100 && multiplier_percent <= MAX_MULTIPLIER, EInvalidMultiplier);

        // Calculate reward: reward = bet * (multiplier - 100) / 100
        let reward_amount = (bet_amount * (multiplier_percent - 100)) / 100;

        // Mint reward coins
        let reward = cookie_coin::mint(treasury_cap, reward_amount, ctx);

        // Merge bet + reward
        coin::join(&mut bet, reward);
        let total = coin::value(&bet);

        // Send back to player
        transfer::public_transfer(bet, player);

        event::emit(GameWon {
            player,
            bet_amount,
            reward_amount,
            total_received: total,
        });
    }

    /// Player loses! Burn the bet
    public entry fun play_and_lose(
        bet: Coin<COOKIE_COIN>,
        treasury_cap: &mut TreasuryCap<COOKIE_COIN>,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        let bet_amount = coin::value(&bet);

        assert!(bet_amount >= MIN_BET, EInsufficientBet);

        // BURN the coins!
        cookie_coin::burn(treasury_cap, bet);

        event::emit(GameLost {
            player,
            burned_amount: bet_amount,
        });
    }

    // ===== View Functions =====

    /// Check if address has claimed airdrop
    public fun has_claimed_airdrop(registry: &AirdropRegistry, player: address): bool {
        vector::contains(&registry.claimed, &player)
    }

    /// Helper: Calculate reward for frontend reference
    /// Formula: t <= 3s: 1.0x, t > 3s: 1.0 + 0.1 * (t - 3)^2
    /// Matches frontend 3-8 second timing
    public fun calculate_multiplier_percent(time_ms: u64): u64 {
        if (time_ms <= 3000) {
            return 100 // 1.0x (no profit, return bet only)
        };

        let excess_ms = time_ms - 3000;
        let excess_squared = excess_ms * excess_ms;
        let multiplier = 100 + (10 * excess_squared) / 1_000_000;

        // Cap at max (350 = 3.5x at 8 seconds)
        if (multiplier > MAX_MULTIPLIER) {
            MAX_MULTIPLIER
        } else {
            multiplier
        }
    }

    // ===== Test Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
