import { memo } from 'react';
import { Coins, Flame } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChallengeTimerProps {
  isChallengeActive: boolean;
  timeLeft: number;
  totalScore: number;
  lastPoints: number;
  streak: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 挑戰模式計時器與積分顯示組件
 * 使用 React.memo 避免父組件重渲染時不必要的更新
 */
export const ChallengeTimer = memo(function ChallengeTimer({
  isChallengeActive,
  timeLeft,
  totalScore,
  lastPoints,
  streak
}: ChallengeTimerProps) {
  return (
    <div className="flex items-stretch justify-center gap-2 md:gap-4 text-white/90 bg-slate-800/80 backdrop-blur-lg px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-2xl border border-white/10">
      {isChallengeActive && (
        <div className="flex flex-col items-center border-r border-white/20 pr-3 md:pr-4">
          <span className="text-[9px] md:text-[10px] text-red-400 font-bold uppercase animate-pulse">
            Time Left
          </span>
          <div className="text-xl md:text-2xl font-black font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center border-r border-white/20 px-3 md:px-4 relative">
        <span className="text-[9px] md:text-[10px] text-brand-gold font-bold uppercase tracking-widest">
          Points
        </span>
        <div className="flex items-center gap-1 text-brand-gold">
          <Coins className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-xl md:text-2xl font-black">
            {totalScore.toLocaleString()}
          </span>
        </div>
        {lastPoints > 0 && (
          <div className="text-[9px] md:text-[10px] text-green-400 font-bold animate-bounce absolute -top-4">
            +{lastPoints}
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center px-3 md:px-4">
        <span className="text-[9px] md:text-[10px] text-brand-gold font-bold uppercase tracking-widest">
          Streak
        </span>
        <div className="flex items-center gap-1">
          <Flame 
            className={cn(
              "w-4 h-4 md:w-5 md:h-5",
              streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600"
            )} 
          />
          <span className="text-xl md:text-2xl font-black">{streak}</span>
        </div>
      </div>
    </div>
  );
});
