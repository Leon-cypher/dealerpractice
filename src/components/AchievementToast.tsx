import React, { useEffect } from 'react';
import type { AchievementNotification } from '../hooks/useAchievementToast';
import { cn } from '../utils/cn';

interface AchievementToastProps {
  notifications: AchievementNotification[];
  onDismiss: (id: number) => void;
}

export const AchievementToast = React.memo<AchievementToastProps>(({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 pointer-events-none">
      {notifications.map(({ id, achievement }) => (
        <ToastItem key={id} id={id} achievement={achievement} onDismiss={onDismiss} />
      ))}
    </div>
  );
});

AchievementToast.displayName = 'AchievementToast';

interface ToastItemProps {
  id: number;
  achievement: AchievementNotification['achievement'];
  onDismiss: (id: number) => void;
}

const ToastItem = React.memo<ToastItemProps>(({ id, achievement, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const Icon = achievement.icon;

  return (
    <div
      className={cn(
        'pointer-events-auto',
        'flex items-center gap-3 px-5 py-3 rounded-2xl',
        'bg-gradient-to-br from-slate-900 to-slate-800',
        'border-2 border-yellow-400/70',
        'shadow-[0_0_32px_rgba(250,204,21,0.3)]',
        'animate-in slide-in-from-top-4 duration-300',
        'min-w-[260px] max-w-xs',
      )}
    >
      <div className={cn(
        'p-2 rounded-xl bg-yellow-400/10 shrink-0',
      )}>
        <Icon className={cn('w-6 h-6', achievement.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">
          成就解鎖！
        </div>
        <div className="text-sm font-black text-white truncate">
          {achievement.name}
        </div>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-slate-500 hover:text-white transition-colors shrink-0 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
});

ToastItem.displayName = 'ToastItem';
