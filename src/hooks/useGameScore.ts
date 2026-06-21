import { useState, useCallback } from 'react';
import type { GameType, GameVariant } from '../contexts/GameContext';

interface UseGameScoreOptions {
  isChallengeActive: boolean;
  gameType: GameType | null;
  gameVariant: GameVariant;
  onChallengeAdvance: () => void;
}

export function useGameScore({
  isChallengeActive,
  gameType,
  gameVariant,
  onChallengeAdvance,
}: UseGameScoreOptions) {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());

  const resetStartTime = useCallback(() => {
    setStartTime(Date.now());
  }, []);

  const calculatePoints = useCallback((basePoints: number) => {
    const duration = (Date.now() - startTime) / 1000;
    const timeMultiplier = duration <= 10 ? 1.5 : duration <= 15 ? 1.25 : 1.0;
    const streakMultiplier = 1 + (streak * 0.2);
    const diffMap: Record<string, number> = { HOLDEM: 1, OMAHA: 1.5, BIGO: 2 };
    const points = Math.round(
      basePoints * (gameType === 'QUIZ' ? 1.2 : diffMap[gameVariant] ?? 1) * timeMultiplier * streakMultiplier
    );
    setLastPoints(points);
    setTotalScore(prev => prev + points);
    return points;
  }, [startTime, streak, gameType, gameVariant]);

  const updateStreak = useCallback((correct: boolean, basePoints: number = 0) => {
    if (correct) {
      if (basePoints > 0) calculatePoints(basePoints);
      setStreak(s => {
        const next = s + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      if (isChallengeActive) setTimeout(onChallengeAdvance, 800);
    } else {
      if (!isChallengeActive) setTotalScore(0);
      setStreak(0);
      setLastPoints(0);
    }
  }, [calculatePoints, bestStreak, isChallengeActive, onChallengeAdvance]);

  const getAnswerDuration = useCallback(() => {
    return (Date.now() - startTime) / 1000;
  }, [startTime]);

  const resetScore = useCallback(() => {
    setStreak(0);
    setBestStreak(0);
    setTotalScore(0);
    setLastPoints(0);
    setStartTime(Date.now());
  }, []);

  return {
    streak,
    bestStreak,
    totalScore,
    lastPoints,
    resetStartTime,
    updateStreak,
    resetScore,
    getAnswerDuration,
  };
}
