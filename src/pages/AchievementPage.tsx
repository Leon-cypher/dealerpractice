import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAchievements } from '../hooks/useAchievements';
import {
  ACHIEVEMENTS,
  CATEGORY_ORDER,
  CATEGORY_META,
  type AchievementCategory,
} from '../utils/achievementData';
import { cn } from '../utils/cn';

export function AchievementPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { unlockedIds, loading } = useAchievements(user?.uid, () => {});
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  const filteredAchievements = activeCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === activeCategory);

  const total = ACHIEVEMENTS.length;
  const unlocked = unlockedIds.size;
  const progressPct = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首頁</span>
        </button>

        <h1 className="text-3xl md:text-5xl font-black text-yellow-400 mb-6">成就系統</h1>

        {/* Profile card */}
        {user ? (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-14 h-14 rounded-full border-2 border-yellow-400/60 overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-yellow-400">
                  {(profile?.nickname || user.displayName || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-white text-lg truncate">
                {profile?.nickname || user.displayName || '匿名玩家'}
              </div>
              <div className="text-sm text-slate-400 mb-2">
                已解鎖 <span className="text-yellow-400 font-black">{loading ? '…' : unlocked}</span> / {total} 個成就
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 mb-6 text-slate-400 text-sm">
            請登入以解鎖成就
          </div>
        )}

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-bold transition-all',
              activeCategory === 'all'
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                : 'bg-slate-800/50 text-slate-400 border border-white/10 hover:text-white',
            )}
          >
            全部
          </button>
          {CATEGORY_ORDER.map(cat => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-bold transition-all',
                  activeCategory === cat
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'bg-slate-800/50 text-slate-400 border border-white/10 hover:text-white',
                )}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={cn(
                  'bg-slate-800/50 border rounded-2xl p-4 transition-all duration-300',
                  isUnlocked
                    ? cn('border-yellow-400/60 bg-gradient-to-br', achievement.bgColor)
                    : 'border-white/10 opacity-60',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2.5 rounded-xl shrink-0',
                    isUnlocked ? 'bg-white/10' : 'bg-slate-700/50',
                  )}>
                    {isUnlocked ? (
                      <Icon className={cn('w-6 h-6', achievement.iconColor)} />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'font-black text-sm',
                        isUnlocked ? 'text-white' : 'text-slate-400',
                      )}>
                        {achievement.name}
                      </span>
                      {isUnlocked && (
                        <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                          已解鎖
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      {achievement.description}
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-500 font-medium">
                      {achievement.categoryEmoji} {achievement.categoryLabel}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

