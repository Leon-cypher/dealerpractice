import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Medal, User as UserIcon, Loader2, Calculator, Eye, BookOpen, BarChart3 } from 'lucide-react';
import { useLeaderboard, LeaderboardType } from '../hooks/useLeaderboard';
import { cn } from '../utils/cn';

const RANK_TABS: { id: LeaderboardType; label: string; icon: React.ElementType }[] = [
  { id: 'SPLIT_POT',       label: '底池計算',   icon: Calculator },
  { id: 'SHOWDOWN_HOLDEM', label: '德州判斷',   icon: Eye },
  { id: 'SHOWDOWN_OMAHA',  label: '奧馬哈判斷', icon: Eye },
  { id: 'SHOWDOWN_BIGO',   label: 'BIGO 判斷',  icon: Eye },
  { id: 'QUIZ',            label: '理論知識',   icon: BookOpen },
  { id: 'BLINDS',          label: 'NL 加注',    icon: BarChart3 },
  { id: 'BLINDS_PL',       label: 'PL 加注',    icon: BarChart3 },
];

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { leaderboard, isLoading, fetchLeaderboard } = useLeaderboard();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('SPLIT_POT');

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-brand-gold flex items-center gap-3 tracking-widest">
            <Medal className="w-8 h-8" /> 全球荷官排行榜
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap border border-white/5 gap-1">
          {RANK_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 rounded-lg font-bold text-[10px] md:text-xs transition-all flex items-center gap-2 shrink-0',
                  activeTab === tab.id
                    ? 'bg-yellow-400 text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                <Icon className="w-3 h-3" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <div className="font-bold uppercase tracking-widest text-xs">讀取排行中...</div>
            </div>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-black',
                    index === 0 ? 'bg-yellow-400 text-slate-900 scale-110 shadow-lg' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  )}>
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800">
                    {entry.avatar_url
                      ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <UserIcon className="w-full h-full p-2 text-slate-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-brand-gold transition-colors">{entry.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {entry.created_at?.seconds
                        ? new Date(entry.created_at.seconds * 1000).toLocaleDateString()
                        : '---'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">{entry.score.toLocaleString()}</div>
                  <div className="text-[10px] text-brand-gold font-bold uppercase tracking-tighter">STREAK: {entry.streak}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-3xl">
              該類別尚無紀錄
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
