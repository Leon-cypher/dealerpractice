import { createContext, useContext, useState, ReactNode } from 'react';

export type GameType = 'SPLIT_POT' | 'SHOWDOWN' | 'QUIZ' | 'BLINDS' | 'BLINDS_PL';
export type GameVariant = 'HOLDEM' | 'OMAHA' | 'BIGO';
export type GameMode = 'PRACTICE' | 'CHALLENGE';

interface GameContextType {
  // 當前選擇
  gameType: GameType | null;
  gameVariant: GameVariant;
  gameMode: GameMode;
  
  // 遊戲狀態
  isPlaying: boolean;
  
  // 方法
  setGameType: (type: GameType | null) => void;
  setGameVariant: (variant: GameVariant) => void;
  setGameMode: (mode: GameMode) => void;
  setIsPlaying: (playing: boolean) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [gameVariant, setGameVariant] = useState<GameVariant>('HOLDEM');
  const [gameMode, setGameMode] = useState<GameMode>('PRACTICE');
  const [isPlaying, setIsPlaying] = useState(false);

  const resetGame = () => {
    setGameType(null);
    setGameVariant('HOLDEM');
    setGameMode('PRACTICE');
    setIsPlaying(false);
  };

  return (
    <GameContext.Provider
      value={{
        gameType,
        gameVariant,
        gameMode,
        isPlaying,
        setGameType,
        setGameVariant,
        setGameMode,
        setIsPlaying,
        resetGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
