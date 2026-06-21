import { useState, useCallback } from 'react';
import * as PokerLogic from '../utils/pokerLogic';

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

export interface ShowdownScenario {
  variant: PokerLogic.GameVariant;
  communityCards: PokerLogic.Card[];
  players: ShowdownPlayer[];
}

export function useShowdownGame(gameVariant: PokerLogic.GameVariant) {
  const [showdown, setShowdown] = useState<ShowdownScenario | null>(null);
  const [userHighWinnerIds, setUserHighWinnerIds] = useState<number[]>([]);
  const [userLowWinnerIds, setUserLowWinnerIds] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const init = useCallback(() => {
    const scenario = PokerLogic.generateShowdownScenario(
      Math.random() > 0.5 ? 2 : 3,
      gameVariant
    ) as ShowdownScenario;
    setShowdown(scenario);
    setUserHighWinnerIds([]);
    setUserLowWinnerIds([]);
    setShowResult(false);
  }, [gameVariant]);

  const handleToggleHighWinner = useCallback((playerId: number) => {
    setUserHighWinnerIds(prev =>
      prev.includes(playerId) ? prev.filter(x => x !== playerId) : [...prev, playerId]
    );
  }, []);

  const handleToggleLowWinner = useCallback((playerId: number) => {
    setUserLowWinnerIds(prev =>
      prev.includes(playerId) ? prev.filter(x => x !== playerId) : [...prev, playerId]
    );
  }, []);

  // Sets showResult=true and returns whether the answer is correct
  const checkResult = useCallback((): boolean => {
    if (!showdown) return false;
    setShowResult(true);
    const isHiLo = gameVariant === 'BIGO';
    const actualHighWinners = showdown.players.filter(p => p.isHighWinner).map(p => p.id);
    const actualLowWinners = showdown.players.filter(p => p.isLowWinner).map(p => p.id);
    return (
      userHighWinnerIds.length === actualHighWinners.length &&
      userHighWinnerIds.every(id => actualHighWinners.includes(id)) &&
      (!isHiLo || (
        userLowWinnerIds.length === actualLowWinners.length &&
        userLowWinnerIds.every(id => actualLowWinners.includes(id))
      ))
    );
  }, [showdown, gameVariant, userHighWinnerIds, userLowWinnerIds]);

  return {
    showdown,
    userHighWinnerIds,
    userLowWinnerIds,
    showResult,
    init,
    handleToggleHighWinner,
    handleToggleLowWinner,
    checkResult,
  };
}
