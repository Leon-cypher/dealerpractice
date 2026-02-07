import React, { useState, useEffect, useMemo } from 'react';
import * as PotCalc from './utils/potCalculator';
import * as PokerLogic from './utils/pokerLogic';
import { Trophy, RefreshCw, CheckCircle2, XCircle, Info, Users, Coins, ArrowRight, Wallet, Medal, Eye, Calculator, Star, Flame } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MainMode = 'SPLIT_POT' | 'SHOWDOWN';

// --- Card Component ---
const PokerCard: React.FC<{ card: PokerLogic.Card; hidden?: boolean; className?: string; style?: React.CSSProperties; mini?: boolean }> = ({ card, hidden, className, style, mini }) => {
  if (hidden) {
    return (
      <div 
        style={style}
        className={cn("poker-card bg-slate-900 border-slate-700", className)}
      >
        <div className="text-slate-700 font-black text-xl">?</div>
      </div>
    );
  }

  const suitSymbol = {
    'spades': '♠',
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣'
  }[card.suit];
  
  return (
    <div 
      style={style}
      className={cn(
        mini ? "mini-card" : "poker-card",
        card.suit,
        className
      )}
    >
      <div className={mini ? "" : "text-lg md:text-xl"}>{card.rank}</div>
      {!mini && <div className="text-[10px] md:text-xs opacity-80">{suitSymbol}</div>}
      {mini && <span className="ml-0.5">{suitSymbol}</span>}
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<MainMode>('SPLIT_POT');
  const [variant, setVariant] = useState<PokerLogic.GameVariant>('HOLDEM');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  const [potPlayers, setPotPlayers] = useState<PotCalc.Player[]>([]);
  const [stage, setStage] = useState<'POTS' | 'PAYOUTS'>('POTS');
  const [potAnswers, setPotAnswers] = useState<Record<string, string>>({});
  const [payoutAnswers, setPayoutAnswers] = useState<Record<number, string>>({});
  const [showPotResult, setShowPotResult] = useState(false);
  const [correctPots, setCorrectPots] = useState<PotCalc.PotStage[]>([]);
  const [correctPayouts, setCorrectPayouts] = useState<Record<number, number>>({});

  const [showdown, setShowdown] = useState<any>(null);
  const [userHighWinnerIds, setUserHighWinnerIds] = useState<number[]>([]);
  const [userLowWinnerIds, setUserLowWinnerIds] = useState<number[]>([]);
  const [showShowdownResult, setShowShowdownResult] = useState(false);

  const updateStreak = (correct: boolean) => {
    if (correct) {
      setStreak(s => {
        const next = s + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const initSplitPot = () => {
    const players = PotCalc.generateRandomScenario();
    const pots = PotCalc.calculatePots(players);
    setPotPlayers(players);
    setCorrectPots(pots);
    setCorrectPayouts(PotCalc.calculatePayouts(players, pots));
    setPotAnswers({});
    setPayoutAnswers({});
    setShowPotResult(false);
    setStage('POTS');
  };

  const initShowdown = () => {
    const playerCount = Math.random() > 0.5 ? 2 : 3;
    const scenario = PokerLogic.generateShowdownScenario(playerCount, variant);
    setShowdown(scenario);
    setUserHighWinnerIds([]);
    setUserLowWinnerIds([]);
    setShowShowdownResult(false);
  };

  useEffect(() => {
    if (mode === 'SPLIT_POT') initSplitPot();
    else initShowdown();
  }, [mode, variant]);

  const renderSplitPot = () => {
    const isPotCorrect = (potName: string) => parseInt(potAnswers[potName] || '0') === correctPots.find(p => p.name === potName)?.amount;
    const isPayoutCorrect = (playerId: number) => Number(payoutAnswers[playerId] || 0) === correctPayouts[playerId];
    const allPotsCorrect = correctPots.every(pot => parseInt(potAnswers[pot.name] || '0') === pot.amount);
    const allPayoutsCorrect = potPlayers.every(p => Number(payoutAnswers[p.id] || 0) === correctPayouts[p.id]);

    const handlePotCheck = () => {
      setShowPotResult(true);
      if (!allPotsCorrect) updateStreak(false);
    };

    const handlePayoutCheck = () => {
      setShowPotResult(true);
      updateStreak(allPayoutsCorrect);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-[2rem] backdrop-blur-md shadow-2xl relative overflow-hidden">
            <h2 className="text-[8px] md:text-[10px] font-black text-poker-gold uppercase tracking-[0.2em] md:tracking-[0.4em] mb-4 md:mb-6 flex items-center gap-2">
              <Users className="w-3 h-3" /> 玩家下注詳情
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {potPlayers.map(player => (
                <div key={player.id} className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-xl md:rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-lg md:text-xl">
                        {player.name.slice(-1)}
                      </div>
                      {player.isAllIn && <div className="absolute -top-1 -right-1 bg-red-600 text-[6px] font-black px-1 rounded-sm border border-white/20 uppercase">ALL IN</div>}
                    </div>
                    <div>
                      <div className="text-slate-200 text-sm md:text-base font-bold">{player.name}</div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Active</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-black font-mono text-white tracking-tighter">
                      <span className="text-poker-gold/50 text-xs md:text-sm mr-0.5">$</span>
                      {player.bet.toLocaleString()}
                    </div>
                    {stage === 'PAYOUTS' && <div className={cn("text-[8px] font-black px-1.5 py-0.5 rounded mt-1 inline-block uppercase", player.rank === 1 ? "bg-green-500 text-white" : "bg-white/10 text-slate-400")}>{player.rankName}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stage === 'PAYOUTS' && (
            <div className="bg-gradient-to-r from-poker-gold/10 to-transparent border border-poker-gold/20 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl">
              <h3 className="text-[8px] md:text-[10px] font-black text-poker-gold uppercase tracking-[0.2em] md:tracking-[0.4em] mb-4 flex items-center gap-2">
                <Coins className="w-3 h-3" /> 已確認底池
              </h3>
              <div className="flex flex-wrap gap-2 md:gap-4">
                {correctPots.map(pot => (
                  <div key={pot.name} className="bg-black/60 border border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl min-w-[120px] md:min-w-[150px] shadow-lg relative">
                    <div className="absolute top-2 right-2 flex gap-0.5">
                      {pot.eligiblePlayerIds.map(id => (
                        <div key={id} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-poker-gold/20 border border-poker-gold/40 flex items-center justify-center text-[6px] md:text-[7px] text-poker-gold font-bold">
                          {potPlayers.find(p => p.id === id)?.name.slice(-1)}
                        </div>
                      ))}
                    </div>
                    <div className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5 md:mb-1">{pot.name}</div>
                    <div className="text-lg md:text-2xl font-black font-mono text-poker-gold">${pot.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-slate-900 border-2 border-poker-gold/40 p-5 md:p-8 rounded-2xl md:rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-poker-gold to-transparent"></div>
            
            {stage === 'POTS' ? (
              <div className="space-y-4 md:space-y-6">
                <div className="text-center">
                  <h2 className="text-lg md:text-xl font-black text-white uppercase">底池金額核算</h2>
                  <div className="h-0.5 w-8 bg-poker-gold mx-auto mt-1 md:mt-2"></div>
                </div>
                
                <div className="space-y-4 md:space-y-6">
                  {correctPots.map((pot) => (
                    <div key={pot.name} className="relative">
                      <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">{pot.name} 金額</label>
                      <div className="relative group">
                        <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-poker-gold/40 font-mono text-lg md:text-xl">$</span>
                        <input type="number" disabled={showPotResult} value={potAnswers[pot.name] || ''} onChange={(e) => setPotAnswers(prev => ({ ...prev, [pot.name]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-xl md:rounded-2xl p-3 md:p-5 pl-8 md:pl-10 font-mono text-xl md:text-2xl text-white outline-none transition-all", showPotResult ? (isPotCorrect(pot.name) ? "border-green-500 text-green-400 bg-green-500/5" : "border-red-500 text-red-400 bg-red-500/5") : "border-white/10 focus:border-poker-gold")} placeholder="0" />
                      </div>
                    </div>
                  ))}
                  
                  {!showPotResult ? (
                    <button onClick={handlePotCheck} className="w-full bg-poker-gold text-poker-green font-black py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">核對金額</button>
                  ) : (
                    <div className="space-y-3">
                      <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl text-center font-black border-2 text-xs md:text-sm uppercase animate-in zoom-in duration-300", allPotsCorrect ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>{allPotsCorrect ? "計算正確" : "計算錯誤"}</div>
                      {allPotsCorrect && <button onClick={() => {setStage('PAYOUTS'); setShowPotResult(false);}} className="w-full bg-white text-poker-green font-black py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">進入分配階段 <ArrowRight className="w-4 h-4" /></button>}
                      {!allPotsCorrect && <button onClick={() => setShowPotResult(false)} className="w-full bg-white/5 text-slate-400 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest">重新輸入</button>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="text-center">
                  <h2 className="text-lg md:text-xl font-black text-white uppercase">分配底池結果</h2>
                  <div className="h-0.5 w-8 bg-poker-gold mx-auto mt-1 md:mt-2"></div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  {potPlayers.map((p) => (
                    <div key={p.id} className="relative">
                      <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">{p.name} 獲配總額</label>
                      <div className="relative group">
                        <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-poker-gold/40 font-mono text-lg md:text-xl">$</span>
                        <input type="number" disabled={showPotResult} value={payoutAnswers[p.id] || ''} onChange={(e) => setPayoutAnswers(prev => ({ ...prev, [p.id]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-xl md:rounded-2xl p-3 md:p-5 pl-8 md:pl-10 font-mono text-xl md:text-2xl text-white outline-none transition-all", showPotResult ? (isPayoutCorrect(p.id) ? "border-green-500 text-green-400 bg-green-500/5" : "border-red-500 text-red-400 bg-red-500/5") : "border-white/10 focus:border-poker-gold")} placeholder="0" />
                      </div>
                    </div>
                  ))}

                  {!showPotResult ? (
                    <button onClick={handlePayoutCheck} className="w-full bg-poker-gold text-poker-green font-black py-4 md:py-5 rounded-xl md:rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-xs">核對分配結果</button>
                  ) : (
                    <div className="space-y-3">
                      <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl text-center font-black border-2 text-xs md:text-sm uppercase", allPayoutsCorrect ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>{allPayoutsCorrect ? "分配成功" : "分配失敗"}</div>
                      {!allPayoutsCorrect && (
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setShowPotResult(false)} className="bg-white/5 text-slate-400 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">重新輸入</button>
                          <button onClick={() => {
                            const answers: Record<number, string> = {};
                            potPlayers.forEach(p => {
                              answers[p.id] = correctPayouts[p.id].toString();
                            });
                            setPayoutAnswers(answers);
                          }} className="bg-blue-600/20 text-blue-400 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/30 transition-all border border-blue-600/30">顯示解答</button>
                        </div>
                      )}
                      <button onClick={initSplitPot} className="w-full bg-white/10 text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-white/20 transition-all uppercase tracking-widest text-xs">{allPayoutsCorrect ? "下一題練習" : "放棄並換題"}</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShowdown = () => {
    if (!showdown) return null;
    const isHiLo = variant === 'BIGO';
    const actualHighWinners = showdown.players.filter((p: any) => p.isHighWinner).map((p: any) => p.id);
    const actualLowWinners = showdown.players.filter((p: any) => p.isLowWinner).map((p: any) => p.id);
    const hasLow = actualLowWinners.length > 0;
    const highCorrect = userHighWinnerIds.length === actualHighWinners.length && userHighWinnerIds.every(id => actualHighWinners.includes(id));
    const lowCorrect = !isHiLo ? true : (!hasLow ? userLowWinnerIds.length === 0 : (userLowWinnerIds.length === actualLowWinners.length && userLowWinnerIds.every(id => actualLowWinners.includes(id))));
    const isCorrect = highCorrect && lowCorrect;

    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-black/40 border border-poker-gold/30 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-2xl relative">
          <h2 className="text-center text-poker-gold font-black tracking-[0.2em] uppercase mb-4 opacity-50 text-[8px] md:text-[10px]">Community Cards</h2>
          <div className="flex justify-center gap-1.5 md:gap-3 mb-6 md:mb-8 overflow-x-auto pb-2 px-2">
            {showdown.communityCards.map((card: any, i: number) => (
              <PokerCard key={i} card={card} mini />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {showdown.players.map((player: any) => (
              <div key={player.id} className={cn(
                "p-3 md:p-4 rounded-xl border-2 flex flex-col items-center gap-2 md:gap-3 transition-all",
                (userHighWinnerIds.includes(player.id) || userLowWinnerIds.includes(player.id)) ? "bg-poker-gold/10 border-poker-gold" : "bg-white/5 border-white/5"
              )}>
                <div className="font-bold text-white text-sm md:text-base">{player.name}</div>
                <div className="flex flex-wrap justify-center gap-1 mb-1">
                  {player.cards.map((card: any, i: number) => (
                    <PokerCard key={i} card={card} mini />
                  ))}
                </div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => !showShowdownResult && setUserHighWinnerIds(prev => prev.includes(player.id) ? prev.filter(x => x !== player.id) : [...prev, player.id])} className={cn("flex-1 py-1.5 md:py-2 rounded-lg text-[8px] md:text-[10px] font-bold uppercase transition-all", userHighWinnerIds.includes(player.id) ? "bg-poker-gold text-poker-green" : "bg-white/10 text-slate-400")}>高牌贏家</button>
                  {isHiLo && <button onClick={() => !showShowdownResult && setUserLowWinnerIds(prev => prev.includes(player.id) ? prev.filter(x => x !== player.id) : [...prev, player.id])} className={cn("flex-1 py-1.5 md:py-2 rounded-lg text-[8px] md:text-[10px] font-bold uppercase transition-all", userLowWinnerIds.includes(player.id) ? "bg-blue-500 text-white shadow-lg" : "bg-white/10 text-slate-400")}>低牌贏家</button>}
                </div>
                {showShowdownResult && (
                  <div className="mt-1 w-full space-y-1">
                    <div className={cn("text-[8px] md:text-[10px] font-bold p-1 rounded text-center border", player.isHighWinner ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50")}>High: {player.handDescription}</div>
                    {isHiLo && <div className={cn("text-[8px] md:text-[10px] font-bold p-1 rounded text-center border", player.isLowWinner ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-white/5 text-slate-500")}>{player.lowDescription}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-4 text-center px-4">
          {!showShowdownResult ? (
            <button disabled={userHighWinnerIds.length === 0} onClick={() => {setShowShowdownResult(true); updateStreak(isCorrect);}} className="w-full bg-poker-gold text-poker-green font-black py-4 rounded-xl shadow-xl transition-all uppercase text-xs">確認分配結果</button>
          ) : (
            <div className="space-y-3">
              <div className={cn("p-4 rounded-xl font-bold text-lg md:text-xl border-2", isCorrect ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50")}>{isCorrect ? "判斷正確！" : "判斷錯誤。"}</div>
              <button onClick={initShowdown} className="w-full bg-white text-poker-green font-black py-4 rounded-xl shadow-lg transition-all text-xs">下一題練習</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-poker-green text-white p-3 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/10 shadow-lg w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col items-center border-r border-white/20 pr-3 md:pr-4">
              <span className="text-[8px] md:text-[10px] text-poker-gold font-bold uppercase tracking-widest">Streak</span>
              <div className="flex items-center gap-1"><Flame className={cn("w-4 h-4 md:w-5 md:h-5", streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600")} /><span className="text-xl md:text-2xl font-black">{streak}</span></div>
            </div>
            <div className="flex flex-col items-center pl-1 md:pl-2">
              <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best</span>
              <div className="flex items-center gap-1"><Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" /><span className="text-lg md:text-xl font-bold">{bestStreak}</span></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 order-first sm:order-none w-full sm:w-auto justify-between">
            <h1 className="text-xl md:text-2xl font-black text-poker-gold flex items-center gap-2"><Trophy className="w-5 h-5 md:w-6 md:h-6" /> DEALERPRO</h1>
            <button onClick={mode === 'SPLIT_POT' ? initSplitPot : initShowdown} className="flex items-center gap-2 bg-poker-gold hover:bg-yellow-500 text-poker-green px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold transition-all shadow-lg text-[10px] md:text-sm"><RefreshCw className="w-3 h-3 md:w-4 md:h-4" /> 重新出題</button>
          </div>
        </div>

        <div className="flex flex-col items-center mb-8 md:mb-10 gap-4">
          <div className="bg-black/40 p-1 rounded-xl md:rounded-2xl flex border border-white/10 shadow-inner w-full sm:w-auto">
            <button onClick={() => {setMode('SPLIT_POT'); setStreak(0);}} className={cn("flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-xs md:text-sm", mode === 'SPLIT_POT' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400")}>
              <Calculator className="w-4 h-4" /> 底池計算
            </button>
            <button onClick={() => {setMode('SHOWDOWN'); setStreak(0);}} className={cn("flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-xs md:text-sm", mode === 'SHOWDOWN' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400")}>
              <Eye className="w-4 h-4" /> 勝負判斷
            </button>
          </div>

          {mode === 'SHOWDOWN' && (
            <div className="bg-white/5 p-1 rounded-lg flex border border-white/5 w-full sm:w-auto overflow-x-auto">
              {(['HOLDEM', 'OMAHA', 'BIGO'] as PokerLogic.GameVariant[]).map(v => (
                <button key={v} onClick={() => {setVariant(v); setStreak(0);}} className={cn("flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap", variant === v ? "bg-white/20 text-white" : "text-slate-500")}>{v}</button>
              ))}
            </div>
          )}
        </div>

        {mode === 'SPLIT_POT' ? renderSplitPot() : renderShowdown()}

        <footer className="mt-12 md:mt-20 text-center text-slate-500 text-[8px] md:text-[10px] border-t border-white/5 pt-8 uppercase tracking-[0.2em]">Professional Dealer Training Utility • 2026</footer>
      </div>
    </div>
  );
};

export default App;
