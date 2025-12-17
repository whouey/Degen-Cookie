# Testing Guide - How to See Function Results

## 🎯 Understanding Function Types

### **Entry Functions** (Changes State)
- Execute as transactions
- Modify blockchain state (mint, burn, transfer)
- Results visible through **events** and **object changes**
- Examples: `claim_airdrop()`, `play_and_win()`, `play_and_lose()`

### **View Functions** (Read-Only)
- Don't change state
- Return values directly
- Must use SDK/RPC, not CLI transactions
- Examples: `calculate_multiplier_percent()`, `has_claimed_airdrop()`

---

## 📋 Method 1: Using IOTA CLI for Entry Functions

### Example: Test Airdrop Claim

```bash
# Step 1: Check if you've claimed (view function - won't show return in CLI)
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function has_claimed_airdrop \
  --args 0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544 YOUR_ADDRESS \
  --gas-budget 10000000

# Step 2: Actually claim airdrop (entry function)
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function claim_airdrop \
  --args 0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544 \
        0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890 \
  --gas-budget 50000000
```

**Where to see results:**
```
Transaction Effects:
  Created Objects:  <-- Look here for new CKIE coins!
    ┌──
    │ ObjectID: 0xabc123...  <-- This is your 100 CKIE!
    │ ObjectType: Coin<COOKIE_COIN>
    └──
```

---

## 🔍 Method 2: Using IOTA Explorer (Easiest!)

### **Step 1: Execute Transaction**
```bash
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function calculate_multiplier_percent \
  --args 5000 \
  --gas-budget 10000000
```

### **Step 2: Copy Transaction Digest**
Look for:
```
Transaction Digest: E9MEoS1ZmuVRKg3GLi5zQztr8ZWVvY1RTJZvMF6mPRA6
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

### **Step 3: View in Explorer**
1. Go to: https://explorer.iota.cafe/txblock/E9MEoS1ZmuVRKg3GLi5zQztr8ZWVvY1RTJZvMF6mPRA6?network=testnet
2. Click **"User Signatures"** tab
3. Scroll to **"Transaction Block"** section
4. Look for **Return Values** (if displayed)

---

## 💻 Method 3: Using TypeScript SDK (Best for View Functions)

### Install SDK
```bash
npm install @iota/iota-sdk
```

### Call View Function
```typescript
import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
  url: 'https://api.testnet.iota.cafe'
});

// Call view function and see result!
const result = await client.devInspectTransactionBlock({
  sender: '0xe1ffdf8012451e724480afd209930d1a779b8895de34aa078e2a5f01864c29a1',
  transactionBlock: {
    kind: 'moveCall',
    data: {
      packageObjectId: '0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99',
      module: 'degen_cookie',
      function: 'calculate_multiplier_percent',
      typeArguments: [],
      arguments: ['5000'] // 5 seconds
    }
  }
});

console.log('Result:', result.results[0].returnValues);
// Output: [[140, 1]] → 140 means 1.4x multiplier!
```

---

## 🧪 Practical Testing Examples

### **Example 1: Test Multiplier Calculation**

**Test at 3 seconds (should return 100 = 1.0x):**
```bash
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function calculate_multiplier_percent \
  --args 3000 \
  --gas-budget 10000000
```

**Test at 5 seconds (should return 140 = 1.4x):**
```bash
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function calculate_multiplier_percent \
  --args 5000 \
  --gas-budget 10000000
```

**Test at 8 seconds (should return 350 = 3.5x):**
```bash
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function calculate_multiplier_percent \
  --args 8000 \
  --gas-budget 10000000
```

⚠️ **Note**: CLI won't show the return value directly. Use SDK or check objects!

---

## 📊 How to Read Transaction Output

### **Example Output:**
```
Transaction Effects:
  Status: Success ✅

  Created Objects:        <-- New objects created
    ObjectID: 0xabc...
    ObjectType: Coin<COOKIE_COIN>

  Mutated Objects:        <-- Objects modified
    ObjectID: 0xdef...

  Transaction Events:     <-- Events emitted by contract
    - AirdropClaimed
      player: 0x...
      amount: 100000000000

  Balance Changes:        <-- Your wallet balance changes
    Amount: +100 CKIE ✅
```

### **What to Look For:**

1. **Status: Success** → Function executed
2. **Created Objects** → New coins/objects created
3. **Events** → Contract emitted events (GameWon, GameLost, etc.)
4. **Balance Changes** → Your CKIE balance changed

---

## 🎮 Testing Your Game Functions

### **Test 1: Claim Airdrop**
```bash
iota client call \
  --package 0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99 \
  --module degen_cookie \
  --function claim_airdrop \
  --args 0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544 \
        0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890 \
  --gas-budget 50000000
```

**Expected Result:**
- ✅ Created Object: Coin<COOKIE_COIN> with 100 CKIE
- ✅ Event: AirdropClaimed
- ✅ Balance: +100 CKIE

### **Test 2: Check Your CKIE Balance**
```bash
iota client gas --coin-type "0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99::cookie_coin::COOKIE_COIN"
```

This shows all your CKIE coins!

---

## 🔗 Quick Links

**Your Package on Explorer:**
https://explorer.iota.cafe/object/0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99?network=testnet

**Check Any Transaction:**
https://explorer.iota.cafe/txblock/PASTE_DIGEST_HERE?network=testnet

**Get Testnet IOTA (for gas):**
https://faucet.testnet.iota.cafe/

---

## 💡 Pro Tips

1. **View Functions**: Use SDK/frontend, not CLI transactions
2. **Entry Functions**: CLI works great, check events & objects
3. **Always check**: Transaction Digest in explorer for details
4. **Events**: Best way to see game results (won/lost)
5. **Balance**: Use `iota client gas --coin-type` to see CKIE

---

Generated: 2025-12-18
