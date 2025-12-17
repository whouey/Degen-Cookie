# Degen Cookie - Testnet Deployment Info (UPDATED - 3-8s Timing)

## 🎯 Deployment Summary
- **Network**: IOTA Testnet
- **Status**: ✅ Successfully Redeployed with 3-8s timing
- **Transaction Digest**: `9mDumuAoKFLD8jTHvg3TbsmwDKYZ6WEWp5RvgTEv3qj5`
- **Gas Cost**: 30.115600 NANOS (~0.03 IOTA)
- **Deployer Address**: `0xe1ffdf8012451e724480afd209930d1a779b8895de34aa078e2a5f01864c29a1`
- **Updated**: 2025-12-18 (to match frontend 3-8s timing)

---

## 📦 Package Information

**Package ID** (Most Important!)
```
0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99
```

**Modules**:
- `cookie_coin` - CKIE token implementation
- `degen_cookie` - Game logic (3-8s timing, max 3.5x)

---

## 🔑 Critical Object IDs (For Frontend)

### 1. TreasuryCap (Shared Object) ⭐⭐⭐
**Used for: Minting/Burning CKIE coins**
```
0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890
```
- Type: `TreasuryCap<COOKIE_COIN>`
- Owner: Shared
- All `play_and_win` and `play_and_lose` calls need this!

### 2. AirdropRegistry (Shared Object) ⭐⭐⭐
**Used for: Claiming airdrop**
```
0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544
```
- Type: `AirdropRegistry`
- Owner: Shared
- Tracks which addresses have claimed airdrop

### 3. CoinMetadata (Immutable)
**Used for: Displaying coin info**
```
0xf11a4de7a3923f44f7aa2fb8942c568b3f533c1e7192b7f97e53c645b5fbc5db
```
- Type: `CoinMetadata<COOKIE_COIN>`
- Symbol: CKIE
- Decimals: 9
- Name: "Cookie Coin"

### 4. UpgradeCap (Your Control)
**Used for: Upgrading contract (if needed later)**
```
0x4d74c22f97bffd736ff9f285fd36e2da44e89ad3f213a69775bc6db61687edb1
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
  registry: "0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544",
  treasury_cap: "0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890"
)
```

#### 2. Play and Win
```typescript
// When player withdraws before explosion
await contract.play_and_win(
  bet: Coin<CKIE>,                    // Player's bet coins
  multiplier_percent: u64,             // e.g. 150 = 1.5x, 250 = 2.5x
  treasury_cap: "0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890"
)
```

#### 3. Play and Lose
```typescript
// When player withdraws after explosion
await contract.play_and_lose(
  bet: Coin<CKIE>,                    // Player's bet coins (will be burned)
  treasury_cap: "0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890"
)
```

#### 4. Helper: Calculate Multiplier (View Function)
```typescript
// Calculate multiplier based on time
let multiplier = await contract.calculate_multiplier_percent(
  time_ms: u64  // Time in milliseconds (e.g., 5000 for 5 seconds)
)
// Returns: 100-350 (100 = 1.0x, 350 = 3.5x max)
```

#### 5. Check Airdrop Status (View Function)
```typescript
let claimed = await contract.has_claimed_airdrop(
  registry: "0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544",
  player: address
)
// Returns: bool
```

---

## 🎲 Game Parameters (UPDATED - 3-8s)

- **Min Bet**: 0.1 CKIE (100,000,000 NANOS)
- **Airdrop Amount**: 100 CKIE per address (one-time)
- **Explosion Window**: **3-8 seconds** (frontend controlled)
- **Max Multiplier**: **3.5x** (350%)
- **Reward Formula**: `1.0 + 0.1 × (time_s - 3)²`

### Multiplier Examples (3-8s timing):
```
Time     Multiplier    Profit
3.0s     1.00x        +0%    (safe exit)
4.0s     1.10x        +10%
5.0s     1.40x        +40%
6.0s     1.90x        +90%
7.0s     2.60x        +160%
8.0s     3.50x        +250%  (max!)
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
- Package: https://explorer.iota.cafe/object/0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99?network=testnet
- Transaction: https://explorer.iota.cafe/txblock/9mDumuAoKFLD8jTHvg3TbsmwDKYZ6WEWp5RvgTEv3qj5?network=testnet

**Testnet Faucet**: https://faucet.testnet.iota.cafe/

---

## 🧪 Testing Checklist

- [ ] Claim airdrop → Should receive 100 CKIE
- [ ] Check CKIE balance in wallet
- [ ] Play game and win (before 8s) → Should receive bet + reward
- [ ] Play game and lose (after explosion) → Coins should be burned
- [ ] Try claiming airdrop again → Should fail (already claimed)
- [ ] Verify min bet (0.1 CKIE) enforcement
- [ ] Test multiplier: 3s = 1.0x, 8s = 3.5x

---

## ⚠️ Important Notes

1. **TreasuryCap is Shared**: Anyone can call mint/burn functions, but your game logic controls when
2. **Airdrop is One-Time**: Registry tracks claimed addresses on-chain
3. **No Refunds**: Once coins are burned, they're gone forever
4. **Frontend Controls Timing**: Contract trusts frontend for explosion time (3-8s window)
5. **Multiplier Cap**: Maximum 3.5x (350%) at 8 seconds
6. **Updated Timing**: Contract now matches frontend (3-8s instead of 5-10s)

---

## 💾 Backup Files

- **Full Contract** (with on-chain logic): `sources/degen_cookie_full.move.backup`
- **Simple Contract** (current): `sources/degen_cookie.move`
- **Coin Module**: `sources/cookie_coin.move`

---

## 📝 Change Log

### v2 (2025-12-18)
- ✅ Updated timing: 5-10s → **3-8s** (matches frontend)
- ✅ Updated max multiplier: 5.0x → **3.5x**
- ✅ Updated formula: now uses 3s safe zone
- ✅ Redeployed to testnet

### v1 (2025-12-18)
- Initial deployment with 5-10s timing

---

Generated: 2025-12-18
Network: IOTA Testnet
Version: 2 (3-8s timing)
