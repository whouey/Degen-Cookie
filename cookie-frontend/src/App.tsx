import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ConnectButton, 
  useCurrentAccount, 
} from '@iota/dapp-kit';


/**
 * 倍數計算公式:
 * 前3秒: 返還本金 (1倍)
 * 3秒後: 1.0 + 0.1 × (t - 3)²，到8秒給3.5倍
 */
const calculateMultiplier = (elapsedTime) => {
    const t = elapsedTime / 1000;
    if (t <= 3) {
        return 1.0;
    } else {
        // 拋物線增長: 1.0 + 0.1 × (t - 3)²
        return 1.0 + 0.1 * Math.pow(t - 3, 2);
    }
};

export default function App() {
    // IOTA 錢包狀態 (目前使用 Mock 資料以確保預覽正常)
    const currentAccount = useCurrentAccount();
    
    // 遊戲狀態
    const [isRunning, setIsRunning] = useState(false);
    const [betAmount, setBetAmount] = useState(0.1);
    const [multiplier, setMultiplier] = useState(1.00);
    const [crashTime, setCrashTime] = useState(0);
    const [message, setMessage] = useState({ 
        text: '請連接 IOTA 錢包並輸入金額開始挑戰！', 
        type: 'info'
    });

    // Refs 用於計時器與即時數值追蹤
    const intervalRef = useRef(null);
    const startTimeRef = useRef(0);
    const multiplierRef = useRef(1.00); 

    useEffect(() => {
        multiplierRef.current = multiplier;
    }, [multiplier]);

    // 爆炸處理
    const crashGame = useCallback((finalMultiplier) => {
        if (!isRunning) return;
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setCrashTime(0);

        setMessage({
            text: `
                <span class="text-2xl font-black">💥 餅乾爆炸了!</span><br/>
                <span class="text-sm">爆炸倍數: ${finalMultiplier.toFixed(2)}x</span><br/>
                <span class="text-sm">損失: ${betAmount} IOTA</span>
            `,
            type: 'error'
        });

        setTimeout(() => {
            setMultiplier(1.00);
            setMessage({ text: '點擊餅乾來收官，別讓它炸了！', type: 'info' });
        }, 4000);
    }, [isRunning, betAmount]);

    // 收官處理
    const cashOut = () => {
        if (!isRunning) return;
        const finalMultiplier = multiplierRef.current;
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setCrashTime(0);

        const winnings = betAmount * finalMultiplier;
        const netProfit = winnings - betAmount;

        setMessage({
            text: `
                <span class="text-xl font-bold">✅ 成功收官!</span><br/>
                <span class="text-sm">倍數: ${finalMultiplier.toFixed(2)}x</span><br/>
                <span class="text-sm text-green-600 font-bold">獲得: ${winnings.toFixed(2)} IOTA</span>
            `,
            type: 'success'
        });

        setTimeout(() => {
            setMultiplier(1.00);
            setMessage({ text: '準備好下一場了嗎？', type: 'info' });
        }, 4000);
    };

    // 開始挑戰
    const startGame = () => {
        if (!currentAccount) {
            setMessage({ text: '❌ 請先連接 IOTA 錢包！', type: 'error' });
            return;
        }

        const bet = parseFloat(betAmount);
        if (isNaN(bet) || bet < 0.1) {
            setMessage({ text: '❌ 請輸入至少 0.1 IOTA。', type: 'error' });
            return;
        }

        setIsRunning(true);
        setMultiplier(1.00);
        setBetAmount(bet); 
        setMessage({ text: `遊戲進行中... 趕快點擊餅乾！`, type: 'info' });

        // 設定爆炸時間：隨機在 3s 到 8s 之間
        const crashDuration = Math.random() * (8000 - 3000) + 3000;
        startTimeRef.current = Date.now();
        setCrashTime(startTimeRef.current + crashDuration);
    };

    // 遊戲循環
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
            intervalRef.current = setInterval(update, 50);
            return () => clearInterval(intervalRef.current);
        }
    }, [isRunning, crashTime, crashGame]);

    const cookieScale = Math.min(4.0, 1.0 + (multiplier - 1.0) * 1.2);
    const displayMultiplier = multiplier.toFixed(2);
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 text-gray-800 font-sans">
            <div className="w-full max-w-lg bg-white p-8 md:p-10 shadow-2xl rounded-3xl border border-gray-100 relative overflow-hidden">
                
                {/* 頂部錢包連接區 */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-xl font-black text-amber-800 tracking-tight">COOKIE CRASH</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">IOTA Edition</p>
                    </div>
                    <ConnectButton />
                </div>

                {/* 遊戲顯示區 */}
                <div className="relative flex flex-col items-center justify-center h-80 bg-gradient-to-b from-amber-50/50 to-white rounded-2xl mb-8 border border-amber-100 shadow-inner">
                    <div 
                        className={`text-6xl font-black mb-4 transition-colors duration-200 
                            ${isRunning ? 'text-amber-600' : 
                             message.type === 'error' ? 'text-red-500' : 'text-gray-200'}`}
                    >
                        {message.type === 'error' && !isRunning ? 'CRASHED' : `${displayMultiplier}x`}
                    </div>
                    
                    {/* 互動餅乾 */}
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
                            <span className="text-[10px] font-bold text-red-500 tracking-tighter">IOTA LIVE</span>
                        </div>
                    )}
                </div>

                {/* 輸入與操作區 */}
                <div className="space-y-4">
                    {!isRunning ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">投入金額 (IOTA)</label>
                                <input 
                                    type="number" 
                                    value={betAmount} 
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    min="0.1" step="0.1"
                                    className="block w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xl font-bold focus:border-amber-400 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button 
                                onClick={startGame}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-200 transition-all active:scale-95"
                            >
                                {!currentAccount ? '請先連接錢包' : '開始挑戰'}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4 bg-amber-600 text-white font-black rounded-2xl animate-pulse cursor-pointer shadow-lg" onClick={cashOut}>
                            快點擊上面的餅乾收官！
                        </div>
                    )}
                </div>

                {/* 結果訊息 */}
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