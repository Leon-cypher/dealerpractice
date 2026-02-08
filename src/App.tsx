import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as PotCalc from './utils/potCalculator';
import * as PokerLogic from './utils/pokerLogic';
import * as QuizLogic from './utils/quizLogic';
import { Question } from './utils/quizData';
import AvatarUpload from './components/AvatarUpload';
import logo from './assets/logo.png';

// --- Firebase Imports ---
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

import { 
  Trophy, XCircle, Info, Users, Coins, ArrowRight, Medal, Eye, 
  Calculator, Star, Flame, Loader2, BookOpen, CheckCircle2, AlertCircle, RefreshCw, LogIn, LogOut, Settings, User as UserIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  created_at: any;
  user_id?: string;
  avatar_url?: string;
}

// --- Card Component ---
const PokerCard: React.FC<{ card: PokerLogic.Card; hidden?: boolean; className?: string; style?: React.CSSProperties; mini?: boolean }> = ({ card, hidden, className, style, mini }) => {
  if (hidden) return (<div style={style} className={cn("poker-card bg-slate-900 border-slate-700", className)}><div className="text-slate-700 font-black text-xl">?</div></div>);
  const suitSymbol = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' }[card.suit];
  return (<div style={style} className={cn(mini ? "mini-card" : "poker-card", card.suit, className)}><div className={mini ? "text-sm" : "text-lg md:text-xl"}>{card.rank}</div>{!mini && <div className="text-xs md:text-sm opacity-80">{suitSymbol}</div>}{mini && <span className="ml-0.5">{suitSymbol}</span>}</div>);
};

interface ShowdownPlayer { id: number; name: string; cards: PokerLogic.Card[]; highScore: number; lowScore: number | null; handDescription: string; lowDescription: string; isHighWinner: boolean; isLowWinner: boolean; }
interface ShowdownScenario { variant: PokerLogic.GameVariant; communityCards: PokerLogic.Card[]; players: ShowdownPlayer[]; }

const App: React.FC = () => {
  // --- User & Auth States ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
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
  const [showInAppBrowserWarning, setShowInAppBrowserWarning] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [activeRankTab, setActiveRankTab] = useState<LeaderboardType>('SPLIT_POT');
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [minHighScores, setMinHighScores] = useState<Record<LeaderboardType, number>>({ SPLIT_POT: 0, SHOWDOWN_HOLDEM: 0, SHOWDOWN_OMAHA: 0, SHOWDOWN_BIGO: 0, QUIZ: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRank, setIsLoadingRank] = useState(false);

  // --- Auth Handlers ---
  const isInAppBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('line') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('instagram') ||
      ua.includes('twitter') ||
      ua.includes('micromessenger') ||
      ua.includes('whatsapp')
    );
  };

  const isSafariOrPrivateBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    
    // 偵測 Safari（但不是 Chrome）
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fxios');
    
    // 偵測 Firefox
    const isFirefox = ua.includes('firefox');
    
    // 偵測 Brave
    const isBrave = !!(navigator as any).brave;
    
    return isSafari || isFirefox || isBrave || isInAppBrowser();
  };

  const handleGoogleLogin = async () => {
    // 如果是社群媒體內建瀏覽器，先顯示提示
    if (isInAppBrowser()) {
      setShowInAppBrowserWarning(true);
      return;
    }

    try {
      // Safari、Firefox、Brave 直接使用 redirect
      if (isSafariOrPrivateBrowser()) {
        console.log("Detected privacy-focused browser, using redirect login");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      
      // 其他瀏覽器優先使用 popup
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Popup login failed:", error);
      
      // 如果是 popup 相關錯誤，嘗試使用 redirect
      if (
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.message?.includes('sessionStorage') ||
        error.message?.includes('popup')
      ) {
        try {
          console.log("Falling back to redirect login...");
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError: any) {
          console.error("Redirect login failed:", redirectError);
          alert('登入失敗。請嘗試：\n1. 使用外部瀏覽器開啟\n2. 允許 Cookies\n3. 關閉隱私保護模式');
        }
      } else if (error.code === 'auth/cancelled-popup-request') {
        // 使用者取消，不顯示錯誤
      } else {
        alert(`登入失敗：${error.message || '未知錯誤'}`);
      }
    }
  };

  const proceedWithInAppLogin = async () => {
    setShowInAppBrowserWarning(false);
    try {
      console.log("User chose to proceed with in-app browser login");
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("In-app browser login failed:", error);
      alert('登入失敗。建議使用外部瀏覽器開啟此網站以獲得最佳體驗。');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const fetchProfile = async (uid: string) => {
    const docRef = doc(db, "profiles", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Profile;
      setProfile(data);
      if (!data.nickname) setShowProfileModal(true);
    } else {
      const newProfile = { id: uid, nickname: '', avatar_url: null };
      await setDoc(docRef, newProfile);
      setProfile(newProfile);
      setShowProfileModal(true);
    }
  };

  useEffect(() => {
    // 檢查 redirect 登入結果
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect login successful");
      }
    }).catch((error) => {
      console.error("Redirect result error:", error);
      if (!error.message?.includes('no redirect operation')) {
        alert('登入過程發生錯誤，請重試');
      }
    });

    // 監聽認證狀態變化
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) fetchProfile(firebaseUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const saveProfile = async (nickname: string, avatarUrl: string | null) => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const docRef = doc(db, "profiles", user.uid);
      await setDoc(docRef, {
        id: user.uid,
        nickname,
        avatar_url: avatarUrl,
        updated_at: serverTimestamp(),
      }, { merge: true });
      
      setProfile({ id: user.uid, nickname, avatar_url: avatarUrl });
      setShowProfileModal(false);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      alert('儲存失敗');
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
      const q = query(
        collection(db, "leaderboard"),
        where("type", "==", type),
        orderBy("score", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
      });
      setLeaderboard(entries);
      setMinHighScores(prev => ({ ...prev, [type]: entries.length >= 10 ? entries[9].score : 0 }));
    } catch (err) { 
      console.error("Error fetching leaderboard:", err); 
      setLeaderboard([]);
    } finally { 
      setIsLoadingRank(false); 
    }
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
    setQuizQuestions(QuizLogic.getRandomQuestions(110)); // 載入全部 110 題
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
      setStreak(0);
      setLastPoints(0);
    }
  };

  const startChallenge = () => {
    if (!user) { alert('請先登入 Google 帳號以參加挑戰並列入排行榜！'); handleGoogleLogin(); return; }
    setIsChallengeActive(true); setChallengeTimeLeft(300); setTotalScore(0); setStreak(0); setLastPoints(0);
    setActiveRankTab(currentType); 
    if (mode === 'SPLIT_POT') initSplitPot(); else if (mode === 'SHOWDOWN') initShowdown(); else initQuiz();
  };

  const handleSubmitScore = async () => {
    if (isSubmitting || !profile?.nickname || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "leaderboard"), {
        name: profile.nickname,
        score: finalScore, 
        streak: finalStreak, 
        type: currentType,
        user_id: user.uid,
        avatar_url: profile.avatar_url, 
        created_at: serverTimestamp()
      });
      setShowSubmitModal(false); 
      setActiveRankTab(currentType); 
      fetchLeaderboard(currentType); 
      setShowRankModal(true);
    } catch (err) { 
      console.error("Error submitting score:", err); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const renderSplitPot = () => {
    const allPotsCorrect = correctPots.every(pot => parseInt(potAnswers[pot.name] || '0') === pot.amount);
    const allPayoutsCorrect = potPlayers.every(p => Number(payoutAnswers[p.id] || 0) === correctPayouts[p.id]);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <h2 className="text-[8px] font-black text-brand-gold uppercase tracking-[0.4em] mb-6 flex items-center gap-2"><Users className="w-3 h-3" /> 玩家下注詳情</h2>
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
            <div className="bg-gradient-to-r from-brand-gold/10 to-transparent border border-brand-gold/20 p-6 rounded-[2rem] shadow-xl">
              <h3 className="text-[8px] font-black text-brand-gold uppercase mb-4 flex items-center gap-2"><Coins className="w-3 h-3" /> 已確認底池</h3>
              <div className="flex flex-wrap gap-4">{correctPots.map(pot => (<div key={pot.name} className="bg-black/60 p-4 rounded-2xl min-w-[150px] border border-white/5 shadow-inner relative"><div className="absolute top-2 right-2 flex gap-0.5">{pot.eligiblePlayerIds.map(id => (<div key={id} className="w-3 h-3 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-[6px] text-brand-gold font-bold">{potPlayers.find(px => px.id === id)?.name.slice(-1)}</div>))}</div><div className="text-[8px] text-slate-500 uppercase mb-1">{pot.name}</div><div className="text-2xl font-black font-mono text-brand-gold">${pot.amount.toLocaleString()}</div></div>))}</div>
            </div>
          )}
        </div>
        <div className="bg-slate-900 border-2 border-brand-gold/40 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <h2 className="text-xl font-black text-white text-center uppercase tracking-widest">{stage === 'POTS' ? '底池金額核算' : '分配底池結果'}</h2>
          <div className="space-y-4">
            {stage === 'POTS' ? correctPots.map(pot => (
              <div key={pot.name}><label className="text-[8px] text-slate-500 uppercase ml-1 font-bold">{pot.name} 金額</label><input type="number" disabled={showPotResult} value={potAnswers[pot.name] || ''} onChange={e => setPotAnswers(prev => ({ ...prev, [pot.name]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-2xl p-5 font-mono text-2xl text-white outline-none transition-all", showPotResult ? (parseInt(potAnswers[pot.name]||'0')===pot.amount?"border-green-500 text-green-400":"border-red-500 text-red-400"):"border-white/10 focus:border-brand-gold")} placeholder="0" /></div>
            )) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 items-start"><Info className="w-4 h-4 text-blue-400 shrink-0" /><div className="text-[10px] text-blue-300 italic">餘數 (Odd Chips) 應分給 ID 較小的贏家。</div></div>
                {potPlayers.map(p => (
                  <div key={p.id}><label className="text-[8px] text-slate-500 uppercase ml-1 font-bold">{p.name} 獲配總額</label><input type="number" disabled={showPotResult} value={payoutAnswers[p.id] || ''} onChange={e => setPayoutAnswers(prev => ({ ...prev, [p.id]: e.target.value }))} className={cn("w-full bg-black/50 border-2 rounded-2xl p-5 font-mono text-2xl text-white outline-none transition-all", showPotResult ? (Number(payoutAnswers[p.id]||0)===correctPayouts[p.id]?"border-green-500 text-green-400":"border-red-500 text-red-400"):"border-white/10 focus:border-brand-gold")} placeholder="0" /></div>
                ))}
              </>
            )}
            {!showPotResult ? (
              <button onClick={() => {setShowPotResult(true); updateStreak(stage === 'POTS' ? allPotsCorrect : allPayoutsCorrect, stage === 'POTS' ? 500 : 1000);}} className="w-full bg-yellow-400 text-slate-900 font-black py-5 rounded-2xl uppercase shadow-xl hover:bg-yellow-300 transition-all active:scale-95">核對結果</button>
            ) : (
              <div className="space-y-3">
                {(stage === 'POTS' && allPotsCorrect) && <button onClick={() => {setStage('PAYOUTS'); setShowPotResult(false);}} className="w-full bg-white text-slate-900 font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">進入分配階段 <ArrowRight className="w-4 h-4" /></button>}
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
        <div className="bg-black/40 border border-brand-gold/30 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex justify-center gap-3 mb-8 overflow-x-auto pb-2">{showdown.communityCards.map((card, i) => (<PokerCard key={i} card={card} mini />))}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showdown.players.map(p => (
              <div key={p.id} className={cn("p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all", (userHighWinnerIds.includes(p.id) || userLowWinnerIds.includes(p.id)) ? "bg-brand-gold/10 border-brand-gold" : "bg-white/5 border-white/5")}>
                <div className="font-bold text-white">{p.name}</div>
                <div className="flex gap-1 flex-wrap justify-center">{p.cards.map((card, i) => (<PokerCard key={i} card={card} mini />))}</div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => !showShowdownResult && setUserHighWinnerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all", userHighWinnerIds.includes(p.id) ? "bg-yellow-400 text-slate-900 shadow-lg" : "bg-white/10 text-slate-300 hover:bg-white/20")}>{isHiLo ? "高牌贏家" : "贏家"}</button>
                  {isHiLo && <button onClick={() => !showShowdownResult && setUserLowWinnerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all", userLowWinnerIds.includes(p.id) ? "bg-blue-500 text-white shadow-lg" : "bg-white/10 text-slate-300 hover:bg-white/20")}>低牌贏家</button>}
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
          {!showShowdownResult ? (<button disabled={userHighWinnerIds.length === 0} onClick={() => {setShowShowdownResult(true); updateStreak(isCorrect, 800);}} className="w-full bg-yellow-400 text-slate-900 font-black py-4 rounded-xl uppercase shadow-xl hover:bg-yellow-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">確認分配結果</button>) : (
            <div className="space-y-3"><div className={cn("p-4 rounded-xl font-bold text-center border-2 text-lg animate-in zoom-in", isCorrect ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50")}>{isCorrect ? "判斷正確！" : "判斷錯誤。"}</div><button onClick={initShowdown} className="w-full bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg hover:bg-slate-100 transition-all">下一題練習</button></div>
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
    <div className="min-h-screen bg-brand-green text-white p-3 md:p-8 font-sans selection:bg-brand-gold selection:text-brand-green">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-2 md:gap-3 bg-black/40 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border border-white/10 shadow-lg w-full sm:w-auto justify-between sm:justify-start">
            {isChallengeActive && (
              <div className="flex flex-col items-center border-r border-white/20 pr-3 md:pr-4">
                <span className="text-[9px] md:text-[10px] text-red-400 font-bold uppercase animate-pulse">Time Left</span>
                <div className="text-xl md:text-2xl font-black font-mono">{formatTime(challengeTimeLeft)}</div>
              </div>
            )}
            <div className="flex flex-col items-center border-r border-white/20 px-3 md:px-4 relative">
              <span className="text-[9px] md:text-[10px] text-brand-gold font-bold uppercase tracking-widest">Points</span>
              <div className="flex items-center gap-1 text-brand-gold"><Coins className="w-4 h-4 md:w-5 md:h-5" /><span className="text-xl md:text-2xl font-black">{totalScore.toLocaleString()}</span></div>
              {lastPoints > 0 && <div className="text-[9px] md:text-[10px] text-green-400 font-bold animate-bounce absolute -top-4">+{lastPoints}</div>}
            </div>
            <div className="flex flex-col items-center px-3 md:px-4">
              <span className="text-[9px] md:text-[10px] text-brand-gold font-bold uppercase tracking-widest">Streak</span>
              <div className="flex items-center gap-1"><Flame className={cn("w-4 h-4 md:w-5 md:h-5", streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600")} /><span className="text-xl md:text-2xl font-black">{streak}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <h1 className="text-xl md:text-3xl font-black text-brand-gold flex items-center gap-2 md:gap-3 drop-shadow-md">
              <img src={logo} alt="Logo" className="w-10 h-10 md:w-16 md:h-16 object-contain pointer-events-none select-none" />
              <span className="hidden sm:inline">Leon-lab</span>
            </h1>
            <div className="flex gap-2">
              <button onClick={() => setShowRankModal(true)} className="bg-white/10 px-3 md:px-5 py-2.5 md:py-3 rounded-full font-bold text-xs md:text-sm shadow-lg flex items-center gap-1.5 hover:bg-white/20 transition-all border border-white/5"><Medal className="w-4 h-4 md:w-5 md:h-5 text-brand-gold" /> <span className="hidden sm:inline">排行榜</span></button>
              {!isChallengeActive ? (
                <button onClick={startChallenge} className="bg-gradient-to-r from-red-600 to-orange-600 px-4 md:px-6 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm animate-bounce shadow-xl flex items-center gap-1.5 hover:from-red-500 hover:to-orange-500 transition-all"><Flame className="w-4 h-4 md:w-5 md:h-5 text-white" /> 開始挑戰</button>
              ) : (
                <button onClick={() => {setIsChallengeActive(false); setTotalScore(0);}} className="bg-white/10 px-4 md:px-5 py-2.5 md:py-3 rounded-full font-bold text-xs md:text-sm flex items-center gap-1.5 hover:bg-red-500/20 transition-all border border-red-500/20 text-red-400"><XCircle className="w-4 h-4 md:w-5 md:h-5" /> 放棄</button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="bg-black/40 p-1 rounded-2xl flex flex-wrap justify-center border border-white/10 relative">
            {isChallengeActive && <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-red-400 font-bold flex items-center gap-1 animate-pulse whitespace-nowrap"><AlertCircle className="w-3.5 h-3.5" /> 挑戰中鎖定模式</div>}
            <button disabled={isChallengeActive} onClick={() => {setMode('SPLIT_POT'); setStreak(0);}} className={cn("px-5 sm:px-8 py-3 rounded-xl font-bold text-sm transition-all", mode === 'SPLIT_POT' ? "bg-yellow-400 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white", isChallengeActive && "opacity-50 cursor-not-allowed")}>底池計算</button>
            <button disabled={isChallengeActive} onClick={() => {setMode('SHOWDOWN'); setStreak(0);}} className={cn("px-5 sm:px-8 py-3 rounded-xl font-bold text-sm transition-all", mode === 'SHOWDOWN' ? "bg-yellow-400 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white", isChallengeActive && "opacity-50 cursor-not-allowed")}>勝負判斷</button>
            <button disabled={isChallengeActive} onClick={() => {setMode('QUIZ'); setStreak(0);}} className={cn("px-5 sm:px-8 py-3 rounded-xl font-bold text-sm transition-all", mode === 'QUIZ' ? "bg-yellow-400 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white", isChallengeActive && "opacity-50 cursor-not-allowed")}>理論測驗</button>
          </div>
          {mode === 'SHOWDOWN' && (<div className="flex gap-2 relative">{isChallengeActive && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-red-400 font-bold animate-pulse whitespace-nowrap">種類已鎖定</div>}{(['HOLDEM', 'OMAHA', 'BIGO'] as PokerLogic.GameVariant[]).map(v => (<button key={v} disabled={isChallengeActive} onClick={() => {setVariant(v); setStreak(0);}} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", variant === v ? "bg-white/20 text-white" : "text-slate-400", isChallengeActive && "opacity-50 cursor-not-allowed")}>{v}</button>))}</div>)}
        </div>

        <div className="max-w-4xl mx-auto mb-10"><div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center backdrop-blur-sm"><div className="bg-brand-gold/20 p-3 md:p-4 rounded-2xl shrink-0">{mode === 'SPLIT_POT' ? <Calculator className="w-6 h-6 md:w-8 md:h-8 text-brand-gold" /> : (mode === 'SHOWDOWN' ? <Eye className="w-6 h-6 md:w-8 md:h-8 text-blue-400" /> : <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />)}</div><div className="space-y-2 text-slate-400 flex-1"><h3 className="text-white font-black uppercase tracking-wider text-sm md:text-base">{mode === 'SPLIT_POT' ? '底池分配練習 (Pre-flop All-in)' : (mode === 'SHOWDOWN' ? '勝負判斷練習' : '理論知識測驗')}</h3><p className="text-xs md:text-sm leading-relaxed">{mode === 'SPLIT_POT' ? '模擬多位玩家在翻牌前全下的情境。計算主池與邊池金額，並依排名分配。' : (mode === 'SHOWDOWN' ? `判斷 ${variant} 規則下的贏家。` : '測試你對德州撲克規則與發牌程序的理解。')}</p>{mode === 'SHOWDOWN' && (<div className="mt-2 p-2 md:p-3 bg-blue-500/10 border-l-2 border-blue-500 text-xs text-blue-300">{variant === 'HOLDEM' ? '任意挑選 5 張。' : (variant === 'OMAHA' ? '強制 2 手牌 + 3 公牌。' : '高牌強制 2+3；低牌需 5 張 8 以下且不重複。')}</div>)}<div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-orange-500" /><div className="text-xs"><span className="text-white font-bold">連勝加成：</span>每連勝一場 +20% 分數</div></div><div className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-green-400" /><div className="text-xs"><span className="text-white font-bold">速度獎勵：</span>10秒內答對享 1.5x 加成</div></div><div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-yellow-500" /><div className="text-xs"><span className="text-white font-bold">難度倍率：</span>BIGO(2x) &gt; Omaha(1.5x)</div></div></div></div></div></div>
        
        {mode === 'SPLIT_POT' ? renderSplitPot() : (mode === 'SHOWDOWN' ? renderShowdown() : renderQuiz())}

        {/* --- Profile Setup Modal --- */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[3000] p-4">
            <div className="bg-slate-900 border-2 border-brand-gold p-8 rounded-[3rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(201,160,80,0.2)] relative">
              {/* 關閉按鈕 - 只有已設定暱稱的使用者才能關閉 */}
              {profile?.nickname && (
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  title="關閉"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              )}
              
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">新荷官入職設定</h2>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-8">請設定您的參賽個人資料</p>
              
              <AvatarUpload 
                userId={user?.uid || ''} 
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
                        profile?.avatar_url === url ? "border-brand-gold ring-2 ring-brand-gold/20" : "border-white/10"
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
                    className="w-full bg-black border-2 border-white/5 rounded-2xl p-4 text-white text-center font-bold focus:border-brand-gold outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3">
                  {profile?.nickname && (
                    <button 
                      onClick={() => setShowProfileModal(false)}
                      className="flex-1 bg-white/10 text-white py-5 rounded-2xl font-bold uppercase hover:bg-white/20 transition-all"
                    >
                      取消
                    </button>
                  )}
                  <button 
                    onClick={() => saveProfile(playerName, profile?.avatar_url || null)}
                    disabled={isUpdatingProfile || !playerName.trim()}
                    className={cn(
                      "py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 bg-yellow-400 text-slate-900",
                      profile?.nickname ? "flex-1" : "w-full"
                    )}
                  >
                    {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : (profile?.nickname ? "儲存變更" : "完成入職設定")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Submission Modal --- */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-brand-gold p-8 rounded-[2rem] max-w-sm w-full text-center shadow-[0_0_50px_rgba(201,160,80,0.2)]">
              <Trophy className="w-16 h-16 text-brand-gold mx-auto mb-4" /><h2 className="text-2xl font-black text-white mb-2">挑戰結束！</h2>
              <div className="bg-white/5 rounded-2xl p-4 mb-6"><div className="text-slate-400 text-xs uppercase font-bold">{rankTabConfig.find(t=>t.id===currentType)?.label} 最終得分</div><div className="text-4xl font-black text-brand-gold">{finalScore.toLocaleString()}</div><div className="text-slate-500 text-[10px] mt-1 font-bold">連勝次數: {finalStreak}</div></div>
              <div className="flex flex-col gap-3">
                <div className="text-slate-300 font-bold">恭喜 {profile?.nickname} 進榜！</div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => {setShowSubmitModal(false); setTotalScore(0); setStreak(0);}} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs hover:text-white transition-colors">跳過</button>
                  <button onClick={handleSubmitScore} disabled={isSubmitting} className="flex-1 bg-yellow-400 text-slate-900 py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "登錄排行"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Leaderboard Modal --- */}
        {showRankModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-brand-gold/30 p-6 md:p-8 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"></div>
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-brand-gold flex items-center gap-3 tracking-widest"><Medal className="w-8 h-8" /> 全球荷官排行榜</h2><button onClick={() => setShowRankModal(false)} className="text-slate-500 hover:text-white transition-colors"><XCircle /></button></div>
              <div className="flex bg-black/40 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide border border-white/5">
                {rankTabConfig.map(tab => (
                  <button key={tab.id} onClick={() => setActiveRankTab(tab.id)} className={cn("px-4 py-2.5 rounded-lg font-bold text-[10px] md:text-xs transition-all flex items-center gap-2", activeRankTab === tab.id ? "bg-yellow-400 text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-200 hover:bg-white/5")}>
                    <tab.icon className="w-3 h-3" /> {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {isLoadingRank ? (<div className="flex flex-col items-center py-20 text-slate-500"><Loader2 className="w-10 h-10 animate-spin mb-4" /><div className="font-bold uppercase tracking-widest text-xs">讀取排行中...</div></div>) : leaderboard.length > 0 ? (
                  leaderboard.map((e, i) => (
                    <div key={e.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/10 group">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all", i === 0 ? "bg-yellow-400 text-slate-900 scale-110 shadow-lg" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700")}>{i + 1}</div>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800">
                          {e.avatar_url ? <img src={e.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-slate-600" />}
                        </div>
                        <div><div className="font-bold text-white group-hover:text-brand-gold transition-colors">{e.name}</div><div className="text-[8px] text-slate-500">{e.created_at?.seconds ? new Date(e.created_at.seconds * 1000).toLocaleDateString() : '---'}</div></div>
                      </div>
                      <div className="text-right"><div className="text-lg font-black text-white group-hover:scale-105 transition-all">{e.score.toLocaleString()}</div><div className="text-[10px] text-brand-gold font-bold uppercase tracking-tighter">STREAK: {e.streak}</div></div>
                    </div>
                  ))
                ) : (<div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-3xl">該類別尚無紀錄</div>)}
              </div>
              <button onClick={() => setShowRankModal(false)} className="mt-8 w-full py-4 bg-white/5 text-slate-400 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all border border-white/10 active:scale-[0.98]">關閉視窗</button>
            </div>
          </div>
        )}

        {/* --- User Management Section --- */}
        <div className="fixed bottom-4 right-4 md:bottom-8 md:left-8 md:right-auto z-50 flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 md:gap-3 bg-black/60 backdrop-blur-xl border border-white/10 p-2 md:pr-6 rounded-full shadow-2xl animate-in slide-in-from-right-4 md:slide-in-from-left-4">
              <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
                <div className="w-10 h-10 md:w-10 md:h-10 rounded-full border-2 border-brand-gold overflow-hidden bg-slate-800">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-slate-500" />}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity"><Settings className="w-4 h-4 text-white" /></div>
              </div>
              <div className="hidden md:block">
                <div className="text-[10px] text-brand-gold font-black uppercase tracking-tighter leading-none mb-1">Ranked Dealer</div>
                <div className="text-xs font-bold text-white leading-none">{profile?.nickname || '設定暱稱...'}</div>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="登出"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} className="flex items-center gap-2 md:gap-3 bg-white text-black px-4 py-3 md:px-6 md:py-3 rounded-full font-bold text-sm shadow-2xl hover:bg-slate-100 transition-all animate-in slide-in-from-right-4 md:slide-in-from-left-4">
              <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
              <span className="hidden sm:inline">Google 一鍵入職</span>
              <span className="sm:hidden">登入</span>
            </button>
          )}
        </div>

        <footer className="mt-20 text-center text-slate-500 text-[10px] border-t border-white/5 pt-8 uppercase tracking-[0.2em] opacity-50">Leon-lab Training Utility • 2026</footer>
      </div>

      {/* --- In-App Browser Warning Modal --- */}
      {showInAppBrowserWarning && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[4000] p-4">
          <div className="bg-slate-900 border-2 border-red-500 p-6 md:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">無法在此環境登入</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                偵測到您正在使用 App 內建瀏覽器（如 LINE、Facebook 等）。
                根據 <span className="text-red-400 font-bold">Google 安全政策</span>，
                此環境不支援 Google 登入。
              </p>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-200">
                  <p className="font-bold mb-1">Google 安全限制：</p>
                  <p>為了保護您的帳號安全，Google 不允許在內建瀏覽器中進行登入。這是無法繞過的安全機制。</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200 space-y-2">
                  <p className="font-bold">請使用外部瀏覽器開啟：</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-300">
                    <li><span className="font-bold">LINE</span>：點選右上角「•••」→「在其他瀏覽器開啟」</li>
                    <li><span className="font-bold">Facebook/IG</span>：點選右上角「⋯」→「在瀏覽器開啟」</li>
                    <li><span className="font-bold">或直接複製網址</span>：到 Chrome/Safari 開啟</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  // 複製網址到剪貼簿
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    alert('✅ 網址已複製！\n請貼到 Chrome、Safari 或 Edge 開啟。');
                  }).catch(() => {
                    alert('請手動複製網址：\n' + window.location.href);
                  });
                }}
                className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                複製網址（推薦）
              </button>
              <button 
                onClick={() => setShowInAppBrowserWarning(false)}
                className="w-full bg-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10"
              >
                關閉
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              網址：<span className="text-blue-400 font-mono break-all">{window.location.hostname}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;