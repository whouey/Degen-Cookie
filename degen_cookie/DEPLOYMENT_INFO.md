# Degen Cookie - Testnet Deployment Info

## 🎯 Deployment Summary
- **Network**: IOTA Testnet
- **Status**: ✅ Successfully Deployed
- **Transaction Digest**: `641LKc2KyyMSuhhXc8qWve3QBbHXya52EiZ9khVTNFpV`
- **Gas Cost**: 30.115600 NANOS (~0.03 IOTA)
- **Deployer Address**: `0xe1ffdf8012451e724480afd209930d1a779b8895de34aa078e2a5f01864c29a1`

---

## 📦 Package Information

**Package ID** (Most Important!)
```
0x737e8728621e615a706e76ab5e3c9a0aa89ad25b56e6eb1ee60480db86fcd30a
```

**Modules**:
- `cookie_coin` - CKIE token implementation
- `degen_cookie` - Game logic

---

## 🔑 Critical Object IDs (For Frontend)

### 1. TreasuryCap (Shared Object) ⭐⭐⭐
**Used for: Minting/Burning CKIE coins**
```
0xcd7fa386eae9701fd99db26527d3958e1ba564339d2f6c1b04037a03cf4daede
```
- Type: `TreasuryCap<COOKIE_COIN>`
- Owner: Shared
- All `play_and_win` and `play_and_lose` calls need this!

### 2. AirdropRegistry (Shared Object) ⭐⭐⭐
**Used for: Claiming airdrop**
```
0xe61d07855e0430e75764f976e410c4dc746e7d7853dbca12d64f66d682d4bbf2
```
- Type: `AirdropRegistry`
- Owner: Shared
- Tracks which addresses have claimed airdrop

### 3. CoinMetadata (Immutable)
**Used for: Displaying coin info**
```
0x2c07f096be9659e600b9067b8cb2aed5b19335e59af18687d72f559ee06fd134
```
- Type: `CoinMetadata<COOKIE_COIN>`
- Symbol: CKIE
- Decimals: 9
- Name: "Cookie Coin"

### 4. UpgradeCap (Your Control)
**Used for: Upgrading contract (if needed later)**
```
0x13c778e5c21b951145a50a071719c14693b24a8b3061562a9f17d49611d2a959
```
- Owner: You (deployer)
- Keep this safe for future upgrades!

---

## 🎮 Frontend Integration Guide

### Function Signatures

#### 1. Claim Airdrop (100 CKIE)
```typescript
// Call once per address
await contract.claim_airdrop(
  registry: "0xe61d07855e0430e75764f976e410c4dc746e7d7853dbca12d64f66d682d4bbf2",
  treasury_cap: "0xcd7fa386eae9701fd99db26527d3958e1ba564339d2f6c1b04037a03cf4daede"
)
```

#### 2. Play and Win
```typescript
// When player withdraws before explosion
await contract.play_and_win(
  bet: Coin<CKIE>,                    // Player's bet coins
  multiplier_percent: u64,             // e.g. 150 = 1.5x, 250 = 2.5x
  treasury_cap: "0xcd7fa386eae9701fd99db26527d3958e1ba564339d2f6c1b04037a03cf4daede"
)
```

#### 3. Play and Lose
```typescript
// When player withdraws after explosion
await contract.play_and_lose(
  bet: Coin<CKIE>,                    // Player's bet coins (will be burned)
  treasury_cap: "0xcd7fa386eae9701fd99db26527d3958e1ba564339d2f6c1b04037a03cf4daede"
)
```

#### 4. Helper: Calculate Multiplier (View Function)
```typescript
// Calculate multiplier based on time
let multiplier = await contract.calculate_multiplier_percent(
  time_ms: u64  // Time in milliseconds (e.g., 7000 for 7 seconds)
)
// Returns: 100-500 (100 = 1.0x, 500 = 5.0x max)
```

#### 5. Check Airdrop Status (View Function)
```typescript
let claimed = await contract.has_claimed_airdrop(
  registry: "0xe61d07855e0430e75764f976e410c4dc746e7d7853dbca12d64f66d682d4bbf2",
  player: address
)
// Returns: bool
```

---

## 🎲 Game Parameters

- **Min Bet**: 0.1 CKIE (100,000,000 NANOS)
- **Airdrop Amount**: 100 CKIE per address (one-time)
- **Explosion Window**: 5-10 seconds (frontend controlled)
- **Max Multiplier**: 5.0x (500%)
- **Reward Formula**: `1.0 + 0.1 × (time_ms - 5000)² / 1,000,000`

### Multiplier Examples:
```
Time     Multiplier    Profit
5.0s     1.00x        +0%
6.0s     1.10x        +10%
7.0s     1.40x        +40%
8.0s     1.90x        +90%
9.0s     2.60x        +160%
10.0s    3.50x        +250% (max)
```

---

## 📊 Events to Listen For

### AirdropClaimed
```typescript
{
  player: address,
  amount: u64  // 100 CKIE in NANOS
}
```

### GameWon
```typescript
{
  player: address,
  bet_amount: u64,
  reward_amount: u64,      // Minted reward
  total_received: u64      // Bet + reward
}
```

### GameLost
```typescript
{
  player: address,
  burned_amount: u64       // Coins burned forever
}
```

---

## 🔗 Useful Links

**Testnet Explorer**:
- Package: https://explorer.iota.cafe/object/0x737e8728621e615a706e76ab5e3c9a0aa89ad25b56e6eb1ee60480db86fcd30a?network=testnet
- Transaction: https://explorer.iota.cafe/txblock/641LKc2KyyMSuhhXc8qWve3QBbHXya52EiZ9khVTNFpV?network=testnet

**Testnet Faucet**: https://faucet.testnet.iota.cafe/

---

## 🧪 Testing Checklist

- [ ] Claim airdrop → Should receive 100 CKIE
- [ ] Check CKIE balance in wallet
- [ ] Play game and win → Should receive bet + reward
- [ ] Play game and lose → Coins should be burned
- [ ] Try claiming airdrop again → Should fail (already claimed)
- [ ] Verify min bet (0.1 CKIE) enforcement
- [ ] Test multiplier calculation at different times

---

## ⚠️ Important Notes

1. **TreasuryCap is Shared**: Anyone can call mint/burn functions, but your game logic controls when
2. **Airdrop is One-Time**: Registry tracks claimed addresses on-chain
3. **No Refunds**: Once coins are burned, they're gone forever
4. **Frontend Controls Timing**: Contract trusts frontend for explosion time
5. **Multiplier Cap**: Maximum 5x (500%) to prevent abuse

---

## 💾 Backup Files

- **Full Contract** (with on-chain logic): `sources/degen_cookie_full.move.backup`
- **Simple Contract** (current): `sources/degen_cookie.move`
- **Coin Module**: `sources/cookie_coin.move`

---

Generated: 2025-12-18
Network: IOTA Testnet
