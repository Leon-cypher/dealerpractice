import React, { memo, useCallback } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import * as deck from '@letele/playing-cards';
import * as PokerLogic from '../utils/pokerLogic';
import { cn } from '../utils/cn';

interface PokerCardProps {
  card: PokerLogic.Card;
  hidden?: boolean;
  className?: string;
  style?: React.CSSProperties;
  mini?: boolean;
}

const suitMap: Record<string, string> = {
  hearts: 'H', diamonds: 'D', clubs: 'C', spades: 'S'
};
const rankMap: Record<string, string> = {
  'A': 'a', 'J': 'j', 'Q': 'q', 'K': 'k',
  '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
};

const PokerCard = memo<PokerCardProps>(({ card, hidden, className, style, mini }) => {
  // Unified size — mini only used as hint, both sizes are now meaningful
  const sizeClass = mini
    ? 'w-[70px] h-[98px] sm:w-[82px] sm:h-[115px] md:w-[92px] md:h-[129px]'
    : 'w-[80px] h-[112px] sm:w-[96px] sm:h-[134px] md:w-[108px] md:h-[151px]';

  const containerClass = cn(
    'relative inline-block overflow-hidden select-none flex-shrink-0',
    'shadow-[0_2px_8px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
    'rounded-[6%]',
    !mini && 'hover:-translate-y-2 transition-transform duration-200',
    sizeClass,
    className
  );

  if (hidden) {
    const Back = (deck as any)['B1'];
    return (
      <div style={style} className={containerClass}>
        <Back style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  const key = `${suitMap[card.suit]}${rankMap[card.rank]}`;
  const CardSvg = (deck as any)[key];

  if (!CardSvg) {
    return (
      <div style={style} className={cn(containerClass, 'bg-white border border-gray-200 flex items-center justify-center text-red-500 text-xs font-bold')}>
        ?
      </div>
    );
  }

  return (
    <div style={style} className={containerClass}>
      <CardSvg style={{ width: '100%', height: '100%' }} />
    </div>
  );
});

PokerCard.displayName = 'PokerCard';

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

interface ShowdownGameProps {
  variant: PokerLogic.GameVariant;
  communityCards: PokerLogic.Card[];
  players: ShowdownPlayer[];
  userHighWinnerIds: number[];
  userLowWinnerIds: number[];
  showResult: boolean;
  onToggleHighWinner: (playerId: number) => void;
  onToggleLowWinner: (playerId: number) => void;
  onCheckResult: () => void;
  onReset: () => void;
}

export const ShowdownGame = memo<ShowdownGameProps>(({
  variant,
  communityCards,
  players,
  userHighWinnerIds,
  userLowWinnerIds,
  showResult,
  onToggleHighWinner,
  onToggleLowWinner,
  onCheckResult,
  onReset
}) => {
  const isHiLo = variant === 'BIGO';
  
  const actualHighWinners = players.filter(p => p.isHighWinner).map(p => p.id);
  const actualLowWinners = players.filter(p => p.isLowWinner).map(p => p.id);
  
  const isCorrect = 
    userHighWinnerIds.length === actualHighWinners.length &&
    userHighWinnerIds.every(id => actualHighWinners.includes(id)) &&
    (!isHiLo || (
      userLowWinnerIds.length === actualLowWinners.length &&
      userLowWinnerIds.every(id => actualLowWinners.includes(id))
    ));

  const handleToggleHighWinner = useCallback((playerId: number) => () => {
    if (!showResult) {
      onToggleHighWinner(playerId);
    }
  }, [showResult, onToggleHighWinner]);

  const handleToggleLowWinner = useCallback((playerId: number) => () => {
    if (!showResult) {
      onToggleLowWinner(playerId);
    }
  }, [showResult, onToggleLowWinner]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      {/* 公共牌區域 - 撲克桌面質感 */}
      <div className="felt-table p-5 md:p-8 rounded-[2rem] shadow-2xl relative">
        {/* Table inner border */}
        <div className="absolute inset-3 border border-brand-gold/20 rounded-[1.5rem] pointer-events-none" />
        
        {/* Table label */}
        <div className="text-center mb-5">
          <span className="text-brand-gold/60 text-xs font-bold uppercase tracking-[0.2em]">— Community Cards —</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8">
          {communityCards.map((card, i) => (
            <PokerCard key={i} card={card} />
          ))}
        </div>

        {/* 玩家手牌 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {players.map(p => (
            <div
              key={p.id}
              className={cn(
                "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 bg-black/20 backdrop-blur-sm",
                (userHighWinnerIds.includes(p.id) || userLowWinnerIds.includes(p.id))
                  ? "border-brand-gold shadow-lg shadow-brand-gold/20 bg-brand-gold/5"
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <div className="font-bold text-white text-sm">{p.name}</div>
              
              {/* 手牌 */}
              <div className="flex gap-2 flex-wrap justify-center">
                {p.cards.map((card, i) => (
                  <PokerCard key={i} card={card} mini />
                ))}
              </div>

              {/* 勝負選擇按鈕 */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleToggleHighWinner(p.id)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200",
                    userHighWinnerIds.includes(p.id)
                      ? "bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-900 shadow-lg shadow-yellow-500/30 scale-105"
                      : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  )}
                >
                  {isHiLo ? "高牌贏家" : "贏家"}
                </button>
                {isHiLo && (
                  <button
                    onClick={handleToggleLowWinner(p.id)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200",
                      userLowWinnerIds.includes(p.id)
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                    )}
                  >
                    低牌贏家
                  </button>
                )}
              </div>

              {/* 顯示結果 */}
              {showResult && (
                <div className="mt-1 w-full space-y-1.5 text-center animate-in slide-in-from-top-2">
                  <div className={cn(
                    "text-[10px] font-bold p-2 rounded-lg border transition-all",
                    p.isHighWinner
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-slate-800/50 text-slate-500 border-slate-700"
                  )}>
                    {p.handDescription}
                  </div>
                  {isHiLo && (
                    <div className={cn(
                      "text-[10px] font-bold p-2 rounded-lg border transition-all",
                      p.isLowWinner
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                        : "bg-slate-800/50 text-slate-500 border-slate-700"
                    )}>
                      {p.lowDescription}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 確認按鈕 */}
      <div className="max-w-md mx-auto space-y-4">
        {!showResult ? (
          <button
            disabled={userHighWinnerIds.length === 0}
            onClick={onCheckResult}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-900 font-black py-4 rounded-2xl uppercase tracking-wider shadow-xl hover:from-yellow-300 hover:to-amber-300 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-yellow-400/30 hover:shadow-2xl"
          >
            確認分配結果
          </button>
        ) : (
          <div className="space-y-3">
            <div className={cn(
              "p-4 rounded-2xl font-black text-center border-2 text-lg animate-in zoom-in",
              isCorrect
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                : "bg-red-500/20 text-red-400 border-red-500/50"
            )}>
              {isCorrect ? "✓ 判斷正確！" : "✗ 判斷錯誤。"}
            </div>
            <button
              onClick={onReset}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl shadow-lg transition-all border border-white/20 hover:border-white/40 hover:scale-[1.02]"
            >
              下一題練習 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ShowdownGame.displayName = 'ShowdownGame';
