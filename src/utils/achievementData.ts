import type { IconType } from 'react-icons';
import {
  FaCompass, FaGlobe, FaMapMarkedAlt, FaDice,
  FaBolt, FaFire, FaCrown,
  FaTrophy, FaMedal, FaStar,
  FaStopwatch, FaRocket,
  FaShieldAlt, FaChessKing,
  FaGraduationCap, FaAward,
} from 'react-icons/fa';

export type AchievementCategory = 'explore' | 'streak' | 'score' | 'speed' | 'accumulate' | 'exam';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  iconColor: string;
  bgColor: string;
  category: AchievementCategory;
  categoryLabel: string;
  categoryEmoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    name: '新手荷官',
    description: '完成任何一局遊戲',
    icon: FaCompass,
    iconColor: 'text-blue-400',
    bgColor: 'from-blue-900/60 to-blue-800/40',
    category: 'explore',
    categoryLabel: '探索',
    categoryEmoji: '🏅',
  },
  {
    id: 'all_game_types',
    name: '全能荷官',
    description: '玩過全部4種遊戲類型',
    icon: FaGlobe,
    iconColor: 'text-cyan-400',
    bgColor: 'from-cyan-900/60 to-cyan-800/40',
    category: 'explore',
    categoryLabel: '探索',
    categoryEmoji: '🏅',
  },
  {
    id: 'play_omaha',
    name: 'Omaha 玩家',
    description: '第一次玩 Omaha variant',
    icon: FaMapMarkedAlt,
    iconColor: 'text-purple-400',
    bgColor: 'from-purple-900/60 to-purple-800/40',
    category: 'explore',
    categoryLabel: '探索',
    categoryEmoji: '🏅',
  },
  {
    id: 'play_bigo',
    name: 'BIGO 挑戰者',
    description: '第一次玩 BIGO variant',
    icon: FaDice,
    iconColor: 'text-pink-400',
    bgColor: 'from-pink-900/60 to-pink-800/40',
    category: 'explore',
    categoryLabel: '探索',
    categoryEmoji: '🏅',
  },
  {
    id: 'streak_5',
    name: '連勝王',
    description: '單局連對 5 題',
    icon: FaBolt,
    iconColor: 'text-yellow-400',
    bgColor: 'from-yellow-900/60 to-yellow-800/40',
    category: 'streak',
    categoryLabel: '連勝',
    categoryEmoji: '⚡',
  },
  {
    id: 'streak_10',
    name: '不可阻擋',
    description: '單局連對 10 題',
    icon: FaFire,
    iconColor: 'text-orange-400',
    bgColor: 'from-orange-900/60 to-orange-800/40',
    category: 'streak',
    categoryLabel: '連勝',
    categoryEmoji: '⚡',
  },
  {
    id: 'streak_20',
    name: '神之荷官',
    description: '單局連對 20 題',
    icon: FaCrown,
    iconColor: 'text-amber-400',
    bgColor: 'from-amber-900/60 to-amber-800/40',
    category: 'streak',
    categoryLabel: '連勝',
    categoryEmoji: '⚡',
  },
  {
    id: 'score_5k',
    name: '初出茅廬',
    description: 'Challenge 累積得分 5,000',
    icon: FaTrophy,
    iconColor: 'text-green-400',
    bgColor: 'from-green-900/60 to-green-800/40',
    category: 'score',
    categoryLabel: '分數',
    categoryEmoji: '🏆',
  },
  {
    id: 'score_50k',
    name: '職業水準',
    description: 'Challenge 累積得分 50,000',
    icon: FaMedal,
    iconColor: 'text-yellow-500',
    bgColor: 'from-yellow-900/60 to-yellow-800/40',
    category: 'score',
    categoryLabel: '分數',
    categoryEmoji: '🏆',
  },
  {
    id: 'score_100k',
    name: '傳奇荷官',
    description: 'Challenge 累積得分 100,000',
    icon: FaStar,
    iconColor: 'text-yellow-300',
    bgColor: 'from-yellow-900/60 to-yellow-800/40',
    category: 'score',
    categoryLabel: '分數',
    categoryEmoji: '🏆',
  },
  {
    id: 'speed_2s',
    name: '閃電手',
    description: '單題在 2 秒內答對',
    icon: FaStopwatch,
    iconColor: 'text-cyan-300',
    bgColor: 'from-cyan-900/60 to-cyan-800/40',
    category: 'speed',
    categoryLabel: '速度',
    categoryEmoji: '⏱️',
  },
  {
    id: 'speed_5x5s',
    name: '速度狂魔',
    description: '連續 5 題都在 5 秒內答對',
    icon: FaRocket,
    iconColor: 'text-rose-400',
    bgColor: 'from-rose-900/60 to-rose-800/40',
    category: 'speed',
    categoryLabel: '速度',
    categoryEmoji: '⏱️',
  },
  {
    id: 'games_100',
    name: '百戰老將',
    description: '累計完成 100 局遊戲',
    icon: FaShieldAlt,
    iconColor: 'text-slate-300',
    bgColor: 'from-slate-700/60 to-slate-600/40',
    category: 'accumulate',
    categoryLabel: '累積',
    categoryEmoji: '📊',
  },
  {
    id: 'challenges_10',
    name: '挑戰狂',
    description: '完成 10 場 Challenge mode',
    icon: FaChessKing,
    iconColor: 'text-indigo-400',
    bgColor: 'from-indigo-900/60 to-indigo-800/40',
    category: 'accumulate',
    categoryLabel: '累積',
    categoryEmoji: '📊',
  },
  {
    id: 'exam_pass',
    name: '合格荷官',
    description: '考試達 90 分',
    icon: FaGraduationCap,
    iconColor: 'text-emerald-400',
    bgColor: 'from-emerald-900/60 to-emerald-800/40',
    category: 'exam',
    categoryLabel: '考試',
    categoryEmoji: '📝',
  },
  {
    id: 'exam_perfect',
    name: '完美答卷',
    description: '考試 100 分滿分',
    icon: FaAward,
    iconColor: 'text-yellow-400',
    bgColor: 'from-yellow-900/60 to-yellow-800/40',
    category: 'exam',
    categoryLabel: '考試',
    categoryEmoji: '📝',
  },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, a])
);

export const CATEGORY_ORDER: AchievementCategory[] = [
  'explore', 'streak', 'score', 'speed', 'accumulate', 'exam',
];

export const CATEGORY_META: Record<AchievementCategory, { label: string; emoji: string }> = {
  explore: { label: '探索', emoji: '🏅' },
  streak: { label: '連勝', emoji: '⚡' },
  score: { label: '分數', emoji: '🏆' },
  speed: { label: '速度', emoji: '⏱️' },
  accumulate: { label: '累積', emoji: '📊' },
  exam: { label: '考試', emoji: '📝' },
};
