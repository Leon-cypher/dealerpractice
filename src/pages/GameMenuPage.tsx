import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, BarChart3, Dumbbell, Flame, Sparkles, ChevronRight } from 'lucide-react';
import { GiCoinsPile, GiCardAceSpades } from 'react-icons/gi';
import { useGame } from '../contexts/GameContext';
import type { GameType, GameVariant, GameMode } from '../contexts/GameContext';

export function GameMenuPage() {
  const navigate = useNavigate();
  const { setGameType, setGameVariant, setGameMode } = useGame();
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('HOLDEM');
  const [selectedBlindsVariant, setSelectedBlindsVariant] = useState<'NL' | 'PL'>('NL');

  const games = [
    {
      type: 'SPLIT_POT' as const,
      title: '底池分配',
      subtitle: 'Pot Distribution',
      icon: GiCoinsPile,
      isReactIcon: true,
      description: '練習各種底池分配情況',
      gradient: 'from-emerald-400 to-teal-500',
      glow: 'rgba(52,211,153,0.2)',
      borderActive: 'border-emerald-500/40',
      suit: '♣',
      suitColor: 'rgba(52,211,153,0.06)',
      available: true
    },
    {
      type: 'SHOWDOWN' as const,
      title: '勝負判斷',
      subtitle: 'Showdown',
      icon: GiCardAceSpades,
      isReactIcon: true,
      description: '判斷牌型大小與勝負',
      gradient: 'from-rose-400 to-red-500',
      glow: 'rgba(251,113,133,0.2)',
      borderActive: 'border-rose-500/40',
      suit: '♠',
      suitColor: 'rgba(251,113,133,0.06)',
      available: true,
      hasVariants: true
    },
    {
      type: 'QUIZ' as const,
      title: '理論知識',
      subtitle: 'Rules Quiz',
      icon: GraduationCap,
      isReactIcon: false,
      description: '110 題荷官規則與發牌程序',
      gradient: 'from-violet-400 to-purple-500',
      glow: 'rgba(167,139,250,0.2)',
      borderActive: 'border-violet-500/40',
      suit: '♦',
      suitColor: 'rgba(167,139,250,0.06)',
      available: true
    },
    {
      type: 'BLINDS' as const,
      title: '級距計算',
      subtitle: 'Blind Levels',
      icon: BarChart3,
      isReactIcon: false,
      description: '練習 NL 最小加注與 PL 最大加注計算',
      gradient: 'from-amber-400 to-orange-500',
      glow: 'rgba(251,191,36,0.2)',
      borderActive: 'border-amber-500/40',
      suit: '♥',
      suitColor: 'rgba(251,191,36,0.06)',
      available: true,
      hasBlindsVariants: true
    }
  ];

  const variants: { id: GameVariant; name: string; desc: string }[] = [
    { id: 'HOLDEM', name: '德州撲克', desc: "Hold'em" },
    { id: 'OMAHA', name: '奧馬哈', desc: 'Omaha' },
    { id: 'BIGO', name: 'BIGO', desc: 'Big-O' }
  ];

  const handleGameSelect = (gameType: GameType, mode: GameMode) => {
    const resolvedType: GameType =
      gameType === 'BLINDS' && selectedBlindsVariant === 'PL' ? 'BLINDS_PL' : gameType;
    setGameType(resolvedType);
    setGameMode(mode);
    if (gameType === 'SHOWDOWN') {
      setGameVariant(selectedVariant);
    }
    navigate('/play');
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#080c14' }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251,191,36,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251,191,36,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/[0.06]" style={{ background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center gap-5">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-slate-500 hover:text-amber-400 transition-all duration-200 font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="hidden md:block">首頁</span>
          </button>

          <div className="w-px h-5 bg-white/10" />

          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wide" style={{ fontFamily: 'Oswald, Impact, sans-serif' }}>
              <span className="text-amber-400">遊戲</span>
              <span className="text-white">選單</span>
            </h1>
          </div>

          <div className="ml-auto hidden md:flex items-center gap-2 text-slate-700 font-black text-xl select-none">
            {['♠', '♥', '♦', '♣'].map(s => <span key={s}>{s}</span>)}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {games.map((game, index) => {
            const IconComponent = game.icon;
            return (
              <div
                key={game.type}
                className="group relative rounded-2xl md:rounded-3xl border border-white/[0.07] hover:border-white/[0.18] overflow-hidden transition-all duration-300 game-card-enter hover:bg-white/[0.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  animationDelay: `${index * 100}ms`,
                }}
              >

                {/* Big suit watermark */}
                <div
                  className="absolute right-3 top-3 text-[100px] md:text-[120px] font-black select-none pointer-events-none leading-none transition-transform duration-500 group-hover:scale-110"
                  style={{ color: game.suitColor }}
                >
                  {game.suit}
                </div>

                <div className="relative p-6 md:p-7">
                  {/* Header row */}
                  <div className="flex items-start gap-4 mb-6">
                    {/* Icon */}
                    <div
                      className="relative shrink-0 p-3.5 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        background: `linear-gradient(135deg, ${game.gradient.replace('from-', '').replace(' to-', ', ')})`.replace('from-', '').replace(' to-', ', '),
                        backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl blur-lg opacity-60 transition-opacity group-hover:opacity-100"
                        style={{ background: game.glow }}
                      />
                      <div className={`relative bg-gradient-to-br ${game.gradient} p-0.5 rounded-xl`}>
                        <div className="bg-black/30 rounded-xl p-2">
                          <IconComponent className="w-8 h-8 md:w-9 md:h-9 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1">{game.subtitle}</div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-none" style={{ fontFamily: 'Oswald, Impact, sans-serif', letterSpacing: '0.03em' }}>
                        {game.title}
                      </h2>
                      <p className="text-slate-500 text-sm mt-1.5 group-hover:text-slate-400 transition-colors">{game.description}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.06] mb-5" />

                  {/* Variant Selection (SHOWDOWN) */}
                  {game.hasVariants && game.available && (
                    <div className="mb-5">
                      <label className="block text-[9px] font-black text-slate-600 mb-2.5 uppercase tracking-[0.25em]">
                        選擇遊戲變種
                      </label>
                      <div className="flex gap-2">
                        {variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant.id)}
                            className="relative flex-1 px-3 py-2.5 rounded-xl font-black text-xs transition-all duration-250 overflow-hidden"
                            style={selectedVariant === variant.id ? {
                              background: 'linear-gradient(135deg, rgba(251,113,133,0.2) 0%, rgba(239,68,68,0.1) 100%)',
                              border: '1px solid rgba(251,113,133,0.4)',
                              color: '#fb7185',
                              boxShadow: '0 0 20px rgba(251,113,133,0.15)',
                            } : {
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: '#64748b',
                            }}
                          >
                            <div className="font-black">{variant.name}</div>
                            <div className="text-[9px] opacity-60 font-normal mt-0.5">{variant.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blinds Variant Selection (NL / PL) */}
                  {(game as { hasBlindsVariants?: boolean }).hasBlindsVariants && game.available && (
                    <div className="mb-5">
                      <label className="block text-[9px] font-black text-slate-600 mb-2.5 uppercase tracking-[0.25em]">
                        選擇加注規則
                      </label>
                      <div className="flex gap-2">
                        {([
                          { id: 'NL' as const, name: 'NL 無限注', desc: 'No-Limit' },
                          { id: 'PL' as const, name: 'PL 底池限注', desc: 'Pot-Limit' },
                        ] as const).map((bv) => (
                          <button
                            key={bv.id}
                            onClick={() => setSelectedBlindsVariant(bv.id)}
                            className="relative flex-1 px-3 py-2.5 rounded-xl font-black text-xs transition-all duration-250 overflow-hidden"
                            style={selectedBlindsVariant === bv.id ? {
                              background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%)',
                              border: '1px solid rgba(251,191,36,0.4)',
                              color: '#fbbf24',
                              boxShadow: '0 0 20px rgba(251,191,36,0.15)',
                            } : {
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: '#64748b',
                            }}
                          >
                            <div className="font-black">{bv.name}</div>
                            <div className="text-[9px] opacity-60 font-normal mt-0.5">{bv.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode buttons */}
                  {game.available ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Practice */}
                      <button
                        onClick={() => handleGameSelect(game.type, 'PRACTICE')}
                        className="group/btn relative rounded-xl p-4 text-left transition-all duration-300 overflow-hidden"
                        style={{
                          background: 'rgba(96,165,250,0.06)',
                          border: '1px solid rgba(96,165,250,0.15)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,0.12)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(96,165,250,0.35)';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,0.06)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(96,165,250,0.15)';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(96,165,250,0.15)' }}>
                            <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <span className="text-sm font-black text-white">練習模式</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">不限時間，自由練習</p>
                        <div className="mt-3 flex items-center gap-1 text-blue-400/60 text-[10px] font-bold">
                          <span>開始</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </button>

                      {/* Challenge */}
                      <button
                        onClick={() => handleGameSelect(game.type, 'CHALLENGE')}
                        className="group/btn relative rounded-xl p-4 text-left transition-all duration-300 overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(249,115,22,0.08) 100%)',
                          border: '2px solid rgba(239,68,68,0.25)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(249,115,22,0.15) 100%)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(249,115,22,0.08) 100%)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                        }}
                      >
                        {/* Timer badge */}
                        <div
                          className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-black text-white px-2 py-0.5 rounded-full"
                          style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
                        >
                          <span>⏱</span> 5:00
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(249,115,22,0.2)' }}>
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                          </div>
                          <span className="text-sm font-black text-white">挑戰模式</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">限時 5 分鐘，搶榜</p>
                        <div className="mt-3 flex items-center gap-1 text-orange-400/70 text-[10px] font-bold">
                          <span>挑戰</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                      <Sparkles className="w-4 h-4 text-slate-600 animate-pulse" />
                      <span className="text-slate-600 font-black text-xs uppercase tracking-widest">敬請期待</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes gameCardEnter {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .game-card-enter {
          animation: gameCardEnter 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}
