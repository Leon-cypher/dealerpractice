import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

// Firebase
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Hooks
import { useModal } from '../hooks/useModal';
import { useCountdown } from '../hooks/useCountdown';
import type { LeaderboardType } from '../hooks/useLeaderboard';
import { useToast } from '../hooks/useToast';
import { useGameAuth } from '../hooks/useGameAuth';
import { useGameScore } from '../hooks/useGameScore';
import { useSplitPotGame } from '../hooks/useSplitPotGame';
import { useShowdownGame } from '../hooks/useShowdownGame';
import { useQuizGame } from '../hooks/useQuizGame';
import { useBlindsGame } from '../hooks/useBlindsGame';
import { generateBlindsNLQuestion, generateBlindsPLQuestion } from '../utils/blindsLogic';

// Components
import { SplitPotGame } from '../components/SplitPotGame';
import { ShowdownGame } from '../components/ShowdownGame';
import { QuizGame } from '../components/QuizGame';
import { BlindsGame } from '../components/BlindsGame';
import { ProfileModal } from '../components/ProfileModal';
import { ToastContainer } from '../components/Toast';
import { InAppBrowserWarningModal } from '../components/InAppBrowserWarningModal';

// Icons
import {
  Trophy, XCircle, Info, Coins, Eye,
  Calculator, Star, Flame, Loader2, BookOpen, AlertCircle, RefreshCw, LogOut, Settings, User as UserIcon, ArrowLeft, BarChart3
} from 'lucide-react';

// Utils
import { cn } from '../utils/cn';
import { useAchievements } from '../hooks/useAchievements';
import { useAchievementToast } from '../hooks/useAchievementToast';
import { AchievementToast } from '../components/AchievementToast';

export const GamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameType, gameVariant, gameMode } = useGame();
  const isChallengeActive = gameMode === 'CHALLENGE';

  // Toast
  const { toasts, showToast, dismissToast } = useToast();

  // Auth
  const gameAuth = useGameAuth(showToast);

  // Achievements
  const { notifications: achievementNotifications, showAchievement, dismissAchievement } = useAchievementToast();
  const achievements = useAchievements(gameAuth.user?.uid, showAchievement);

  // Modals
  const profileModal = useModal(false);
  const submitModal = useModal(false);

  // Challenge & Leaderboard
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Challenge advance ref (avoids circular hook deps) ---
  const advanceRef = useRef<() => void>(() => {});
  const achievementGameEndRef = useRef<() => void>(() => {});
  const practiceEndRef = useRef<() => void>(() => {});

  const currentType = useMemo((): LeaderboardType => {
    if (gameType === 'SPLIT_POT') return 'SPLIT_POT';
    if (gameType === 'QUIZ') return 'QUIZ';
    if (gameType === 'BLINDS') return 'BLINDS';
    if (gameType === 'BLINDS_PL') return 'BLINDS_PL';
    if (gameVariant === 'HOLDEM') return 'SHOWDOWN_HOLDEM';
    if (gameVariant === 'OMAHA') return 'SHOWDOWN_OMAHA';
    return 'SHOWDOWN_BIGO';
  }, [gameType, gameVariant]);

  // Score
  const score = useGameScore({
    isChallengeActive,
    gameType,
    gameVariant,
    onChallengeAdvance: () => advanceRef.current(),
  });
  const { getAnswerDuration } = score;

  // Game hooks
  const splitPot = useSplitPotGame();
  const showdown = useShowdownGame(gameVariant);
  const quiz = useQuizGame();
  const blinds = useBlindsGame(generateBlindsNLQuestion);
  const blindsPL = useBlindsGame(generateBlindsPLQuestion);

  // Countdown
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const countdown = useCountdown({
    initialTime: 300,
    onComplete: () => {
      achievementGameEndRef.current();
      if (score.totalScore > 0) {
        setFinalScore(score.totalScore);
        setFinalStreak(score.streak);
        submitModal.open();
      } else {
        showToast(`挑戰結束！最終得分：${score.totalScore.toLocaleString()}`, 'info');
        navigate('/game-menu');
      }
    }
  });

  // --- Challenge advance logic (kept here to access all game hooks) ---
  const performAdvance = useCallback(() => {
    if (gameType === 'SPLIT_POT') {
      splitPot.init();
      score.resetStartTime();
    } else if (gameType === 'SHOWDOWN') {
      showdown.init();
      score.resetStartTime();
    } else if (gameType === 'QUIZ') {
      quiz.nextQuestion();
      score.resetStartTime();
    } else if (gameType === 'BLINDS') {
      blinds.init();
      score.resetStartTime();
    } else if (gameType === 'BLINDS_PL') {
      blindsPL.init();
      score.resetStartTime();
    }
  }, [gameType, splitPot, showdown, quiz, blinds, blindsPL, score]);

  useEffect(() => {
    advanceRef.current = performAdvance;
  }, [performAdvance]);

  useEffect(() => {
    achievementGameEndRef.current = () => {
      if (gameAuth.user && gameType) {
        achievements.recordGameEnd({
          gameType: gameType || '',
          gameVariant,
          gameMode: 'CHALLENGE',
          finalScore: score.totalScore,
          finalStreak: score.streak,
        });
      }
    };
  });

  useEffect(() => {
    practiceEndRef.current = () => {
      if (!isChallengeActive && gameAuth.user && gameType && score.bestStreak > 0) {
        achievements.recordGameEnd({
          gameType,
          gameVariant,
          gameMode: 'PRACTICE',
          finalScore: 0,
          finalStreak: score.bestStreak,
        });
      }
    };
  });

  useEffect(() => {
    return () => { practiceEndRef.current(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Initialize games on mount / gameType change ---
  useEffect(() => {
    if (gameType === 'SPLIT_POT') { splitPot.init(); score.resetStartTime(); }
    else if (gameType === 'SHOWDOWN') { showdown.init(); score.resetStartTime(); }
    else if (gameType === 'QUIZ') { quiz.init(); score.resetStartTime(); }
    else if (gameType === 'BLINDS') { blinds.init(); score.resetStartTime(); }
    else if (gameType === 'BLINDS_PL') { blindsPL.init(); score.resetStartTime(); }
  }, [gameType, gameVariant]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start countdown for challenge mode
  useEffect(() => {
    if (isChallengeActive) countdown.start();
    return () => countdown.stop();
  }, [isChallengeActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open profile modal when user has no nickname
  useEffect(() => {
    if (gameAuth.needsProfileSetup) profileModal.open();
  }, [gameAuth.needsProfileSetup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch leaderboard when rank modal opens or tab changes - removed, leaderboard is now a separate page

  // Redirect if no game selected
  useEffect(() => {
    if (!gameType) navigate('/game-menu');
  }, [gameType, navigate]);

  // --- Game Handlers ---
  const handleSplitPotCheck = useCallback(() => {
    const isCorrect = splitPot.checkResult();
    score.updateStreak(isCorrect, 800);
    if (isCorrect) {
      achievements.checkAnswer({
        correct: true,
        durationSeconds: getAnswerDuration(),
        streak: score.streak + 1,
      });
    }
  }, [splitPot, score, achievements, getAnswerDuration]);

  const handleShowdownCheck = useCallback(() => {
    const isCorrect = showdown.checkResult();
    score.updateStreak(isCorrect, 800);
    if (isCorrect) {
      achievements.checkAnswer({
        correct: true,
        durationSeconds: getAnswerDuration(),
        streak: score.streak + 1,
      });
    }
  }, [showdown, score, achievements, getAnswerDuration]);

  const handleQuizSelect = useCallback((opt: string) => {
    const correct = quiz.selectOption(opt);
    if (correct !== null) score.updateStreak(correct, 600);
    if (correct === true) {
      achievements.checkAnswer({
        correct: true,
        durationSeconds: getAnswerDuration(),
        streak: score.streak + 1,
      });
    }
  }, [quiz, score, achievements, getAnswerDuration]);

  const handleQuizNext = useCallback(() => {
    quiz.nextQuestion();
    score.resetStartTime();
  }, [quiz, score]);

  const handleBlindsCheck = useCallback(() => {
    const isCorrect = blinds.checkResult();
    const pts = blinds.question?.type === 'REOPEN_ACTION' ? 500 : 600;
    score.updateStreak(isCorrect, pts);
    if (isCorrect) {
      achievements.checkAnswer({
        correct: true,
        durationSeconds: getAnswerDuration(),
        streak: score.streak + 1,
      });
    }
  }, [blinds, score, achievements, getAnswerDuration]);

  const handleBlindsNext = useCallback(() => {
    blinds.init();
    score.resetStartTime();
  }, [blinds, score]);

  const handleBlindsPLCheck = useCallback(() => {
    const isCorrect = blindsPL.checkResult();
    score.updateStreak(isCorrect, 700);
    if (isCorrect) {
      achievements.checkAnswer({
        correct: true,
        durationSeconds: getAnswerDuration(),
        streak: score.streak + 1,
      });
    }
  }, [blindsPL, score, achievements, getAnswerDuration]);

  const handleBlindsPLNext = useCallback(() => {
    blindsPL.init();
    score.resetStartTime();
  }, [blindsPL, score]);

  const handleBackToMenu = useCallback(() => {
    if (isChallengeActive) countdown.stop();
    navigate('/game-menu');
  }, [navigate, isChallengeActive, countdown]);

  const handleSubmitScore = useCallback(async () => {
    if (isSubmitting || !gameAuth.profile?.nickname || !gameAuth.user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'leaderboard'), {
        name: gameAuth.profile.nickname,
        score: finalScore,
        streak: finalStreak,
        type: currentType,
        user_id: gameAuth.user.uid,
        avatar_url: gameAuth.profile.avatar_url,
        created_at: serverTimestamp(),
      });
      submitModal.close();
      showToast('成績已登錄排行榜！', 'success');
      navigate('/game-menu');
    } catch {
      showToast('提交成績失敗，請重試。', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, gameAuth.profile, gameAuth.user, finalScore, finalStreak, currentType, submitModal, showToast, navigate]);

  const rankTabConfig = useMemo(() => [
    { id: 'SPLIT_POT' as LeaderboardType, label: '底池計算' },
    { id: 'SHOWDOWN_HOLDEM' as LeaderboardType, label: '德州判斷' },
    { id: 'SHOWDOWN_OMAHA' as LeaderboardType, label: '奧馬哈判斷' },
    { id: 'SHOWDOWN_BIGO' as LeaderboardType, label: 'BIGO 判斷' },
    { id: 'QUIZ' as LeaderboardType, label: '理論知識' },
    { id: 'BLINDS' as LeaderboardType, label: 'NL 加注' },
    { id: 'BLINDS_PL' as LeaderboardType, label: 'PL 加注' },
  ], []);

  if (!gameType) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-3 md:p-8 font-sans selection:bg-brand-gold selection:text-brand-green relative overflow-hidden">
      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <AchievementToast notifications={achievementNotifications} onDismiss={dismissAchievement} />

      {/* Dynamic Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-8 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 md:gap-3 bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-xl px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] w-full sm:w-auto justify-around sm:justify-start hover:shadow-[0_8px_32px_0_rgba(201,160,80,0.15)] transition-all duration-300">
            {isChallengeActive && (
              <div className="flex flex-col items-center border-r border-white/20 pr-3 md:pr-4">
                <span className="text-[9px] md:text-[10px] text-red-400 font-bold uppercase animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">Time Left</span>
                <div className="text-xl md:text-2xl font-black font-mono text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">{formatTime(countdown.timeLeft)}</div>
              </div>
            )}
            <div className="flex flex-col items-center border-r border-white/20 px-3 md:px-4 relative">
              <span className="text-[9px] md:text-[10px] text-brand-gold font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(201,160,80,0.5)]">Points</span>
              <div className="flex items-center gap-1 text-brand-gold drop-shadow-[0_2px_12px_rgba(201,160,80,0.4)]">
                <Coins className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                <span className="text-xl md:text-2xl font-black">{score.totalScore.toLocaleString()}</span>
              </div>
              {score.lastPoints > 0 && <div className="text-[9px] md:text-[10px] text-green-400 font-bold animate-bounce absolute -top-4 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">+{score.lastPoints}</div>}
            </div>
            <div className="flex flex-col items-center px-3 md:px-4">
              <span className="text-[9px] md:text-[10px] text-brand-gold font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(201,160,80,0.5)]">Streak</span>
              <div className="flex items-center gap-1">
                <Flame className={cn("w-4 h-4 md:w-5 md:h-5", score.streak > 0 ? "text-orange-500 animate-pulse drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]" : "text-slate-600")} />
                <span className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">{score.streak}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <h1 className="text-xl md:text-3xl font-black text-brand-gold drop-shadow-[0_4px_16px_rgba(201,160,80,0.5)]">
              <span>Leon-lab</span>
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleBackToMenu}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm px-4 md:px-5 py-2.5 md:py-3 rounded-full font-bold text-xs md:text-sm flex items-center gap-1.5 hover:shadow-[0_4px_24px_0_rgba(239,68,68,0.3)] hover:from-red-500/20 hover:to-red-600/20 transition-all duration-300 border border-white/10 group"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="hidden sm:inline">返回</span>
              </button>
            </div>
          </div>
        </div>

        {/* Game Title & Instructions */}
        <div className="max-w-4xl mx-auto mb-3 sm:mb-10">
          <div className="bg-gradient-to-br from-emerald-900/20 via-emerald-800/10 to-emerald-900/20 backdrop-blur-xl border border-emerald-500/30 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_48px_0_rgba(16,185,129,0.15)] transition-all duration-500 group">
            <div className="bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 p-3 md:p-4 rounded-2xl shrink-0 shadow-[0_4px_16px_0_rgba(201,160,80,0.3)] group-hover:shadow-[0_4px_24px_0_rgba(201,160,80,0.5)] transition-all duration-300 group-hover:scale-105">
              {gameType === 'SPLIT_POT' ? (
                <Calculator className="w-6 h-6 md:w-8 md:h-8 text-brand-gold drop-shadow-[0_2px_8px_rgba(201,160,80,0.8)]" />
              ) : gameType === 'SHOWDOWN' ? (
                <Eye className="w-6 h-6 md:w-8 md:h-8 text-blue-400 drop-shadow-[0_2px_8px_rgba(96,165,250,0.8)]" />
              ) : gameType === 'BLINDS' ? (
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]" />
              ) : gameType === 'BLINDS_PL' ? (
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-cyan-400 drop-shadow-[0_2px_8px_rgba(34,211,238,0.8)]" />
              ) : (
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-400 drop-shadow-[0_2px_8px_rgba(96,165,250,0.8)]" />
              )}
            </div>
            <div className="space-y-2 text-slate-400 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-wider text-sm md:text-base drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
                  {gameType === 'SPLIT_POT' ? '底池分配練習 (Pre-flop All-in)' :
                   gameType === 'SHOWDOWN' ? '勝負判斷練習' :
                   gameType === 'BLINDS' ? 'NL 加注計算練習' :
                   gameType === 'BLINDS_PL' ? 'PL 加注計算練習' : '理論知識測驗'}
                  {gameType === 'SHOWDOWN' && ` - ${gameVariant}`}
                </h3>
                <span className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full shadow-lg",
                  gameMode === 'CHALLENGE' ? "bg-red-500/30 text-red-300 border border-red-400/50 shadow-[0_0_16px_rgba(248,113,113,0.3)]" : "bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-[0_0_16px_rgba(96,165,250,0.3)]"
                )}>
                  {gameMode === 'CHALLENGE' ? '挑戰模式' : '練習模式'}
                </span>
              </div>
              <p className="text-xs md:text-sm leading-relaxed">
                {gameType === 'SPLIT_POT' ? '模擬多位玩家在翻牌前全下的情境。計算主池與邊池金額，並依排名分配。' :
                 gameType === 'SHOWDOWN' ? `判斷 ${gameVariant} 規則下的贏家。` :
                 gameType === 'BLINDS' ? '練習 NL 最小加注計算與全下重開行動判斷。' :
                 gameType === 'BLINDS_PL' ? '練習 Pot-Limit 最大加注計算（最大加注 = 跟注 + 跟注後底池 = P + 3B）。' :
                 '測試你對德州撲克規則與發牌程序的理解。'}
              </p>
              {gameType === 'SHOWDOWN' && (
                <div className="mt-2 p-2 md:p-3 bg-gradient-to-r from-blue-500/20 to-blue-600/10 backdrop-blur-sm border-l-2 border-blue-400 text-xs text-blue-200 rounded-r-lg shadow-[0_2px_16px_rgba(96,165,250,0.2)]">
                  {gameVariant === 'HOLDEM' ? '任意挑選 5 張。' :
                   gameVariant === 'OMAHA' ? '強制 2 手牌 + 3 公牌。' :
                   '高牌強制 2+3；低牌需 5 張 8 以下且不重複。'}
                </div>
              )}
              <div className="hidden sm:grid mt-4 pt-4 border-t border-white/10 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 group/item hover:scale-105 transition-transform duration-200">
                  <Flame className="w-3.5 h-3.5 text-orange-500 group-hover/item:animate-pulse" />
                  <div className="text-xs"><span className="text-white font-bold">連勝加成：</span>每連勝一場 +20% 分數</div>
                </div>
                <div className="flex items-center gap-2 group/item hover:scale-105 transition-transform duration-200">
                  <RefreshCw className="w-3.5 h-3.5 text-green-400 group-hover/item:animate-spin" />
                  <div className="text-xs"><span className="text-white font-bold">速度獎勵：</span>10秒內答對享 1.5x 加成</div>
                </div>
                <div className="flex items-center gap-2 group/item hover:scale-105 transition-transform duration-200">
                  <Star className="w-3.5 h-3.5 text-yellow-500 group-hover/item:animate-pulse" />
                  <div className="text-xs"><span className="text-white font-bold">難度倍率：</span>BIGO(2x) &gt; Omaha(1.5x)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Content */}
        {gameType === 'SPLIT_POT' ? (
          <SplitPotGame
            potPlayers={splitPot.potPlayers}
            potAmountAnswers={splitPot.potAmountAnswers}
            userEligible={splitPot.userEligible}
            showResult={splitPot.showResult}
            correctPots={splitPot.correctPots}
            scenarioContext={splitPot.scenarioContext}
            onAmountChange={splitPot.handleAmountChange}
            onToggleEligible={splitPot.handleToggleEligible}
            onCheckResult={handleSplitPotCheck}
            onReset={splitPot.init}
          />
        ) : gameType === 'SHOWDOWN' && showdown.showdown ? (
          <ShowdownGame
            variant={gameVariant}
            communityCards={showdown.showdown.communityCards}
            players={showdown.showdown.players}
            userHighWinnerIds={showdown.userHighWinnerIds}
            userLowWinnerIds={showdown.userLowWinnerIds}
            showResult={showdown.showResult}
            onToggleHighWinner={showdown.handleToggleHighWinner}
            onToggleLowWinner={showdown.handleToggleLowWinner}
            onCheckResult={handleShowdownCheck}
            onReset={showdown.init}
          />
        ) : gameType === 'QUIZ' ? (
          <QuizGame
            questions={quiz.questions}
            currentIndex={quiz.currentIdx}
            selectedOption={quiz.selectedOption}
            showResult={quiz.showResult}
            onSelectOption={handleQuizSelect}
            onNext={handleQuizNext}
          />
        ) : gameType === 'BLINDS' && blinds.question ? (
          <BlindsGame
            question={blinds.question}
            userInput={blinds.userInput}
            boolSelection={blinds.boolSelection}
            showResult={blinds.showResult}
            isCorrect={blinds.isCorrect}
            onInputChange={blinds.setUserInput}
            onBoolSelect={blinds.setBoolSelection}
            onCheckResult={handleBlindsCheck}
            onNext={handleBlindsNext}
          />
        ) : gameType === 'BLINDS_PL' && blindsPL.question ? (
          <BlindsGame
            question={blindsPL.question}
            userInput={blindsPL.userInput}
            boolSelection={blindsPL.boolSelection}
            showResult={blindsPL.showResult}
            isCorrect={blindsPL.isCorrect}
            onInputChange={blindsPL.setUserInput}
            onBoolSelect={blindsPL.setBoolSelection}
            onCheckResult={handleBlindsPLCheck}
            onNext={handleBlindsPLNext}
          />
        ) : null}

        {/* Modals */}
        <ProfileModal
          isOpen={profileModal.isOpen}
          userId={gameAuth.user?.uid || ''}
          currentNickname={gameAuth.profile?.nickname || null}
          currentAvatarUrl={gameAuth.profile?.avatar_url || null}
          isUpdating={gameAuth.isUpdatingProfile}
          onClose={profileModal.close}
          onSave={gameAuth.saveProfile}
          onAvatarChange={gameAuth.handleAvatarChange}
        />

        {/* Submit Score Modal */}
        {submitModal.isOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-brand-gold p-8 rounded-[2rem] max-w-sm w-full text-center shadow-[0_0_80px_rgba(201,160,80,0.4)] animate-in zoom-in-95 duration-500">
              <Trophy className="w-16 h-16 text-brand-gold mx-auto mb-4 drop-shadow-[0_0_24px_rgba(201,160,80,0.8)] animate-pulse" />
              <h2 className="text-2xl font-black text-white mb-2 drop-shadow-[0_2px_12px_rgba(255,255,255,0.3)]">挑戰結束！</h2>
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20 shadow-inner">
                <div className="text-slate-400 text-xs uppercase font-bold">
                  {rankTabConfig.find(t => t.id === currentType)?.label} 最終得分
                </div>
                <div className="text-4xl font-black text-brand-gold drop-shadow-[0_4px_24px_rgba(201,160,80,0.6)]">{finalScore.toLocaleString()}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-bold">連勝次數: {finalStreak}</div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-slate-300 font-bold">恭喜 {gameAuth.profile?.nickname} 進榜！</div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { submitModal.close(); navigate('/game-menu'); }}
                    className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
                  >
                    跳過
                  </button>
                  <button
                    onClick={handleSubmitScore}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-br from-yellow-400 to-yellow-500 text-slate-900 py-4 rounded-xl font-black uppercase text-xs shadow-[0_4px_24px_rgba(250,204,21,0.4)] hover:shadow-[0_8px_32px_rgba(250,204,21,0.6)] hover:from-yellow-300 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "登錄排行"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="fixed bottom-4 right-4 md:bottom-8 md:left-8 md:right-auto z-50 flex items-center gap-3">
          {gameAuth.user && (
            <div className="flex items-center gap-2 md:gap-3 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-brand-gold/30 p-2 md:pr-6 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hover:shadow-[0_8px_48px_0_rgba(201,160,80,0.3)] animate-in slide-in-from-right-4 md:slide-in-from-left-4 transition-all duration-300">
              <div className="relative group cursor-pointer" onClick={profileModal.open}>
                <div className="w-10 h-10 md:w-10 md:h-10 rounded-full border-2 border-brand-gold overflow-hidden bg-slate-800 shadow-[0_0_16px_rgba(201,160,80,0.4)] group-hover:shadow-[0_0_24px_rgba(201,160,80,0.6)] transition-all duration-300 group-hover:scale-110">
                  {gameAuth.profile?.avatar_url ? (
                    <img src={gameAuth.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-2 text-slate-500" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300">
                  <Settings className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-[10px] text-brand-gold font-black uppercase tracking-tighter leading-none mb-1 drop-shadow-[0_0_8px_rgba(201,160,80,0.5)]">Ranked Dealer</div>
                <div className="text-xs font-bold text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{gameAuth.profile?.nickname || '設定暱稱...'}</div>
              </div>
              <button
                onClick={gameAuth.handleLogout}
                className="p-2 text-slate-500 hover:text-red-400 hover:scale-110 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                title="登出"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <footer className="mt-20 text-center text-slate-500 text-[10px] border-t border-white/5 pt-8 uppercase tracking-[0.2em] opacity-50">
          Leon-lab Training Utility • 2026
        </footer>
      </div>

      {/* In-App Browser Warning Modal */}
      <InAppBrowserWarningModal
        isOpen={gameAuth.inAppBrowserWarning.isOpen}
        onCopyUrl={gameAuth.copyUrlToClipboard}
        onProceed={gameAuth.proceedWithInAppLogin}
        onClose={gameAuth.inAppBrowserWarning.close}
      />
    </div>
  );
};
