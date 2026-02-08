import React, { useState, useEffect, useCallback } from 'react';
import * as PotCalc from './utils/potCalculator';
import * as PokerLogic from './utils/pokerLogic';
import { createClient } from '@supabase/supabase-js';
import { 
  Trophy, RefreshCw, XCircle, Info, Users, Coins, 
  ArrowRight, Medal, Eye, Calculator, Star, Flame, Loader2 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://rnvmtdlyowunemwitmvg.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_R2ZK679gVDrOv3X9Dbvfsw_Dw7Sd5N0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MainMode = 'SPLIT_POT' | 'SHOWDOWN';

// --- Card Component ---
const PokerCard: React.FC<{ card: PokerLogic.Card; hidden?: boolean; className?: string; style?: React.CSSProperties; mini?: boolean }> = ({ card, hidden, className, style, mini }) => {
  if (hidden) {
    return (
      <div style={style} className={cn("poker-card bg-slate-900 border-slate-700", className)}>
        <div className="text-slate-700 font-black text-xl">?</div>
      </div>
    );
  }
  const suitSymbol = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' }[card.suit];
  return (
    <div style={style} className={cn(mini ? "mini-card" : "poker-card", card.suit, className)}>
      <div className={mini ? "" : "text-lg md:text-xl"}>{card.rank}</div>
      {!mini && <div className="text-[10px] md:text-xs opacity-80">{suitSymbol}</div>}
      {mini && <span className="ml-0.5">{suitSymbol}</span>}
    </div>
  );
};

interface ShowdownPlayer {
  id: number;
  name: string;
  cards: PokerLogic.Card[];
  highScore: number;
  lowScore: number | null;
  handDescription: string;
  lowDescription: string;
  isHighWinner: boolean;
  isLowWinner: boolean;
}

interface ShowdownScenario {
  variant: PokerLogic.GameVariant;
  communityCards: PokerLogic.Card[];
  players: ShowdownPlayer[];
}

const App: React.FC = () => {
  // --- All States ---
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
  const [showdown, setShowdown] = useState<ShowdownScenario | null>(null);
  const [userHighWinnerIds, setUserHighWinnerIds] = useState<number[]>([]);
  const [userLowWinnerIds, setUserLowWinnerIds] = useState<number[]>([]);
  const [showShowdownResult, setShowShowdownResult] = useState(false);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(300);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [totalScore, setTotalScore] = useState<number>(0);
  const [lastPoints, setLastPoints] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [minHighScore, setMinHighScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRank, setIsLoadingRank] = useState(false);

  // --- Helpers ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingRank(true);
    try {
      const { data } = await supabase.from('leaderboard').select('*').order('score', { ascending: false }).limit(10);
      if (data) {
        setLeaderboard(data);
        setMinHighScore(data.length >= 10 ? data[9].score : 0);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingRank(false); }
  }, []);

  const initSplitPot = useCallback(() => {
    const players = PotCalc.generateRandomScenario();
    const pots = PotCalc.calculatePots(players);
    setPotPlayers(players);
    setCorrectPots(pots);
    setCorrectPayouts(PotCalc.calculatePayouts(players, pots));
    setPotAnswers({});
    setPayoutAnswers({});
    setShowPotResult(false);
    setStage('POTS');
    setStartTime(Date.now());
  }, []);

  const initShowdown = useCallback(() => {
    const scenario = PokerLogic.generateShowdownScenario(Math.random() > 0.5 ? 2 : 3, variant) as ShowdownScenario;
    setShowdown(scenario);
    setUserHighWinnerIds([]);
    setUserLowWinnerIds([]);
    setShowShowdownResult(false);
    setStartTime(Date.now());
  }, [variant]);

  // --- Effects ---
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  useEffect(() => {
    if (mode === 'SPLIT_POT') initSplitPot();
    else initShowdown();
  }, [mode, variant, initSplitPot, initShowdown]);

  useEffect(() => {
    let timer: any;
    if (isChallengeActive && challengeTimeLeft > 0) {
      timer = setInterval(() => { setChallengeTimeLeft(prev => prev - 1); }, 1000);
    }
    return () => clearInterval(timer);
  }, [isChallengeActive, challengeTimeLeft]);

  useEffect(() => {
    if (isChallengeActive && challengeTimeLeft === 0) {
      setIsChallengeActive(false);
      if (totalScore > 0 && totalScore > minHighScore) {
        setFinalScore(totalScore);
        setFinalStreak(streak);
        setShowSubmitModal(true);
      } else {
        alert(`挑戰結束！最終得分：${totalScore.toLocaleString()}\n未進入前 10 名，再接再厲！`);
        setTotalScore(0); setStreak(0);
      }
    }
  }, [challengeTimeLeft, isChallengeActive, totalScore, minHighScore, streak]);

  const startChallenge = () => {
    setIsChallengeActive(true);
    setChallengeTimeLeft(300);
    setTotalScore(0);
    setStreak(0);
    setLastPoints(0);
    if (mode === 'SPLIT_POT') initSplitPot();
    else initShowdown();
  };

  const calculatePoints = (basePoints: number) => {
    const duration = (Date.now() - startTime) / 1000;
    const timeMultiplier = duration <= 10 ? 1.5 : (duration <= 15 ? 1.25 : 1.0);
    const difficultyMap = { 'HOLDEM': 1, 'OMAHA': 1.5, 'BIGO': 2 };
    const diffMultiplier = difficultyMap[variant] || 1;
    const streakMultiplier = 1 + (streak * 0.2);
    const points = Math.round(basePoints * diffMultiplier * timeMultiplier * streakMultiplier);
    setLastPoints(points);
    setTotalScore(prev => prev + points);
    return points;
  };

  const updateStreak = (correct: boolean, basePointsForScore: number = 0) => {
    if (correct) {
      if (basePointsForScore > 0) calculatePoints(basePointsForScore);
      setStreak(s => {
        const next = s + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
    } else {
      if (!isChallengeActive) setTotalScore(0);
      setStreak(0);
      setLastPoints(0);
    }
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leaderboard').insert([{ name: playerName, score: finalScore, streak: finalStreak }]);
      if (!error) { setShowSubmitModal(false); setPlayerName(""); fetchLeaderboard(); setShowRankModal(true); }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  // --- Renders ---
  const renderSplitPot = () => {
    const allPotsCorrect = correctPots.every(pot => parseInt(potAnswers[pot.name] || '0') === pot.amount);
    const allPayoutsCorrect = potPlayers.every(p => Number(payoutAnswers[p.id] || 0) === correctPayouts[p.id]);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <h2 className="text-[8px] font-black text-poker-gold uppercase tracking-[0.4em] mb-6 flex items-center gap-2"><Users className="w-3 h-3" /> 玩家下注詳情</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {potPlayers.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-xl">{p.name.slice(-1)}</div>
                    <div><div className="text-slate-200 font-bold">{p.name}</div><div className="text-[8px] text-slate-500 uppercase">Active</div></div>
                  </div>
                  <div className="text-right"><div className="text-2xl font-black font-mono text-white">${p.bet.toLocaleString()}</div>{stage === 'PAYOUTS' && <div className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/10 text-slate-400 uppercase">{p.rankName}</div>}</div>
                </div>
              ))}
            </div>
          </div>
          {stage === 'PAYOUTS' && (
            <div className="bg-gradient-to-r from-poker-gold/10 to-transparent border border-poker-gold/20 p-6 rounded-[2rem] shadow-xl">
              <h3 className="text-[8px] font-black text-poker-gold uppercase mb-4 flex items-center gap-2"><Coins className="w-3 h-3" /> 已確認底池</h3>
              <div className="flex flex-wrap gap-4">{correctPots.map(pot => (<div key={pot.name} className="bg-black/60 p-4 rounded-2xl min-w-[150px]"><div className="text-[8px] text-slate-500 uppercase mb-1">{pot.name}</div><div className="text-2xl font-black font-mono text-poker-gold">${pot.amount.toLocaleString()}</div></div>))}</div>
            </div>
          )}
        </div>
        <div className="bg-slate-900 border-2 border-poker-gold/40 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <h2 className="text-xl font-black text-white text-center uppercase">{stage === 'POTS' ? '底池金額核算' : '分配底池結果'}</h2>
          <div className="space-y-4">
            {stage === 'POTS' ? correctPots.map(pot => (
              <div key={pot.name}><label className="text-[8px] text-slate-500 uppercase ml-1">{pot.name} 金額</label><input type="number" disabled={showPotResult} value={potAnswers[pot.name] || ''} onChange={e => setPotAnswers(prev => ({ ...prev, [pot.name]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-2xl p-5 font-mono text-2xl text-white", showPotResult ? (parseInt(potAnswers[pot.name]||'0')===pot.amount?"border-green-500":"border-red-500"):"border-white/10")} /></div>
            )) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 items-start"><Info className="w-4 h-4 text-blue-400 shrink-0" /><div className="text-[10px] text-blue-300 italic">餘數應分給 ID 較小的贏家。</div></div>
                {potPlayers.map(p => (
                  <div key={p.id}><label className="text-[8px] text-slate-500 uppercase ml-1">{p.name} 獲配總額</label><input type="number" disabled={showPotResult} value={payoutAnswers[p.id] || ''} onChange={e => setPayoutAnswers(prev => ({ ...prev, [p.id]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-2xl p-5 font-mono text-2xl text-white", showPotResult ? (Number(payoutAnswers[p.id]||0)===correctPayouts[p.id]?"border-green-500":"border-red-500"):"border-white/10")} /></div>
                ))}
              </>
            )}
            {!showPotResult ? (
              <button onClick={() => {setShowPotResult(true); updateStreak(stage === 'POTS' ? allPotsCorrect : allPayoutsCorrect, stage === 'POTS' ? 500 : 1000);}} className="w-full bg-poker-gold text-poker-green font-black py-5 rounded-2xl uppercase shadow-xl">核對結果</button>
            ) : (
              <div className="space-y-3">
                {(stage === 'POTS' && allPotsCorrect) && <button onClick={() => {setStage('PAYOUTS'); setShowPotResult(false);}} className="w-full bg-white text-poker-green font-black py-5 rounded-2xl shadow-xl">下一步</button>}
                <button onClick={initSplitPot} className="w-full bg-white/10 text-white font-black py-5 rounded-2xl hover:bg-white/20">下一題</button>
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
    const actualHighWinners = showdown.players.filter(p => p.isHighWinner).map(p => p.id);
    const actualLowWinners = showdown.players.filter(p => p.isLowWinner).map(p => p.id);
    const isCorrect = userHighWinnerIds.length === actualHighWinners.length && userHighWinnerIds.every(id => actualHighWinners.includes(id)) && (!isHiLo || (userLowWinnerIds.length === actualLowWinners.length && userLowWinnerIds.every(id => actualLowWinners.includes(id))));
    return (
      <div className="space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-black/40 border border-poker-gold/30 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex justify-center gap-3 mb-8">{showdown.communityCards.map((card, i) => (<PokerCard key={i} card={card} mini />))}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showdown.players.map(p => (
              <div key={p.id} className={cn("p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all", (userHighWinnerIds.includes(p.id) || userLowWinnerIds.includes(p.id)) ? "bg-poker-gold/10 border-poker-gold" : "bg-white/5 border-white/5")}>
                <div className="font-bold text-white">{p.name}</div>
                <div className="flex gap-1">{p.cards.map((card, i) => (<PokerCard key={i} card={card} mini />))}</div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => !showShowdownResult && setUserHighWinnerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", userHighWinnerIds.includes(p.id) ? "bg-poker-gold text-poker-green" : "bg-white/10 text-slate-400")}>{isHiLo ? "高牌贏家" : "贏家"}</button>
                  {isHiLo && <button onClick={() => !showShowdownResult && setUserLowWinnerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", userLowWinnerIds.includes(p.id) ? "bg-blue-500 text-white shadow-lg" : "bg-white/10 text-slate-400")}>低牌贏家</button>}
                </div>
                {showShowdownResult && (
                  <div className="mt-2 w-full space-y-2 text-center">
                    <div className={cn("text-[10px] font-bold p-2 rounded border", p.isHighWinner ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-slate-800/50 text-slate-500")}>{p.handDescription}</div>
                    {isHiLo && <div className={cn("text-[10px] font-bold p-2 rounded border", p.isLowWinner ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-slate-800/50 text-slate-500")}>{p.lowDescription}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-md mx-auto space-y-4">
          {!showShowdownResult ? (<button disabled={userHighWinnerIds.length === 0} onClick={() => {setShowShowdownResult(true); updateStreak(isCorrect, 800);}} className="w-full bg-poker-gold text-poker-green font-black py-4 rounded-xl uppercase shadow-xl">確認結果</button>) : (
            <div className="space-y-3"><div className={cn("p-4 rounded-xl font-bold text-center border-2 text-lg", isCorrect ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50")}>{isCorrect ? "判斷正確！" : "判斷錯誤。"}</div><button onClick={initShowdown} className="w-full bg-white text-poker-green font-black py-4 rounded-xl shadow-lg">下一題</button></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-poker-green text-white p-3 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
            {isChallengeActive && (<div className="flex flex-col items-center border-r border-white/20 pr-4"><span className="text-[8px] text-red-400 font-bold uppercase animate-pulse">Time Left</span><div className="text-2xl font-black font-mono">{formatTime(challengeTimeLeft)}</div></div>)}
            <div className="flex flex-col items-center border-r border-white/20 px-4"><span className="text-[8px] text-poker-gold font-bold uppercase">Points</span><div className="flex items-center gap-1 text-poker-gold"><Coins className="w-4 h-4" /><span className="text-2xl font-black">{totalScore.toLocaleString()}</span></div>{lastPoints > 0 && <div className="text-[8px] text-green-400 font-bold animate-bounce">+{lastPoints}</div>}</div>
            <div className="flex flex-col items-center px-4"><span className="text-[8px] text-poker-gold font-bold uppercase">Streak</span><div className="flex items-center gap-1"><Flame className={cn("w-5 h-5", streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600")} /><span className="text-2xl font-black">{streak}</span></div></div>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-poker-gold flex items-center gap-2"><Trophy className="w-7 h-7" /> DEALERPRO</h1>
            <div className="flex gap-2">
              <button onClick={() => { fetchLeaderboard(); setShowRankModal(true); }} className="bg-white/10 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg">排行榜</button>
              {!isChallengeActive ? (<button onClick={startChallenge} className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-2.5 rounded-full font-black text-xs animate-bounce shadow-xl">🔥 開始挑戰 (5分鐘)</button>) : (<button onClick={() => {setIsChallengeActive(false); initSplitPot();}} className="bg-white/10 px-5 py-2.5 rounded-full font-bold text-xs">放棄</button>)}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="bg-black/40 p-1 rounded-2xl flex border border-white/10">
            <button onClick={() => {setMode('SPLIT_POT'); setStreak(0);}} className={cn("px-8 py-3 rounded-xl font-bold text-xs transition-all", mode === 'SPLIT_POT' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400")}>底池計算</button>
            <button onClick={() => {setMode('SHOWDOWN'); setStreak(0);}} className={cn("px-8 py-3 rounded-xl font-bold text-xs transition-all", mode === 'SHOWDOWN' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400")}>勝負判斷</button>
          </div>
          {mode === 'SHOWDOWN' && (<div className="flex gap-2">{(['HOLDEM', 'OMAHA', 'BIGO'] as PokerLogic.GameVariant[]).map(v => (<button key={v} onClick={() => {setVariant(v); setStreak(0);}} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold", variant === v ? "bg-white/20 text-white" : "text-slate-500")}>{v}</button>))}</div>)}
        </div>
        <div className="max-w-4xl mx-auto mb-10">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex gap-6 items-center">
            <div className="bg-poker-gold/20 p-4 rounded-2xl">{mode === 'SPLIT_POT' ? <Calculator className="w-8 h-8 text-poker-gold" /> : <Eye className="w-8 h-8 text-blue-400" />}</div>
            <div className="space-y-1 text-slate-400">
              <h3 className="text-white font-black uppercase tracking-wider">{mode === 'SPLIT_POT' ? '底池分配練習' : '勝負判斷練習'}</h3>
              <p className="text-xs leading-relaxed">{mode === 'SPLIT_POT' ? '計算主池與邊池金額，並依排名分配。注意 ID 較小者優先獲得餘數。' : `判斷 ${variant} 規則下的贏家。${variant !== 'HOLDEM' ? '注意 2+3 強制規則。' : ''}`}</p>
              {mode === 'SHOWDOWN' && (<div className="mt-2 p-2 bg-blue-500/10 border-l-2 border-blue-500 text-[10px] text-blue-300">
                {variant === 'HOLDEM' ? '任意挑選 5 張。' : (variant === 'OMAHA' ? '強制 2 手牌 + 3 公牌。' : '高牌強制 2+3；低牌需 5 張 8 以下且不重複。')}
              </div>)}
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <div className="text-[10px]"><span className="text-white font-bold">連勝加成：</span>每連勝一場 +20% 分數</div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-green-400" />
                  <div className="text-[10px]"><span className="text-white font-bold">速度獎勵：</span>10秒內答對享 1.5x 加成</div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <div className="text-[10px]"><span className="text-white font-bold">難度倍率：</span>BIGO(2x) &gt; Omaha(1.5x)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {mode === 'SPLIT_POT' ? renderSplitPot() : renderShowdown()}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-poker-gold p-8 rounded-[2rem] max-w-sm w-full text-center shadow-[0_0_50px_rgba(201,160,80,0.2)]">
              <Trophy className="w-16 h-16 text-poker-gold mx-auto mb-4" /><h2 className="text-2xl font-black text-white mb-2">挑戰結束！</h2>
              <div className="bg-white/5 rounded-2xl p-4 mb-6"><div className="text-slate-400 text-xs uppercase font-bold">最終得分</div><div className="text-4xl font-black text-poker-gold">{finalScore.toLocaleString()}</div><div className="text-slate-500 text-[10px] mt-1">連勝次數: {finalStreak}</div></div>
              <input type="text" placeholder="輸入稱號 (12字內)" value={playerName} maxLength={12} onChange={e => setPlayerName(e.target.value)} className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white text-center font-bold mb-4 focus:border-poker-gold outline-none" />
              <div className="flex gap-3"><button onClick={() => {setShowSubmitModal(false); setTotalScore(0);}} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs">跳過</button><button onClick={handleSubmitScore} disabled={isSubmitting || !playerName.trim()} className="flex-1 bg-poker-gold text-poker-green py-4 rounded-xl font-black uppercase text-xs shadow-lg">{isSubmitting ? <Loader2 className="animate-spin" /> : "登錄排行"}</button></div>
            </div>
          </div>
        )}
        {showRankModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-poker-gold/30 p-8 rounded-[2.5rem] max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-poker-gold flex items-center gap-3"><Medal className="w-8 h-8" /> 全球荷官排行榜</h2><button onClick={() => setShowRankModal(false)} className="text-slate-500"><XCircle /></button></div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoadingRank ? <div className="text-center py-20 text-slate-500">讀取中...</div> : leaderboard.map((e, i) => (
                  <div key={e.id} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-4"><div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black", i === 0 ? "bg-poker-gold text-poker-green" : "bg-slate-800 text-slate-400")}>{i + 1}</div><div className="font-bold text-white">{e.name}</div></div><div className="text-right"><div className="text-lg font-black text-white">{e.score.toLocaleString()}</div><div className="text-[10px] text-poker-gold font-bold">STREAK: {e.streak}</div></div></div>
                ))}
              </div>
              <button onClick={() => setShowRankModal(false)} className="mt-8 w-full py-4 bg-white/5 text-slate-400 rounded-xl font-bold uppercase text-xs">關閉</button>
            </div>
          </div>
        )}
        <footer className="mt-20 text-center text-slate-500 text-[10px] border-t border-white/5 pt-8 uppercase tracking-[0.2em]">Professional Dealer Training Utility • 2026</footer>
      </div>
    </div>
  );
};
export default App;