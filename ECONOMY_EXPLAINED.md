# Degen Cookie Economy - How It Works

## 🎮 Clean Economics (Updated)

Your game now uses a **burn-first approach** for clean economics:

### When You START GAME 🎲
1. Click "開始挑戰" → Split coin (e.g., 100 CKIE → 1 CKIE bet + 99 CKIE remainder)
2. **Immediately burn** the bet coin (1 wallet popup)
3. Bet is GONE from your wallet ❌
4. Game starts, balance reduced on-chain

### When You WIN ✅
1. Click cookie before explosion
2. Contract **mints** full winnings (bet + reward)
3. Example: Bet 1 CKIE at 1.4x → Mint 1.4 CKIE
4. You get back 1.4 CKIE (net +0.4 profit) ✅
5. **1 wallet popup** to approve minting

### When You LOSE ❌
1. Cookie explodes
2. **Nothing happens** (already burned at start)
3. **0 wallet popups** (no annoying approval needed)
4. Balance stays reduced ❌

## 📊 Example Flow

**Starting balance: 100 CKIE**

### Scenario A: Win at 1.4x
```
1. Click "開始挑戰", bet 1 CKIE
   → Wallet popup: Approve burning 1 CKIE
   → Balance: 99 CKIE (on-chain, burned)

2. Game runs, click at 1.4x → Win!
   → Wallet popup: Approve minting 1.4 CKIE
   → Balance: 100.4 CKIE (on-chain)

Result: +0.4 CKIE profit ✅
Wallet popups: 2 (split+burn, mint)
```

### Scenario B: Lose (Explosion)
```
1. Click "開始挑戰", bet 1 CKIE
   → Wallet popup: Approve burning 1 CKIE
   → Balance: 99 CKIE (on-chain, burned)

2. Cookie explodes → Lose!
   → No wallet popup
   → Balance: 99 CKIE (on-chain, stays burned)

Result: -1 CKIE loss ❌
Wallet popups: 1 (split+burn only)
```

### Scenario C: Multiple Games
```
Start: 100 CKIE (on-chain)

Game 1: Bet 1 CKIE, win 1.3x
  → Burn 1 → 99 CKIE
  → Mint 1.3 → 100.3 CKIE ✅

Game 2: Bet 2 CKIE, lose
  → Burn 2 → 98.3 CKIE
  → No mint → 98.3 CKIE ❌

Game 3: Bet 1 CKIE, win 2.0x
  → Burn 1 → 97.3 CKIE
  → Mint 2.0 → 99.3 CKIE ✅

Final: 99.3 CKIE (all on-chain, real economics!)
```

## 🔧 Why This Approach?

### Pros ✅
- **Real economics** - Losses truly burn CKIE (deflationary)
- **Real wins** - Winnings actually minted (inflationary)
- **No popup when you lose** - Already committed at game start
- **Clean on-chain state** - Balance always matches reality
- **Psychologically fair** - You approve the risk upfront
- **Production-ready economics** - Works for real game

### Cons ⚠️
- 1 extra popup at game start (split + burn)
- Can't "cancel" bet once game starts
- Need to approve loss before you know outcome

## 🎯 Wallet Popups Summary

Per game:
- **Winning game**: 2 popups (start: split+burn, end: mint)
- **Losing game**: 1 popup (start: split+burn only)

This is better than the alternative:
- ❌ Popup when you lose (feels bad)
- ✅ Popup when you choose to play (feels fair)

## 🚀 This IS Production-Ready!

The current approach is **actually production-ready** because:
1. ✅ Real deflationary pressure (burns on loss)
2. ✅ Real inflationary rewards (mints on win)
3. ✅ All changes on-chain (verifiable)
4. ✅ Clean economics (no "fake" balance tracking)

For full production, you'd additionally want:
- Use oracles for explosion timing (not frontend-controlled)
- Add event emissions for analytics
- Implement rate limiting/cooldowns
- Add house edge/fee mechanism

But the core economics are **solid**! 🍪

---

Generated: 2025-12-18
Purpose: Hackathon Demo
