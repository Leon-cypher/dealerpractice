import { useState, useCallback } from 'react';
import type { Achievement } from '../utils/achievementData';

export interface AchievementNotification {
  id: number;
  achievement: Achievement;
}

let _nextNotifId = 0;

export function useAchievementToast() {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);

  const showAchievement = useCallback((achievement: Achievement) => {
    const id = ++_nextNotifId;
    setNotifications(prev => [...prev, { id, achievement }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const dismissAchievement = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, showAchievement, dismissAchievement };
}
