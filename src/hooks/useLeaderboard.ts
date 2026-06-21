import { useState, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export type LeaderboardType =
  | 'SPLIT_POT'
  | 'SHOWDOWN_HOLDEM'
  | 'SHOWDOWN_OMAHA'
  | 'SHOWDOWN_BIGO'
  | 'QUIZ'
  | 'BLINDS'
  | 'BLINDS_PL';

export interface LeaderboardEntry {
  name: string;
  score: number;
  streak: number;
  type: LeaderboardType;
  user_id: string;
  avatar_url?: string;
  created_at: any;
}

export interface MinScores {
  SPLIT_POT: number;
  SHOWDOWN_HOLDEM: number;
  SHOWDOWN_OMAHA: number;
  SHOWDOWN_BIGO: number;
  QUIZ: number;
  BLINDS: number;
  BLINDS_PL: number;
}

/**
 * 排行榜數據管理 Hook
 * 處理數據獲取、緩存和最低分數計算
 */
export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [minHighScores, setMinHighScores] = useState<MinScores>({
    SPLIT_POT: 0,
    SHOWDOWN_HOLDEM: 0,
    SHOWDOWN_OMAHA: 0,
    SHOWDOWN_BIGO: 0,
    QUIZ: 0,
    BLINDS: 0,
    BLINDS_PL: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async (type: LeaderboardType) => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'leaderboard'),
        where('type', '==', type),
        orderBy('score', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const data: LeaderboardEntry[] = [];
      snapshot.docs.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as unknown as LeaderboardEntry);
      });
      
      setLeaderboard(data);

      // 計算最低進榜分數
      if (data.length === 10) {
        const minScore = data[data.length - 1].score;
        setMinHighScores(prev => ({
          ...prev,
          [type]: minScore
        }));
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLeaderboard = useCallback(() => {
    setLeaderboard([]);
  }, []);

  return {
    leaderboard,
    minHighScores,
    isLoading,
    fetchLeaderboard,
    clearLeaderboard
  };
}
