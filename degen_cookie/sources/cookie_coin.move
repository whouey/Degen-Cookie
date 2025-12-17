/// Module: cookie_coin
/// Custom coin for the Degen Cookie game
module degen_cookie::cookie_coin {
    use iota::coin::{Self, TreasuryCap, Coin};
    use iota::url;
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;

    /// One-Time-Witness for the coin
    public struct COOKIE_COIN has drop {}

    /// Initialize the coin
    fun init(witness: COOKIE_COIN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"CKIE",
            b"Cookie Coin",
            b"The official coin of Degen Cookie game - win to earn more, lose and they burn!",
            option::some(url::new_unsafe_from_bytes(b"https://cookie.game/icon.png")),
            ctx
        );

        // Freeze metadata so it cannot be changed
        transfer::public_freeze_object(metadata);

        // Share the treasury cap so the game module can mint/burn
        transfer::public_share_object(treasury_cap);
    }

    /// Mint new coins (called when player wins)
    public fun mint(
        treasury_cap: &mut TreasuryCap<COOKIE_COIN>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<COOKIE_COIN> {
        coin::mint(treasury_cap, amount, ctx)
    }

    /// Burn coins (called when player loses)
    public fun burn(
        treasury_cap: &mut TreasuryCap<COOKIE_COIN>,
        coin: Coin<COOKIE_COIN>
    ) {
        coin::burn(treasury_cap, coin);
    }

    /// Airdrop coins to a user
    public entry fun airdrop(
        treasury_cap: &mut TreasuryCap<COOKIE_COIN>,
        recipient: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(COOKIE_COIN {}, ctx);
    }
}
