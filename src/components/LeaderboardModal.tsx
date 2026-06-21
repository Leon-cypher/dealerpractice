import React, { memo, useCallback } from 'react';
import { Medal, XCircle, Loader2, User as UserIcon } from 'lucide-react';
import { LeaderboardEntry, LeaderboardType } from '../hooks/useLeaderboard';
import { cn } from '../utils/cn';

interface RankTab {
  id: LeaderboardType;
  label: string;
  icon: any;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  activeTab: LeaderboardType;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  rankTabs: RankTab[];
  onClose: () => void;
  onTabChange: (tab: LeaderboardType) => void;
}

export const LeaderboardModal = memo<LeaderboardModalProps>(({
  isOpen,
  activeTab,
  leaderboard,
  isLoading,
  rankTabs,
  onClose,
  onTabChange
}) => {
  const handleTabChange = useCallback((tabId: LeaderboardType) => {
    onTabChange(tabId);
  }, [onTabChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-brand-gold/30 p-6 md:p-8 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* 頂部裝飾線 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"></div>

        {/* 標題 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-brand-gold flex items-center gap-3 tracking-widest">
            <Medal className="w-8 h-8" /> 全球荷官排行榜
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* 分類標籤 */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide border border-white/5">
          {rankTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-lg font-bold text-[10px] md:text-xs transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-yellow-400 text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <tab.icon className="w-3 h-3" /> {tab.label}
            </button>
          ))}
        </div>

        {/* 排行榜內容 */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <div className="font-bold uppercase tracking-widest text-xs">
                讀取排行中...
              </div>
            </div>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/10 group"
              >
                <div className="flex items-center gap-4">
                  {/* 排名 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all",
                      index === 0
                        ? "bg-yellow-400 text-slate-900 scale-110 shadow-lg"
                        : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* 頭像 */}
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-full h-full p-2 text-slate-600" />
                    )}
                  </div>

                  {/* 名稱和日期 */}
                  <div>
                    <div className="font-bold text-white group-hover:text-brand-gold transition-colors">
                      {entry.name}
                    </div>
                    <div className="text-[8px] text-slate-500">
                      {entry.created_at?.seconds
                        ? new Date(entry.created_at.seconds * 1000).toLocaleDateString()
                        : '---'}
                    </div>
                  </div>
                </div>

                {/* 分數和連勝 */}
                <div className="text-right">
                  <div className="text-lg font-black text-white group-hover:scale-105 transition-all">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-brand-gold font-bold uppercase tracking-tighter">
                    STREAK: {entry.streak}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-3xl">
              該類別尚無紀錄
            </div>
          )}
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="mt-8 w-full py-4 bg-white/5 text-slate-400 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all border border-white/10 active:scale-[0.98]"
        >
          關閉視窗
        </button>
      </div>
    </div>
  );
});

LeaderboardModal.displayName = 'LeaderboardModal';
