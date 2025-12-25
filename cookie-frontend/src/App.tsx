import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useIotaClient,
} from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import {
  CONTRACT_CONFIG,
  GAME_CONFIG,
  calculateMultiplier,
  nanosToCkie,
  ckieToNanos,
} from './constants';

// Type for coin data from IOTA
interface CoinStruct {
  coinObjectId: string;
  balance: string;
  coinType: string;
  digest: string;
  version: string;
}

export default function App() {
    // IOTA wallet & blockchain state
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const client = useIotaClient();

    // Game state
    const [isRunning, setIsRunning] = useState(false);
    const [betAmount, setBetAmount] = useState(0.1);
    const [multiplier, setMultiplier] = useState(1.00);
    const [crashTime, setCrashTime] = useState(0);
    const [message, setMessage] = useState({
        text: '請連接 IOTA 錢包並輸入金額開始挑戰！',
        type: 'info'
    });

    // Blockchain state
    const [ckieBalance, setCkieBalance] = useState(0);
    const [hasClaimed, setHasClaimed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ckieCoins, setCkieCoins] = useState<CoinStruct[]>([]);
    const [pendingBet, setPendingBet] = useState(0); // Amount currently being bet

    // Refs for game loop
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);
    const multiplierRef = useRef(1.00);
    const betCoinIdRef = useRef<string | null>(null);

    useEffect(() => {
        multiplierRef.current = multiplier;
    }, [multiplier]);

    // Load CKIE balance and airdrop status
    useEffect(() => {
        if (currentAccount) {
            loadCKIEBalance();
            checkAirdropStatus();
        } else {
            setCkieBalance(0);
            setHasClaimed(false);
        }
    }, [currentAccount]);

    // Load CKIE balance
    const loadCKIEBalance = async () => {
        if (!currentAccount) return;

        try {
            const coins = await client.getCoins({
                owner: currentAccount.address,
                coinType: CONTRACT_CONFIG.CKIE_TYPE,
            });

            setCkieCoins(coins.data);

            const totalBalance = coins.data.reduce((sum, coin) =>
                sum + parseInt(coin.balance), 0
            );
            const balanceInCkie = nanosToCkie(totalBalance);
            setCkieBalance(balanceInCkie); // Display balance (updated from chain)

            // Simple heuristic: if you have CKIE, you've claimed airdrop
            if (balanceInCkie >= 100) {
                setHasClaimed(true);
            }
        } catch (error) {
            console.error('Error loading balance:', error);
        }
    };

    // Check if user has claimed airdrop
    const checkAirdropStatus = async () => {
        if (!currentAccount) return;

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_GAME}::has_claimed_airdrop`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.AIRDROP_REGISTRY),
                    tx.pure.address(currentAccount.address),
                ],
            });

            const result = await client.devInspectTransactionBlock({
                sender: currentAccount.address,
                transactionBlock: tx as any, // Type workaround for version mismatch
            });

            console.log('Airdrop check result:', result);

            // Parse the result (returns bool)
            if (result.results && result.results[0] && result.results[0].returnValues) {
                const returnValue: any = result.results[0].returnValues[0];
                const claimed = Array.isArray(returnValue) && returnValue[0] === 1;
                console.log('Has claimed:', claimed);
                setHasClaimed(claimed);
            }
        } catch (error) {
            console.log('Airdrop check failed (using balance heuristic):', error);
            // Already handled by balance check above
        }
    };

    // Claim airdrop
    const claimAirdrop = async () => {
        if (!currentAccount || hasClaimed) return;

        setIsLoading(true);
        setMessage({ text: '領取空投中...', type: 'info' });

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_GAME}::claim_airdrop`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.AIRDROP_REGISTRY),
                    tx.object(CONTRACT_CONFIG.TREASURY_CAP),
                ],
            });

            signAndExecuteTransaction(
                {
                    transaction: tx as any, // Type workaround for version mismatch
                },
                {
                    onSuccess: () => {
                        setMessage({ text: '✅ 成功領取 100 CKIE！', type: 'success' });
                        setHasClaimed(true);
                        setTimeout(() => {
                            loadCKIEBalance();
                            setMessage({ text: '準備好開始遊戲了嗎？', type: 'info' });
                        }, 3000);
                    },
                    onError: (error) => {
                        console.error('Airdrop error:', error);
                        const errorMsg = error.message || String(error);
                        if (errorMsg.includes('MoveAbort') && errorMsg.includes(', 1)')) {
                            setMessage({ text: '❌ 您已經領取過空投了！', type: 'error' });
                            setHasClaimed(true);
                        } else {
                            setMessage({ text: `❌ 領取失敗: ${errorMsg}`, type: 'error' });
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Error claiming airdrop:', error);
            const errorMsg = String(error);
            if (errorMsg.includes('MoveAbort') && errorMsg.includes(', 1)')) {
                setMessage({ text: '❌ 您已經領取過空投了！', type: 'error' });
                setHasClaimed(true);
            } else {
                setMessage({ text: '❌ 領取空投失敗', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Explosion handler
    const crashGame = useCallback((finalMultiplier: number) => {
        if (!isRunning) return;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setCrashTime(0);

        const lostAmount = pendingBet;

        setMessage({
            text: `
                <span class="text-2xl font-black">💥 餅乾爆炸了!</span><br/>
                <span class="text-sm">爆炸倍數: ${finalMultiplier.toFixed(2)}x</span><br/>
                <span class="text-sm text-red-600">損失: ${lostAmount.toFixed(2)} CKIE</span>
            `,
            type: 'error'
        });

        // Coins already burned at game start - nothing to do
        setPendingBet(0);
        betCoinIdRef.current = null;

        setTimeout(() => {
            setMultiplier(1.00);
            setMessage({ text: '點擊餅乾來收官，別讓它炸了！', type: 'info' });
        }, 4000);
    }, [isRunning, pendingBet]);

    // Cash out handler
    const cashOut = () => {
        if (!isRunning) return;
        const finalMultiplier = multiplierRef.current;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setCrashTime(0);

        const winnings = betAmount * finalMultiplier;

        setMessage({
            text: `
                <span class="text-xl font-bold">✅ 成功收官!</span><br/>
                <span class="text-sm">倍數: ${finalMultiplier.toFixed(2)}x</span><br/>
                <span class="text-sm text-green-600 font-bold">獲得: +${winnings.toFixed(2)} CKIE</span>
            `,
            type: 'success'
        });

        setPendingBet(0);

        // Mint the full winnings (bet was already burned)
        mintWinnings(winnings);

        setTimeout(() => {
            setMultiplier(1.00);
            setMessage({ text: '準備好下一場了嗎？', type: 'info' });
        }, 4000);
    };

    // Mint full winnings (bet + reward) on win
    const mintWinnings = async (winnings: number) => {
        if (!currentAccount) return;

        try {
            const winningsNanos = ckieToNanos(winnings);

            const tx = new Transaction();
            // Use airdrop function to mint directly to player
            tx.moveCall({
                target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_COIN}::airdrop`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.TREASURY_CAP),
                    tx.pure.address(currentAccount.address),
                    tx.pure.u64(winningsNanos),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx as any }, // Type workaround for version mismatch
                {
                    onSuccess: () => {
                        console.log('Winnings minted successfully:', winnings, 'CKIE');
                        setTimeout(() => loadCKIEBalance(), 2000); // Reload balance from chain
                    },
                    onError: (error) => {
                        console.error('Mint error:', error);
                        setTimeout(() => loadCKIEBalance(), 2000);
                    }
                }
            );
        } catch (error) {
            console.error('Error minting winnings:', error);
        }

        betCoinIdRef.current = null;
    };

    // Start game
    const startGame = async () => {
        if (!currentAccount) {
            setMessage({ text: '❌ 請先連接 IOTA 錢包！', type: 'error' });
            return;
        }

        const bet = betAmount;
        if (isNaN(bet) || bet < GAME_CONFIG.MIN_BET) {
            setMessage({ text: `❌ 請輸入至少 ${GAME_CONFIG.MIN_BET} CKIE。`, type: 'error' });
            return;
        }

        if (bet > ckieBalance) {
            setMessage({ text: '❌ 餘額不足！', type: 'error' });
            return;
        }

        // Find a coin to use for betting
        const betNanos = ckieToNanos(bet);
        const coin = ckieCoins.find(c => parseInt(c.balance) >= betNanos);

        if (!coin) {
            setMessage({ text: '❌ 沒有足夠的 CKIE 幣！', type: 'error' });
            return;
        }

        // Split coin if needed (coin is larger than bet)
        const coinBalance = parseInt(coin.balance);
        if (coinBalance > betNanos) {
            // Need to split coin first
            try {
                setIsLoading(true);
                const tx = new Transaction();
                const [splitCoin] = tx.splitCoins(tx.object(coin.coinObjectId), [tx.pure.u64(betNanos)]);
                tx.transferObjects([splitCoin], tx.pure.address(currentAccount.address));

                signAndExecuteTransaction(
                    { transaction: tx as any }, // Type workaround for version mismatch
                    {
                        onSuccess: (result) => {
                            console.log('Coin split successful:', result);
                            // Find the new split coin from the result
                            // For simplicity, we'll reload balance and use the smallest coin
                            setTimeout(async () => {
                                await loadCKIEBalance();
                                // Use the exact bet amount coin (the one we just created)
                                const updatedCoins = await client.getCoins({
                                    owner: currentAccount.address,
                                    coinType: CONTRACT_CONFIG.CKIE_TYPE,
                                });
                                const betCoin = updatedCoins.data.find(c => parseInt(c.balance) === betNanos);
                                if (betCoin) {
                                    betCoinIdRef.current = betCoin.coinObjectId;
                                    startGameAfterSplit(bet);
                                } else {
                                    setMessage({ text: '❌ 分割代幣失敗，請重試', type: 'error' });
                                    setIsLoading(false);
                                }
                            }, 2000);
                        },
                        onError: (error) => {
                            console.error('Split error:', error);
                            setMessage({ text: '❌ 分割代幣失敗', type: 'error' });
                            setIsLoading(false);
                        }
                    }
                );
            } catch (error) {
                console.error('Error splitting coin:', error);
                setMessage({ text: '❌ 分割代幣時發生錯誤', type: 'error' });
                setIsLoading(false);
            }
        } else {
            // Coin is exact size, use it directly
            betCoinIdRef.current = coin.coinObjectId;
            startGameAfterSplit(bet);
        }
    };

    // Actually start the game after coin is ready
    const startGameAfterSplit = (bet: number) => {
        // Burn the bet amount first
        burnBetToStart(bet);
    };

    // Burn bet coins at game start
    const burnBetToStart = async (bet: number) => {
        if (!currentAccount || !betCoinIdRef.current) return;

        setIsLoading(true);
        setMessage({ text: '正在投入賭注...', type: 'info' });

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_GAME}::play_and_lose`,
                arguments: [
                    tx.object(betCoinIdRef.current),
                    tx.object(CONTRACT_CONFIG.TREASURY_CAP),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx as any }, // Type workaround for version mismatch
                {
                    onSuccess: () => {
                        console.log('Bet burned, game starting');
                        // Now actually start the game
                        setIsRunning(true);
                        setMultiplier(1.00);
                        setBetAmount(bet);
                        setIsLoading(false);
                        setPendingBet(bet);
                        setMessage({ text: `遊戲進行中... 趕快點擊餅乾！`, type: 'info' });

                        // Set explosion time: random between 3-8 seconds
                        const crashDuration = Math.random() *
                            (GAME_CONFIG.MAX_TIME_MS - GAME_CONFIG.MIN_EXPLOSION_TIME_MS) +
                            GAME_CONFIG.MIN_EXPLOSION_TIME_MS;
                        startTimeRef.current = Date.now();
                        setCrashTime(startTimeRef.current + crashDuration);

                        // Update balance after burn
                        setTimeout(() => void loadCKIEBalance(), 2000);
                    },
                    onError: (error) => {
                        console.error('Burn error:', error);
                        setMessage({ text: '❌ 投入賭注失敗', type: 'error' });
                        setIsLoading(false);
                        betCoinIdRef.current = null;
                    }
                }
            );
        } catch (error) {
            console.error('Error burning bet:', error);
            setMessage({ text: '❌ 投入賭注時發生錯誤', type: 'error' });
            setIsLoading(false);
        }
    };

    // Game loop
    useEffect(() => {
        if (isRunning && crashTime > 0) {
            const update = () => {
                const now = Date.now();
                if (now >= crashTime) {
                    crashGame(multiplierRef.current);
                    return;
                }
                const elapsedTime = now - startTimeRef.current;
                setMultiplier(calculateMultiplier(elapsedTime));
            };
            intervalRef.current = setInterval(update, 50) as any;
            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [isRunning, crashTime, crashGame]);

    const cookieScale = Math.min(4.0, 1.0 + (multiplier - 1.0) * 1.2);
    const displayMultiplier = multiplier.toFixed(2);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 text-gray-800 font-sans">
            <div className="w-full max-w-lg bg-white p-8 md:p-10 shadow-2xl rounded-3xl border border-gray-100 relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-xl font-black text-amber-800 tracking-tight">COOKIE CRASH</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">IOTA Edition</p>
                    </div>
                    <ConnectButton />
                </div>

                {/* CKIE Balance & Airdrop */}
                {currentAccount && (
                    <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-600">CKIE 餘額:</span>
                            <span className="text-xl font-black text-amber-600">{ckieBalance.toFixed(2)} CKIE</span>
                        </div>
                        {!hasClaimed && ckieBalance < 10 && (
                            <button
                                onClick={claimAirdrop}
                                disabled={isLoading}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? '領取中...' : '🎁 領取 100 CKIE 空投'}
                            </button>
                        )}
                    </div>
                )}

                {/* Game Display */}
                <div className="relative flex flex-col items-center justify-center h-80 bg-gradient-to-b from-amber-50/50 to-white rounded-2xl mb-8 border border-amber-100 shadow-inner">
                    <div
                        className={`text-6xl font-black mb-4 transition-colors duration-200
                            ${isRunning ? 'text-amber-600' :
                             message.type === 'error' ? 'text-red-500' : 'text-gray-200'}`}
                    >
                        {message.type === 'error' && !isRunning ? 'CRASHED' : `${displayMultiplier}x`}
                    </div>

                    {/* Interactive Cookie */}
                    <button
                        onClick={cashOut}
                        disabled={!isRunning}
                        className={`text-9xl transition-all duration-75 transform hover:brightness-110 active:scale-90 select-none outline-none
                            ${isRunning ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{
                            transform: `scale(${message.type === 'error' && !isRunning ? 0 : cookieScale})`,
                            filter: isRunning ? 'drop-shadow(0 15px 20px rgba(180, 83, 9, 0.25))' : 'none'
                        }}
                    >
                        🍪
                    </button>

                    {isRunning && (
                        <div className="absolute top-4 right-4 flex items-center space-x-1">
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                            <span className="text-[10px] font-bold text-red-500 tracking-tighter">LIVE</span>
                        </div>
                    )}
                </div>

                {/* Input & Controls */}
                <div className="space-y-4">
                    {!isRunning ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">投入金額 (CKIE)</label>
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                                    min={GAME_CONFIG.MIN_BET}
                                    step="0.1"
                                    className="block w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xl font-bold focus:border-amber-400 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button
                                onClick={startGame}
                                disabled={isLoading || !currentAccount || ckieBalance < GAME_CONFIG.MIN_BET}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {!currentAccount ? '請先連接錢包' :
                                 ckieBalance < GAME_CONFIG.MIN_BET ? '餘額不足 (領取空投)' :
                                 '開始挑戰'}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4 bg-amber-600 text-white font-black rounded-2xl animate-pulse cursor-pointer shadow-lg" onClick={cashOut}>
                            快點擊上面的餅乾收官！
                        </div>
                    )}
                </div>

                {/* Message */}
                <div className={`mt-6 p-5 text-center rounded-2xl min-h-[90px] flex items-center justify-center transition-all border
                    ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
                      message.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                      'bg-gray-50 border-gray-100 text-gray-500'}`}>
                    <p className="font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: message.text }} />
                </div>

                {currentAccount && (
                    <div className="mt-6 text-center">
                        <span className="text-[9px] text-gray-300 font-mono tracking-tighter">
                            Connected: {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
