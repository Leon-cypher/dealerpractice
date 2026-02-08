import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as PotCalc from './utils/potCalculator';
import * as PokerLogic from './utils/pokerLogic';
import * as QuizLogic from './utils/quizLogic';
import { Question } from './utils/quizData';
import AvatarUpload from './components/AvatarUpload';
import logo from './assets/logo.png';
import { createClient } from '@supabase/supabase-js';
import { 
  Trophy, XCircle, Info, Users, Coins, ArrowRight, Medal, Eye, 
  Calculator, Star, Flame, Loader2, BookOpen, CheckCircle2, AlertCircle, RefreshCw, LogIn, LogOut, Settings, User as UserIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://rnvmtdlyowunemwitmvg.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_R2ZK679gVDrOv3X9Dbvfsw_Dw7Sd5N0';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MainMode = 'SPLIT_POT' | 'SHOWDOWN' | 'QUIZ';
type LeaderboardType = 'SPLIT_POT' | 'SHOWDOWN_HOLDEM' | 'SHOWDOWN_OMAHA' | 'SHOWDOWN_BIGO' | 'QUIZ';

interface Profile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  streak: number;
  type: LeaderboardType;
  created_at: string;
  user_id?: string;
  profiles?: Profile; // Supabase 關聯查詢
}

// --- Card Component ---
const PokerCard: React.FC<{ card: PokerLogic.Card; hidden?: boolean; className?: string; style?: React.CSSProperties; mini?: boolean }> = ({ card, hidden, className, style, mini }) => {
  if (hidden) return (<div style={style} className={cn("poker-card bg-slate-900 border-slate-700", className)}><div className="text-slate-700 font-black text-xl">?</div></div>);
  const suitSymbol = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' }[card.suit];
  return (<div style={style} className={cn(mini ? "mini-card" : "poker-card", card.suit, className)}><div className={mini ? "" : "text-lg md:text-xl"}>{card.rank}</div>{!mini && <div className="text-[10px] md:text-xs opacity-80">{suitSymbol}</div>}{mini && <span className="ml-0.5">{suitSymbol}</span>}</div>);
};

interface ShowdownPlayer { id: number; name: string; cards: PokerLogic.Card[]; highScore: number; lowScore: number | null; handDescription: string; lowDescription: string; isHighWinner: boolean; isLowWinner: boolean; }
interface ShowdownScenario { variant: PokerLogic.GameVariant; communityCards: PokerLogic.Card[]; players: ShowdownPlayer[]; }

const App: React.FC = () => {
  // --- User & Auth States ---
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Game States ---
  const [mode, setMode] = useState<MainMode>('SPLIT_POT');
  const [variant, setVariant] = useState<PokerLogic.GameVariant>('HOLDEM');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [lastPoints, setLastPoints] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

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
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // --- Challenge & Leaderboard States ---
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(300);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [activeRankTab, setActiveRankTab] = useState<LeaderboardType>('SPLIT_POT');
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [minHighScores, setMinHighScores] = useState<Record<LeaderboardType, number>>({ SPLIT_POT: 0, SHOWDOWN_HOLDEM: 0, SHOWDOWN_OMAHA: 0, SHOWDOWN_BIGO: 0, QUIZ: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRank, setIsLoadingRank] = useState(false);

  // --- Auth Handlers ---
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) {
      setProfile(data);
      if (!data.nickname) setShowProfileModal(true);
    } else {
      // 建立初始 Profile
      const newProfile = { id: uid, nickname: '', avatar_url: null };
      await supabase.from('profiles').insert([newProfile]);
      setProfile(newProfile);
      setShowProfileModal(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveProfile = async (nickname: string, avatarUrl: string | null) => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        nickname,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setProfile({ id: user.id, nickname, avatar_url: avatarUrl });
      setShowProfileModal(false);
    } catch (err: any) {
      alert(err.message.includes('unique') ? '此暱稱已被使用，請換一個' : '儲存失敗');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- Helpers ---
  const currentType = useMemo((): LeaderboardType => {
    if (mode === 'SPLIT_POT') return 'SPLIT_POT';
    if (mode === 'QUIZ') return 'QUIZ';
    if (variant === 'HOLDEM') return 'SHOWDOWN_HOLDEM';
    if (variant === 'OMAHA') return 'SHOWDOWN_OMAHA';
    return 'SHOWDOWN_BIGO';
  }, [mode, variant]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchLeaderboard = useCallback(async (type: LeaderboardType) => {
    setIsLoadingRank(true);
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select('*, profiles(nickname, avatar_url)')
        .eq('type', type)
        .order('score', { ascending: false })
        .limit(10);
      if (data) {
        setLeaderboard(data as any);
        setMinHighScores(prev => ({ ...prev, [type]: data.length >= 10 ? data[9].score : 0 }));
      } else { setLeaderboard([]); }
    } catch (err) { console.error(err); }
    finally { setIsLoadingRank(false); }
  }, []);

  useEffect(() => { if (showRankModal) fetchLeaderboard(activeRankTab); }, [showRankModal, activeRankTab, fetchLeaderboard]);

  const initSplitPot = useCallback(() => {
    const players = PotCalc.generateRandomScenario();
    const pots = PotCalc.calculatePots(players);
    setPotPlayers(players); setCorrectPots(pots); setCorrectPayouts(PotCalc.calculatePayouts(players, pots));
    setPotAnswers({}); setPayoutAnswers({}); setShowPotResult(false); setStage('POTS'); setStartTime(Date.now());
  }, []);

  const initShowdown = useCallback(() => {
    const scenario = PokerLogic.generateShowdownScenario(Math.random() > 0.5 ? 2 : 3, variant) as ShowdownScenario;
    setShowdown(scenario); setUserHighWinnerIds([]); setUserLowWinnerIds([]); setShowShowdownResult(false); setStartTime(Date.now());
  }, [variant]);

  const initQuiz = useCallback(() => {
    setQuizQuestions(QuizLogic.getRandomQuestions(50));
    setCurrentQuizIdx(0); setSelectedQuizOption(null); setShowQuizResult(false); setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (mode === 'SPLIT_POT') initSplitPot();
    else if (mode === 'SHOWDOWN') initShowdown();
    else initQuiz();
  }, [mode, variant, initSplitPot, initShowdown, initQuiz]);

  useEffect(() => {
    let timer: any;
    if (isChallengeActive && challengeTimeLeft > 0) { timer = setInterval(() => { setChallengeTimeLeft(prev => prev - 1); }, 1000); }
    return () => clearInterval(timer);
  }, [isChallengeActive, challengeTimeLeft]);

  useEffect(() => {
    if (isChallengeActive && challengeTimeLeft === 0) {
      setIsChallengeActive(false);
      const threshold = minHighScores[currentType];
      if (totalScore > 0 && totalScore > threshold) { setFinalScore(totalScore); setFinalStreak(streak); setShowSubmitModal(true); }
      else { alert(`挑戰結束！最終得分：${totalScore.toLocaleString()}\n未進入此項目的排行榜前 10 名，請繼續加油！`); setTotalScore(0); setStreak(0); }
    }
  }, [challengeTimeLeft, isChallengeActive, totalScore, minHighScores, streak, currentType]);

  const calculatePoints = (basePoints: number) => {
    const duration = (Date.now() - startTime) / 1000;
    const timeMultiplier = duration <= 10 ? 1.5 : (duration <= 15 ? 1.25 : 1.0);
    const streakMultiplier = 1 + (streak * 0.2);
    const diffMap = { 'HOLDEM': 1, 'OMAHA': 1.5, 'BIGO': 2 };
    const points = Math.round(basePoints * (mode === 'QUIZ' ? 1.2 : diffMap[variant] || 1) * timeMultiplier * streakMultiplier);
    setLastPoints(points); setTotalScore(prev => prev + points);
    return points;
  };

  const updateStreak = (correct: boolean, basePointsForScore: number = 0) => {
    if (correct) {
      if (basePointsForScore > 0) calculatePoints(basePointsForScore);
      setStreak(s => { const next = s + 1; if (next > bestStreak) setBestStreak(next); return next; });
      if (isChallengeActive) {
        setTimeout(() => {
          if (mode === 'SPLIT_POT') { if (stage === 'POTS') { setStage('PAYOUTS'); setShowPotResult(false); } else { initSplitPot(); } }
          else if (mode === 'SHOWDOWN') initShowdown();
          else if (mode === 'QUIZ') { setCurrentQuizIdx(prev => (prev + 1) % quizQuestions.length); setSelectedQuizOption(null); setShowQuizResult(false); setStartTime(Date.now()); }
        }, 800);
      }
    } else {
      if (!isChallengeActive) setTotalScore(0);
      setStreak(0); setLastPoints(0);
    }
  };

  const startChallenge = () => {
    if (!user) { alert('請先登入 Google 帳號以參加挑戰並列入排行榜！'); handleGoogleLogin(); return; }
    setIsChallengeActive(true); setChallengeTimeLeft(300); setTotalScore(0); setStreak(0); setLastPoints(0);
    setActiveRankTab(currentType); 
    if (mode === 'SPLIT_POT') initSplitPot(); else if (mode === 'SHOWDOWN') initShowdown(); else initQuiz();
  };

  const handleSubmitScore = async () => {
    if (isSubmitting || !profile?.nickname) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leaderboard').insert([{ 
        name: profile.nickname, // 自動使用 Profile 內的暱稱
        score: finalScore, 
        streak: finalStreak, 
        type: currentType,
        user_id: user.id
      }]);
      if (!error) { setShowSubmitModal(false); setActiveRankTab(currentType); fetchLeaderboard(currentType); setShowRankModal(true); }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

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
                <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-white/10">
                  <div className="flex items-center gap-4">
                    <div className="relative"><div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-xl">{p.name.slice(-1)}</div><div className="absolute -top-1 -right-1 bg-red-600 text-[6px] font-black px-1 rounded-sm border border-white/20 uppercase shadow-lg">ALL IN</div></div>
                    <div><div className="text-slate-200 font-bold">{p.name}</div><div className="text-[8px] text-slate-500 uppercase">Active</div></div>
                  </div>
                  <div className="text-right"><div className="text-2xl font-black font-mono text-white">${p.bet.toLocaleString()}</div>{stage === 'PAYOUTS' && <div className={cn("text-[8px] font-black px-1.5 py-0.5 rounded mt-1 inline-block uppercase", p.rank === 1 ? "bg-green-500 text-white shadow-sm" : "bg-white/10 text-slate-400")}>{p.rankName}</div>}</div>
                </div>
              ))}
            </div>
          </div>
          {stage === 'PAYOUTS' && (
            <div className="bg-gradient-to-r from-poker-gold/10 to-transparent border border-poker-gold/20 p-6 rounded-[2rem] shadow-xl">
              <h3 className="text-[8px] font-black text-poker-gold uppercase mb-4 flex items-center gap-2"><Coins className="w-3 h-3" /> 已確認底池</h3>
              <div className="flex flex-wrap gap-4">{correctPots.map(pot => (<div key={pot.name} className="bg-black/60 p-4 rounded-2xl min-w-[150px] border border-white/5 shadow-inner relative"><div className="absolute top-2 right-2 flex gap-0.5">{pot.eligiblePlayerIds.map(id => (<div key={id} className="w-3 h-3 rounded-full bg-poker-gold/20 border border-poker-gold/40 flex items-center justify-center text-[6px] text-poker-gold font-bold">{potPlayers.find(px => px.id === id)?.name.slice(-1)}</div>))}</div><div className="text-[8px] text-slate-500 uppercase mb-1">{pot.name}</div><div className="text-2xl font-black font-mono text-poker-gold">${pot.amount.toLocaleString()}</div></div>))}</div>
            </div>
          )}
        </div>
        <div className="bg-slate-900 border-2 border-poker-gold/40 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <h2 className="text-xl font-black text-white text-center uppercase tracking-widest">{stage === 'POTS' ? '底池金額核算' : '分配底池結果'}</h2>
          <div className="space-y-4">
            {stage === 'POTS' ? correctPots.map(pot => (
              <div key={pot.name}><label className="text-[8px] text-slate-500 uppercase ml-1 font-bold">{pot.name} 金額</label><input type="number" disabled={showPotResult} value={potAnswers[pot.name] || ''} onChange={e => setPotAnswers(prev => ({ ...prev, [pot.name]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-2xl p-5 font-mono text-2xl text-white outline-none transition-all", showPotResult ? (parseInt(potAnswers[pot.name]||'0')===pot.amount?"border-green-500 text-green-400":"border-red-500 text-red-400"):"border-white/10 focus:border-poker-gold")} placeholder="0" /></div>
            )) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 items-start"><Info className="w-4 h-4 text-blue-400 shrink-0" /><div className="text-[10px] text-blue-300 italic">餘數 (Odd Chips) 應分給 ID 較小的贏家。</div></div>
                {potPlayers.map(p => (
                  <div key={p.id}><label className="text-[8px] text-slate-500 uppercase ml-1 font-bold">{p.name} 獲配總額</label><input type="number" disabled={showPotResult} value={payoutAnswers[p.id] || ''} onChange={e => setPayoutAnswers(prev => ({ ...prev, [p.id]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-2xl p-5 font-mono text-2xl text-white outline-none transition-all", showPotResult ? (Number(payoutAnswers[p.id]||0)===correctPayouts[p.id]?"border-green-500 text-green-400":"border-red-500 text-red-400"):"border-white/10 focus:border-poker-gold")} placeholder="0" /></div>
                ))}
              </>
            )}
            {!showPotResult ? (
              <button onClick={() => {setShowPotResult(true); updateStreak(stage === 'POTS' ? allPotsCorrect : allPayoutsCorrect, stage === 'POTS' ? 500 : 1000);}} className="w-full bg-poker-gold text-poker-green font-black py-5 rounded-2xl uppercase shadow-xl hover:bg-yellow-500 transition-all active:scale-95">核對結果</button>
            ) : (
              <div className="space-y-3">
                {(stage === 'POTS' && allPotsCorrect) && <button onClick={() => {setStage('PAYOUTS'); setShowPotResult(false);}} className="w-full bg-white text-poker-green font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">進入分配階段 <ArrowRight className="w-4 h-4" /></button>}
                <button onClick={initSplitPot} className="w-full bg-white/10 text-white font-black py-5 rounded-2xl hover:bg-white/20 transition-all">{allPayoutsCorrect ? "下一題練習" : "放棄並換題"}</button>
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
          <div className="flex justify-center gap-3 mb-8 overflow-x-auto pb-2">{showdown.communityCards.map((card, i) => (<PokerCard key={i} card={card} mini />))}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showdown.players.map(p => (
              <div key={p.id} className={cn("p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all", (userHighWinnerIds.includes(p.id) || userLowWinnerIds.includes(p.id)) ? "bg-poker-gold/10 border-poker-gold" : "bg-white/5 border-white/5")}>
                <div className="font-bold text-white">{p.name}</div>
                <div className="flex gap-1 flex-wrap justify-center">{p.cards.map((card, i) => (<PokerCard key={i} card={card} mini />))}</div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => !showShowdownResult && setUserHighWinnerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", userHighWinnerIds.includes(p.id) ? "bg-poker-gold text-poker-green shadow-lg" : "bg-white/10 text-slate-400 hover:bg-white/20")}>{isHiLo ? "高牌贏家" : "贏家"}</button>
                  {isHiLo && <button onClick={() => !showShowdownResult && setUserLowWinnerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", userLowWinnerIds.includes(p.id) ? "bg-blue-500 text-white shadow-lg" : "bg-white/10 text-slate-400 hover:bg-white/20")}>低牌贏家</button>}
                </div>
                {showShowdownResult && (
                  <div className="mt-2 w-full space-y-2 text-center animate-in slide-in-from-top-2">
                    <div className={cn("text-[10px] font-bold p-2 rounded border transition-all shadow-sm", p.isHighWinner ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-slate-800/50 text-slate-500 border-slate-700")}>{p.handDescription}</div>
                    {isHiLo && <div className={cn("text-[10px] font-bold p-2 rounded border transition-all shadow-sm", p.isLowWinner ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-slate-800/50 text-slate-500 border-slate-700")}>{p.lowDescription}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-md mx-auto space-y-4">
          {!showShowdownResult ? (<button disabled={userHighWinnerIds.length === 0} onClick={() => {setShowShowdownResult(true); updateStreak(isCorrect, 800);}} className="w-full bg-poker-gold text-poker-green font-black py-4 rounded-xl uppercase shadow-xl hover:bg-yellow-500 transition-all active:scale-95">確認分配結果</button>) : (
            <div className="space-y-3"><div className={cn("p-4 rounded-xl font-bold text-center border-2 text-lg animate-in zoom-in", isCorrect ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50")}>{isCorrect ? "判斷正確！" : "判斷錯誤。"}</div><button onClick={initShowdown} className="w-full bg-white text-poker-green font-black py-4 rounded-xl shadow-lg hover:bg-slate-100 transition-all">下一題練習</button></div>
          )}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (quizQuestions.length === 0) return null;
    const q = quizQuestions[currentQuizIdx];
    const handleOptionSelect = (opt: string) => { if (showQuizResult) return; setSelectedQuizOption(opt); setShowQuizResult(true); updateStreak(opt === q.answer, 600); };
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-black/40 border border-white/10 p-6 md:p-10 rounded-[2rem] shadow-2xl relative">
          <div className="flex justify-between items-center mb-6"><span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{q.category}</span><span className="text-slate-500 text-xs font-mono">Question {currentQuizIdx + 1} / {quizQuestions.length}</span></div>
          <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-10">{q.question}</h2>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(q.options).map(([key, text]) => (
              <button key={key} onClick={() => handleOptionSelect(key)} className={cn("w-full p-5 rounded-2xl text-left font-bold transition-all border-2 flex justify-between items-center group", showQuizResult ? (key === q.answer ? "bg-green-500/20 border-green-500 text-green-400" : (selectedQuizOption === key ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/5 text-slate-500")) : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-blue-500 hover:scale-[1.01]")}>
                <span>{key}. {text}</span>{showQuizResult && key === q.answer && <CheckCircle2 className="w-5 h-5 text-green-500" />}{showQuizResult && selectedQuizOption === key && key !== q.answer && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            ))}
          </div>
          {showQuizResult && (
            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-blue-400 mb-2 font-black uppercase text-xs tracking-widest"><AlertCircle className="w-4 h-4" /> 規則解析</div>
              <p className="text-blue-200 text-sm leading-relaxed whitespace-pre-line">{q.explanation}</p>
              <button onClick={() => { setCurrentQuizIdx(prev => (prev + 1) % quizQuestions.length); setSelectedQuizOption(null); setShowQuizResult(false); setStartTime(Date.now()); }} className="mt-6 w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2">下一題練習 <ArrowRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const rankTabConfig: { id: LeaderboardType; label: string; icon: any }[] = [
    { id: 'SPLIT_POT', label: '底池計算', icon: Calculator },
    { id: 'SHOWDOWN_HOLDEM', label: '德州判斷', icon: Eye },
    { id: 'SHOWDOWN_OMAHA', label: '奧馬哈判斷', icon: Eye },
    { id: 'SHOWDOWN_BIGO', label: 'BIGO 判斷', icon: Eye },
    { id: 'QUIZ', label: '理論測驗', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-poker-green text-white p-3 md:p-8 font-sans selection:bg-poker-gold selection:text-poker-green">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-2 md:gap-3 bg-black/40 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border border-white/10 shadow-lg w-full sm:w-auto justify-between sm:justify-start">
            {isChallengeActive && (
              <div className="flex flex-col items-center border-r border-white/20 pr-2 md:pr-4">
                <span className="text-[7px] md:text-[8px] text-red-400 font-bold uppercase animate-pulse">Time Left</span>
                <div className="text-lg md:text-2xl font-black font-mono">{formatTime(challengeTimeLeft)}</div>
              </div>
            )}
            <div className="flex flex-col items-center border-r border-white/20 px-2 md:px-4 relative">
              <span className="text-[7px] md:text-[8px] text-poker-gold font-bold uppercase tracking-widest">Points</span>
              <div className="flex items-center gap-1 text-poker-gold"><Coins className="w-3.5 h-3.5 md:w-4 md:h-4" /><span className="text-lg md:text-2xl font-black">{totalScore.toLocaleString()}</span></div>
              {lastPoints > 0 && <div className="text-[7px] md:text-[8px] text-green-400 font-bold animate-bounce absolute -top-4">+{lastPoints}</div>}
            </div>
            <div className="flex flex-col items-center px-2 md:px-4">
              <span className="text-[7px] md:text-[8px] text-poker-gold font-bold uppercase tracking-widest">Streak</span>
              <div className="flex items-center gap-1"><Flame className={cn("w-4 h-4 md:w-5 md:h-5", streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600")} /><span className="text-lg md:text-2xl font-black">{streak}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <h1 className="text-xl md:text-2xl font-black text-poker-gold flex items-center gap-3 drop-shadow-md">
              <img src={logo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain pointer-events-none select-none" />
              DEALERPRO
            </h1>
            <div className="flex gap-2">
              <button onClick={() => setShowRankModal(true)} className="bg-white/10 px-3 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs shadow-lg flex items-center gap-1.5 hover:bg-white/20 transition-all border border-white/5"><Medal className="w-3.5 h-3.5 md:w-4 md:h-4 text-poker-gold" /> 排行榜</button>
              {!isChallengeActive ? (
                <button onClick={startChallenge} className="bg-gradient-to-r from-red-600 to-orange-600 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-black text-[10px] md:text-xs animate-bounce shadow-xl flex items-center gap-1.5 hover:from-red-500 hover:to-orange-500 transition-all"><Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" /> 開始挑戰</button>
              ) : (
                <button onClick={() => {setIsChallengeActive(false); setTotalScore(0);}} className="bg-white/10 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs flex items-center gap-1.5 hover:bg-red-500/20 transition-all border border-red-500/20 text-red-400"><XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> 放棄</button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="bg-black/40 p-1 rounded-2xl flex border border-white/10 relative">
            {isChallengeActive && <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-red-400 font-bold flex items-center gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> 挑戰中鎖定模式</div>}
            <button disabled={isChallengeActive} onClick={() => {setMode('SPLIT_POT'); setStreak(0);}} className={cn("px-6 sm:px-8 py-3 rounded-xl font-bold text-xs transition-all", mode === 'SPLIT_POT' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400", isChallengeActive && "opacity-50 cursor-not-allowed")}>底池計算</button>
            <button disabled={isChallengeActive} onClick={() => {setMode('SHOWDOWN'); setStreak(0);}} className={cn("px-6 sm:px-8 py-3 rounded-xl font-bold text-xs transition-all", mode === 'SHOWDOWN' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400", isChallengeActive && "opacity-50 cursor-not-allowed")}>勝負判斷</button>
            <button disabled={isChallengeActive} onClick={() => {setMode('QUIZ'); setStreak(0);}} className={cn("px-6 sm:px-8 py-3 rounded-xl font-bold text-xs transition-all", mode === 'QUIZ' ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-400", isChallengeActive && "opacity-50 cursor-not-allowed")}>理論測驗</button>
          </div>
          {mode === 'SHOWDOWN' && (<div className="flex gap-2 relative">{isChallengeActive && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-red-400 font-bold animate-pulse">種類已鎖定</div>}{(['HOLDEM', 'OMAHA', 'BIGO'] as PokerLogic.GameVariant[]).map(v => (<button key={v} disabled={isChallengeActive} onClick={() => {setVariant(v); setStreak(0);}} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold transition-all", variant === v ? "bg-white/20 text-white" : "text-slate-500", isChallengeActive && "opacity-50 cursor-not-allowed")}>{v}</button>))}</div>)}
        </div>

        <div className="max-w-4xl mx-auto mb-10"><div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex gap-6 items-center backdrop-blur-sm"><div className="bg-poker-gold/20 p-4 rounded-2xl">{mode === 'SPLIT_POT' ? <Calculator className="w-8 h-8 text-poker-gold" /> : (mode === 'SHOWDOWN' ? <Eye className="w-8 h-8 text-blue-400" /> : <BookOpen className="w-8 h-8 text-blue-400" />)}</div><div className="space-y-1 text-slate-400 flex-1"><h3 className="text-white font-black uppercase tracking-wider">{mode === 'SPLIT_POT' ? '底池分配練習 (Pre-flop All-in)' : (mode === 'SHOWDOWN' ? '勝負判斷練習' : '理論知識測驗')}</h3><p className="text-xs leading-relaxed">{mode === 'SPLIT_POT' ? '模擬多位玩家在翻牌前全下的情境。計算主池與邊池金額，並依排名分配。' : (mode === 'SHOWDOWN' ? `判斷 ${variant} 規則下的贏家。` : '測試你對德州撲克規則與發牌程序的理解。')}</p>{mode === 'SHOWDOWN' && (<div className="mt-2 p-2 bg-blue-500/10 border-l-2 border-blue-500 text-[10px] text-blue-300">{variant === 'HOLDEM' ? '任意挑選 5 張。' : (variant === 'OMAHA' ? '強制 2 手牌 + 3 公牌。' : '高牌強制 2+3；低牌需 5 張 8 以下且不重複。')}</div>)}<div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="flex items-center gap-2"><Flame className="w-3 h-3 text-orange-500" /><div className="text-[10px]"><span className="text-white font-bold">連勝加成：</span>每連勝一場 +20% 分數</div></div><div className="flex items-center gap-2"><RefreshCw className="w-3 h-3 text-green-400" /><div className="text-[10px]"><span className="text-white font-bold">速度獎勵：</span>10秒內答對享 1.5x 加成</div></div><div className="flex items-center gap-2"><Star className="w-3 h-3 text-yellow-500" /><div className="text-[10px]"><span className="text-white font-bold">難度倍率：</span>BIGO(2x) &gt; Omaha(1.5x)</div></div></div></div></div></div>
        
        {mode === 'SPLIT_POT' ? renderSplitPot() : (mode === 'SHOWDOWN' ? renderShowdown() : renderQuiz())}

        {/* --- Profile Setup Modal --- */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[3000] p-4">
            <div className="bg-slate-900 border-2 border-poker-gold p-8 rounded-[3rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(201,160,80,0.2)]">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">新荷官入職設定</h2>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-8">請設定您的參賽個人資料</p>
              
              <AvatarUpload 
                userId={user?.id} 
                currentAvatarUrl={profile?.avatar_url || ''} 
                onUploadSuccess={(url) => setProfile(prev => prev ? ({ ...prev, avatar_url: url }) : null)} 
              />

              {/* 預設頭像挑選 */}
              <div className="mt-6">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-3">或挑選預設頭像</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {[
                    'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=Ace',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=Dealer',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=Shark',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=Chips'
                  ].map((url, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setProfile(prev => prev ? ({ ...prev, avatar_url: url }) : null)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 overflow-hidden bg-slate-800",
                        profile?.avatar_url === url ? "border-poker-gold ring-2 ring-poker-gold/20" : "border-white/10"
                      )}
                    >
                      <img src={url} alt="" className="w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">荷官暱稱</label>
                  <input 
                    type="text" 
                    placeholder="輸入暱稱 (最多12字)" 
                    value={playerName}
                    maxLength={12}
                    onChange={(e) => setPlayerName(e.target.value.replace(/[<>]/g, ''))}
                    className="w-full bg-black border-2 border-white/5 rounded-2xl p-4 text-white text-center font-bold focus:border-poker-gold outline-none transition-all"
                  />
                </div>
                
                <button 
                  onClick={() => saveProfile(playerName, profile?.avatar_url || null)}
                  disabled={isUpdatingProfile || !playerName.trim()}
                  className="w-full bg-poker-gold text-poker-green py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-yellow-500 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "完成入職設定"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Submission Modal --- */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-poker-gold p-8 rounded-[2rem] max-w-sm w-full text-center shadow-[0_0_50px_rgba(201,160,80,0.2)]">
              <Trophy className="w-16 h-16 text-poker-gold mx-auto mb-4" /><h2 className="text-2xl font-black text-white mb-2">挑戰結束！</h2>
              <div className="bg-white/5 rounded-2xl p-4 mb-6"><div className="text-slate-400 text-xs uppercase font-bold">{rankTabConfig.find(t=>t.id===currentType)?.label} 最終得分</div><div className="text-4xl font-black text-poker-gold">{finalScore.toLocaleString()}</div><div className="text-slate-500 text-[10px] mt-1 font-bold">連勝次數: {finalStreak}</div></div>
              <div className="flex flex-col gap-3">
                <div className="text-slate-300 font-bold">恭喜 {profile?.nickname} 進榜！</div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => {setShowSubmitModal(false); setTotalScore(0); setStreak(0);}} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs hover:text-white transition-colors">跳過</button>
                  <button onClick={handleSubmitScore} disabled={isSubmitting} className="flex-1 bg-poker-gold text-poker-green py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "登錄排行"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Leaderboard Modal --- */}
        {showRankModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-poker-gold/30 p-6 md:p-8 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-poker-gold/50 to-transparent"></div>
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-poker-gold flex items-center gap-3 tracking-widest"><Medal className="w-8 h-8" /> 全球荷官排行榜</h2><button onClick={() => setShowRankModal(false)} className="text-slate-500 hover:text-white transition-colors"><XCircle /></button></div>
              <div className="flex bg-black/40 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide border border-white/5">
                {rankTabConfig.map(tab => (
                  <button key={tab.id} onClick={() => setActiveRankTab(tab.id)} className={cn("px-4 py-2.5 rounded-lg font-bold text-[10px] md:text-xs transition-all flex items-center gap-2", activeRankTab === tab.id ? "bg-poker-gold text-poker-green shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-white/5")}>
                    <tab.icon className="w-3 h-3" /> {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {isLoadingRank ? (<div className="flex flex-col items-center py-20 text-slate-500"><Loader2 className="w-10 h-10 animate-spin mb-4" /><div className="font-bold uppercase tracking-widest text-xs">讀取排行中...</div></div>) : leaderboard.length > 0 ? (
                  leaderboard.map((e, i) => (
                    <div key={e.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/10 group">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all", i === 0 ? "bg-poker-gold text-poker-green scale-110 shadow-lg" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700")}>{i + 1}</div>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800">
                          {e.profiles?.avatar_url ? <img src={e.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-slate-600" />}
                        </div>
                        <div><div className="font-bold text-white group-hover:text-poker-gold transition-colors">{e.profiles?.nickname || e.name}</div><div className="text-[8px] text-slate-500">{new Date(e.created_at).toLocaleDateString()}</div></div>
                      </div>
                      <div className="text-right"><div className="text-lg font-black text-white group-hover:scale-105 transition-all">{e.score.toLocaleString()}</div><div className="text-[10px] text-poker-gold font-bold uppercase tracking-tighter">STREAK: {e.streak}</div></div>
                    </div>
                  ))
                ) : (<div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-3xl">該類別尚無紀錄</div>)}
              </div>
              <button onClick={() => setShowRankModal(false)} className="mt-8 w-full py-4 bg-white/5 text-slate-400 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all border border-white/10 active:scale-[0.98]">關閉視窗</button>
            </div>
          </div>
        )}

        {/* --- User Management Section (Header Profile Area) --- */}
        <div className="fixed bottom-8 left-8 z-50 flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 p-2 pr-6 rounded-full shadow-2xl animate-in slide-in-from-left-4">
              <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
                <div className="w-10 h-10 rounded-full border-2 border-poker-gold overflow-hidden bg-slate-800">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-slate-500" />}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity"><Settings className="w-4 h-4 text-white" /></div>
              </div>
              <div>
                <div className="text-[10px] text-poker-gold font-black uppercase tracking-tighter leading-none mb-1">Ranked Dealer</div>
                <div className="text-xs font-bold text-white leading-none">{profile?.nickname || '設定暱稱...'}</div>
              </div>
              <button onClick={handleLogout} className="ml-4 p-2 text-slate-500 hover:text-red-400 transition-colors" title="登出"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-2xl hover:bg-slate-100 transition-all animate-in slide-in-from-left-4">
              <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
              Google 一鍵入職
            </button>
          )}
        </div>

        <footer className="mt-20 text-center text-slate-500 text-[10px] border-t border-white/5 pt-8 uppercase tracking-[0.4em] opacity-50">Professional Dealer Training Utility • 2026</footer>
      </div>
    </div>
  );
};
export default App;