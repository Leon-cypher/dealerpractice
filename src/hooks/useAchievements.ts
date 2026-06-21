import { useRef, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { ACHIEVEMENT_MAP } from '../utils/achievementData';
import type { Achievement } from '../utils/achievementData';

export function useAchievements(
  userId: string | undefined,
  onNewAchievement: (achievement: Achievement) => void
) {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const unlockedIdsRef = useRef<Set<string>>(new Set());
  const speedHistoryRef = useRef<number[]>([]);
  const onNewAchievementRef = useRef(onNewAchievement);

  useEffect(() => {
    onNewAchievementRef.current = onNewAchievement;
  });

  // Fetch unlocked achievements from Firestore when userId changes
  useEffect(() => {
    if (!userId) {
      unlockedIdsRef.current = new Set();
      setUnlockedIds(new Set());
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'userAchievements', userId))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() as { unlocked?: Record<string, unknown> };
          const ids = new Set<string>(Object.keys(data.unlocked || {}));
          unlockedIdsRef.current = ids;
          setUnlockedIds(new Set(ids));
        }
      })
      .catch(() => { /* silently ignore */ })
      .finally(() => setLoading(false));
  }, [userId]);

  const unlockAchievement = useCallback(async (id: string) => {
    if (!userId) return;
    if (unlockedIdsRef.current.has(id)) return;
    const achievement = ACHIEVEMENT_MAP[id];
    if (!achievement) return;

    // Optimistic update
    unlockedIdsRef.current = new Set([...unlockedIdsRef.current, id]);
    setUnlockedIds(new Set(unlockedIdsRef.current));

    // Notify
    onNewAchievementRef.current(achievement);

    // Write to Firestore
    try {
      await setDoc(
        doc(db, 'userAchievements', userId),
        { unlocked: { [id]: serverTimestamp() } },
        { merge: true }
      );
    } catch {
      /* silently ignore */
    }
  }, [userId]);

  const checkAnswer = useCallback(async (params: {
    correct: boolean;
    durationSeconds: number;
    streak: number;
  }) => {
    const { correct, durationSeconds, streak } = params;

    if (!correct) {
      speedHistoryRef.current = [];
      return;
    }

    // speed_2s
    if (durationSeconds <= 2) {
      await unlockAchievement('speed_2s');
    }

    // Update speed history (keep last 5)
    speedHistoryRef.current = [...speedHistoryRef.current, durationSeconds].slice(-5);

    // speed_5x5s - all 5 in history must be <=5s
    if (speedHistoryRef.current.length === 5 && speedHistoryRef.current.every(d => d <= 5)) {
      await unlockAchievement('speed_5x5s');
    }

    // streak achievements
    if (streak >= 5) await unlockAchievement('streak_5');
    if (streak >= 10) await unlockAchievement('streak_10');
    if (streak >= 20) await unlockAchievement('streak_20');
  }, [unlockAchievement]);

  const recordGameEnd = useCallback(async (params: {
    gameType: string;
    gameVariant: string;
    gameMode: string;
    finalScore: number;
    finalStreak: number;
  }) => {
    if (!userId) return;
    const { gameType, gameVariant, gameMode, finalScore, finalStreak } = params;
    const isChallenge = gameMode === 'CHALLENGE';

    const statsRef = doc(db, 'userStats', userId);

    try {
      // Build update object
      const updateData: Record<string, unknown> = {
        totalGamesPlayed: increment(1),
        gameTypesPlayed: arrayUnion(gameType),
        variantsPlayed: arrayUnion(gameVariant),
        updatedAt: serverTimestamp(),
      };

      if (isChallenge) {
        updateData.challengesCompleted = increment(1);
        updateData.totalChallengeScore = increment(finalScore);
      }

      await setDoc(statsRef, updateData, { merge: true });

      // Update maxStreak separately to handle comparison
      const statsSnap = await getDoc(statsRef);
      const statsData = statsSnap.data() || {};
      const currentMaxStreak = (statsData.maxStreak as number) || 0;
      if (finalStreak > currentMaxStreak) {
        await setDoc(statsRef, { maxStreak: finalStreak }, { merge: true });
      }

      // Fetch updated stats and check achievements
      const updatedSnap = await getDoc(statsRef);
      const stats = updatedSnap.data() || {};

      const totalGames = (stats.totalGamesPlayed as number) || 0;
      const totalChallengeScore = (stats.totalChallengeScore as number) || 0;
      const challengesCompleted = (stats.challengesCompleted as number) || 0;
      const maxStreak = (stats.maxStreak as number) || 0;
      const gameTypesPlayed = (stats.gameTypesPlayed as string[]) || [];
      const variantsPlayed = (stats.variantsPlayed as string[]) || [];

      // first_game
      if (totalGames >= 1) await unlockAchievement('first_game');

      // all_game_types: SPLIT_POT, SHOWDOWN, QUIZ, BLINDS (4 types)
      const allTypes = ['SPLIT_POT', 'SHOWDOWN', 'QUIZ', 'BLINDS'];
      if (allTypes.every(t => gameTypesPlayed.includes(t))) {
        await unlockAchievement('all_game_types');
      }

      // play_omaha
      if (variantsPlayed.includes('OMAHA')) await unlockAchievement('play_omaha');

      // play_bigo
      if (variantsPlayed.includes('BIGO')) await unlockAchievement('play_bigo');

      // score achievements (cumulative challenge score)
      if (totalChallengeScore >= 5000) await unlockAchievement('score_5k');
      if (totalChallengeScore >= 50000) await unlockAchievement('score_50k');
      if (totalChallengeScore >= 100000) await unlockAchievement('score_100k');

      // games_100
      if (totalGames >= 100) await unlockAchievement('games_100');

      // challenges_10
      if (challengesCompleted >= 10) await unlockAchievement('challenges_10');

      // streak from maxStreak
      if (maxStreak >= 5) await unlockAchievement('streak_5');
      if (maxStreak >= 10) await unlockAchievement('streak_10');
      if (maxStreak >= 20) await unlockAchievement('streak_20');
    } catch {
      /* silently ignore */
    }
  }, [userId, unlockAchievement]);

  const recordExamResult = useCallback(async (params: { score: number }) => {
    if (!userId) return;
    const { score } = params;
    if (score >= 90) await unlockAchievement('exam_pass');
    if (score === 100) await unlockAchievement('exam_perfect');
  }, [userId, unlockAchievement]);

  return {
    unlockedIds,
    loading,
    checkAnswer,
    recordGameEnd,
    recordExamResult,
  };
}
