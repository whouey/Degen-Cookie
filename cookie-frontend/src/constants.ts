// Degen Cookie Contract Configuration
// Network: IOTA Testnet

export const CONTRACT_CONFIG = {
  // Package ID (your deployed contract) - UPDATED with 3-8s timing
  PACKAGE_ID: "0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99",

  // Shared Objects
  TREASURY_CAP: "0xfc7a142f64359332aab0de311f83dc93e83f314908ee349f640f4e95b22e2890",
  AIRDROP_REGISTRY: "0x45ba31762e08f00c47c1bac677af8900d4d1044d69cb81f658eaa9eef46c8544",

  // Coin Type (for CKIE token)
  CKIE_TYPE: `0x530561712247f71c361c14555ac789c6790ce24ae432aa2fb4604d7b466b9c99::cookie_coin::COOKIE_COIN`,

  // Module Names
  MODULE_GAME: "degen_cookie",
  MODULE_COIN: "cookie_coin",
};

// Game Parameters (matching frontend 3-8s logic)
export const GAME_CONFIG = {
  MIN_BET: 0.1, // 0.1 CKIE
  MIN_BET_NANOS: 100_000_000, // 0.1 CKIE in nanos (9 decimals)

  AIRDROP_AMOUNT: 100, // 100 CKIE
  AIRDROP_AMOUNT_NANOS: 100_000_000_000, // 100 CKIE in nanos

  // Time window (Frontend: 3-8 seconds)
  MIN_SAFE_TIME_MS: 3000,  // 3 seconds
  MAX_TIME_MS: 8000,       // 8 seconds
  MIN_EXPLOSION_TIME_MS: 3000,
  MAX_EXPLOSION_TIME_MS: 8000,

  // Multiplier
  MAX_MULTIPLIER: 3.5,      // 3.5x max at 8s
  MAX_MULTIPLIER_PERCENT: 350, // 350% for contract call

  // Display
  DECIMALS: 9,
  TICKER: "CKIE",
};

/**
 * Calculate multiplier matching frontend formula
 * Formula: t <= 3s: 1.0x, t > 3s: 1.0 + 0.1 × (t - 3)²
 *
 * @param elapsedTimeMs - Time elapsed in milliseconds
 * @returns Multiplier as a decimal (e.g., 1.5 for 1.5x)
 */
export function calculateMultiplier(elapsedTimeMs: number): number {
  const t = elapsedTimeMs / 1000; // Convert to seconds

  if (t <= 3) {
    return 1.0; // No reward, return bet only
  }

  // Parabolic growth: 1.0 + 0.1 × (t - 3)²
  const multiplier = 1.0 + 0.1 * Math.pow(t - 3, 2);

  // Cap at max (3.5x at 8 seconds)
  return Math.min(multiplier, GAME_CONFIG.MAX_MULTIPLIER);
}

/**
 * Convert multiplier to percent for contract call
 * @param multiplier - Multiplier as decimal (e.g., 1.5)
 * @returns Multiplier as percent for contract (e.g., 150)
 */
export function multiplierToPercent(multiplier: number): number {
  return Math.round(multiplier * 100);
}

/**
 * Convert CKIE amount to nanos (9 decimals)
 */
export function ckieToNanos(ckie: number): number {
  return Math.round(ckie * Math.pow(10, GAME_CONFIG.DECIMALS));
}

/**
 * Convert nanos to CKIE display value
 */
export function nanosToCkie(nanos: number | string): number {
  const value = typeof nanos === 'string' ? parseInt(nanos) : nanos;
  return value / Math.pow(10, GAME_CONFIG.DECIMALS);
}
