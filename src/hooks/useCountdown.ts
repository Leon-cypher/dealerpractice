import { useState, useEffect, useCallback } from 'react';

interface UseCountdownOptions {
  initialTime: number; // 初始秒數
  onComplete?: () => void; // 倒數完成回調
  autoStart?: boolean; // 自動開始
}

/**
 * 倒數計時器 Hook
 * 用於挑戰模式的 300 秒倒數
 */
export function useCountdown({
  initialTime,
  onComplete,
  autoStart = false
}: UseCountdownOptions) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(autoStart);

  const start = useCallback(() => {
    setTimeLeft(initialTime);
    setIsActive(true);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsActive(false);
  }, [initialTime]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  return {
    timeLeft,
    isActive,
    start,
    stop,
    reset
  };
}
