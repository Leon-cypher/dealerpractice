import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, BookOpen, Trophy, Medal, LogOut, User as UserIcon, ArrowRight, ChevronRight } from 'lucide-react';
import { GiSpades, GiHearts, GiDiamonds, GiClubs } from 'react-icons/gi';
import { FcGoogle } from 'react-icons/fc';
import { useGameAuth } from '../hooks/useGameAuth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { InAppBrowserWarningModal } from '../components/InAppBrowserWarningModal';
import { cn } from '../utils/cn';
import logo from '../assets/logo.png';

type MenuId = 'game' | 'test' | 'achievements' | 'leaderboard';

const MENU_ITEMS: {
  id: MenuId;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  borderColor: string;
  accentColor: string;
  glowColor: string;
  tag?: string;
  title: string;
  desc: string;
  bullets: string[];
  suit: React.ElementType;
  suitChar: string;
}[] = [
  {
    id: 'game',
    label: '遊戲訓練',
    icon: Gamepad2,
    path: '/game-menu',
    color: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-500/40',
    accentColor: 'text-amber-400',
    glowColor: 'rgba(251,191,36,0.15)',
    title: '遊戲訓練',
    desc: '6 種專業訓練模式，涵蓋底池計算、牌力判斷、加注規則與理論知識。',
    bullets: ['底池分配計算（多人全下）', '牌力判斷（德州 / 奧馬哈 / BIGO）', 'NL & PL 加注計算', '理論知識測驗'],
    suit: GiSpades,
    suitChar: '♠',
  },
  {
    id: 'test',
    label: '測驗模式',
    icon: BookOpen,
    path: '/test-mode',
    color: 'from-blue-500/20 to-indigo-500/10',
    borderColor: 'border-blue-500/40',
    accentColor: 'text-blue-400',
    glowColor: 'rgba(96,165,250,0.15)',
    tag: 'New',
    title: '規則測驗',
    desc: '50 題 TDA 規則模擬考試，90 分以上合格，全對解鎖「完美答卷」成就。',
    bullets: ['50 題隨機抽題', '即時成績與答題分析', '按類別查看弱點', '歷史成績紀錄'],
    suit: GiDiamonds,
    suitChar: '♦',
  },
  {
    id: 'achievements',
    label: '成就系統',
    icon: Trophy,
    path: '/achievements',
    color: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-500/40',
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(52,211,153,0.15)',
    title: '成就系統',
    desc: '追蹤你的訓練進度，解鎖 16 個成就徽章，查看個人統計數據。',
    bullets: ['16 個成就徽章', '速度、連勝、分數、考試類', '跨裝置同步（需登入）', '個人訓練統計'],
    suit: GiClubs,
    suitChar: '♣',
  },
  {
    id: 'leaderboard',
    label: '排行榜',
    icon: Medal,
    path: '/leaderboard',
    color: 'from-rose-500/20 to-pink-500/10',
    borderColor: 'border-rose-500/40',
    accentColor: 'text-rose-400',
    glowColor: 'rgba(251,113,133,0.15)',
    title: '排行榜',
    desc: '查看各遊戲模式的全球前 10 名，與其他荷官一較高下。',
    bullets: ['7 個遊戲類別', '底池、判斷、測驗、加注', '即時更新成績', '完成挑戰模式後登榜'],
    suit: GiHearts,
    suitChar: '♥',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const gameAuth = useGameAuth(showToast);
  const { user, profile, loading, handleGoogleLogin: handleLogin, handleLogout } = gameAuth;
  const [active, setActive] = useState<MenuId>('game');
  const [animKey, setAnimKey] = useState(0);

  const handleSetActive = (id: MenuId) => {
    setActive(id);
    setAnimKey(k => k + 1);
  };

  const activeItem = MENU_ITEMS.find(m => m.id === active)!;

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-hidden">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <InAppBrowserWarningModal
        isOpen={gameAuth.inAppBrowserWarning.isOpen}
        onCopyUrl={gameAuth.copyUrlToClipboard}
        onProceed={gameAuth.proceedWithInAppLogin}
        onClose={gameAuth.inAppBrowserWarning.close}
      />
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Radial grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251,191,36,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251,191,36,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Noise grain */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }} />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT (< md)
      ══════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 blur-lg rounded-full" />
              <img src={logo} alt="" className="relative w-8 h-8 object-contain invert hue-rotate-180 mix-blend-screen" />
            </div>
            <div>
              <div className="font-black text-amber-400 text-base tracking-tight leading-none" style={{ fontFamily: 'Oswald, Impact, sans-serif' }}>LEON-LAB</div>
              <div className="text-[8px] text-slate-600 uppercase tracking-[0.2em]">Dealer Training</div>
            </div>
          </div>
          {!loading && (
            user ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-amber-400/40 overflow-hidden bg-slate-800 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <UserIcon className="w-full h-full p-1.5 text-slate-400" />}
                </div>
                <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full font-bold text-xs shadow-lg">
                <FcGoogle className="w-3.5 h-3.5" />登入
              </button>
            )
          )}
        </div>

        {/* Mobile nav — card style */}
        <div className="grid grid-cols-4 gap-0 border-b border-white/[0.06]">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSetActive(item.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 py-3.5 text-[9px] font-black uppercase tracking-widest transition-all duration-200',
                  isActive ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-amber-400/5" />
                )}
                <Icon className={cn('w-4 h-4 relative z-10', isActive && 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]')} />
                <span className="relative z-10 leading-none">{item.label.split('').slice(0, 3).join('')}</span>
                {isActive && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />}
                {item.tag && (
                  <div className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile content panel */}
        <div key={animKey} className="flex-1 flex flex-col p-5 home-panel-enter overflow-hidden relative">
          {/* Big suit watermark */}
          <activeItem.suit className="absolute -right-4 top-8 text-[160px] select-none pointer-events-none" style={{ color: 'rgba(255,255,255,0.02)' }} />

          {/* Tag */}
          {activeItem.tag && (
            <span className="inline-block text-[10px] font-black text-blue-300 bg-blue-500/15 border border-blue-400/20 px-2.5 py-1 rounded-full mb-4 tracking-widest uppercase w-fit">
              ✦ {activeItem.tag}
            </span>
          )}

          {/* Title */}
          <h2 className="text-5xl font-black text-white leading-none mb-1" style={{ fontFamily: 'Oswald, Impact, sans-serif', letterSpacing: '0.03em' }}>
            {activeItem.title}
          </h2>

          {/* Gold line */}
          <div className="flex items-center gap-2 mb-4 mt-3">
            <div className="h-[2px] w-8 bg-amber-400" />
            <span className="text-amber-400/60 text-[9px] font-black uppercase tracking-[0.3em]">Leon-lab</span>
          </div>

          {/* Desc */}
          <p className="text-slate-400 text-sm leading-relaxed mb-5">{activeItem.desc}</p>

          {/* Bullets */}
          <ul className="space-y-2 mb-8 flex-1">
            {activeItem.bullets.map((b, i) => (
              <li key={b} className="flex items-center gap-3 text-sm text-slate-300" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="text-amber-400 font-black text-xs w-4 shrink-0">{activeItem.suitChar}</span>
                {b}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => navigate(activeItem.path)}
            className="relative w-full flex items-center justify-center gap-2.5 font-black py-4 rounded-2xl text-base uppercase tracking-widest transition-all duration-300 overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
            <span className="relative text-slate-900">進入 {activeItem.title}</span>
            <ArrowRight className="relative w-5 h-5 text-slate-900" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT (≥ md)
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex relative z-10 min-h-screen">

        {/* ── Left sidebar ── */}
        <div className="w-72 shrink-0 flex flex-col border-r border-white/[0.06]"
          style={{ background: 'linear-gradient(180deg, rgba(8,12,20,0.98) 0%, rgba(12,16,24,0.98) 100%)' }}>

          {/* Logo */}
          <div className="px-7 pt-9 pb-7 border-b border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/25 blur-xl rounded-full" />
                <img src={logo} alt="" className="relative w-11 h-11 object-contain invert hue-rotate-180 mix-blend-screen" />
              </div>
              <div>
                <div className="font-black text-amber-400 text-2xl tracking-tight leading-none" style={{ fontFamily: 'Oswald, Impact, sans-serif' }}>
                  LEON-LAB
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-[0.25em] mt-1">Dealer Training Platform</div>
              </div>
            </div>
          </div>

          {/* Decorative suits */}
          <div className="flex items-center justify-center gap-3 py-4 border-b border-white/[0.04]">
            {['♠', '♥', '♦', '♣'].map((s, i) => (
              <span key={s} className="text-sm font-black" style={{
                color: i % 2 === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.12)',
              }}>{s}</span>
            ))}
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] px-4 mb-4">訓練選單</div>
            {MENU_ITEMS.map((item, i) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSetActive(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 text-left group relative overflow-hidden',
                    isActive
                      ? 'text-amber-400'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
                  )}
                  style={isActive ? {
                    background: `linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.04) 100%)`,
                    border: '1px solid rgba(251,191,36,0.2)',
                  } : { border: '1px solid transparent' }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-amber-400 rounded-r-full" />
                  )}
                  <Icon className={cn('w-4 h-4 shrink-0 transition-all duration-200', isActive ? 'text-amber-400' : 'group-hover:text-slate-300')} />
                  <span className="flex-1">{item.label}</span>
                  {item.tag && (
                    <span className="text-[9px] font-black text-blue-300 bg-blue-500/15 border border-blue-400/20 px-1.5 py-0.5 rounded-full tracking-wider">
                      {item.tag}
                    </span>
                  )}
                  <span className="text-sm opacity-20 font-black">{item.suitChar}</span>
                </button>
              );
            })}
          </nav>

          {/* Auth section */}
          <div className="px-4 pb-7 border-t border-white/[0.06] pt-5">
            {!loading && (
              user ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-9 h-9 rounded-full border border-amber-400/30 overflow-hidden bg-slate-800 shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <UserIcon className="w-full h-full p-2 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{profile?.nickname || '設定暱稱'}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">已登入</div>
                  </div>
                  <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10 shrink-0" title="登出">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-black px-4 py-3 rounded-xl font-black text-sm hover:bg-slate-100 transition-all hover:scale-[1.02] shadow-lg"
                >
                  <FcGoogle className="w-4 h-4" />
                  Google 登入
                </button>
              )
            )}
          </div>
        </div>

        {/* ── Right content area ── */}
        <div className="flex-1 flex items-center justify-center p-16 relative overflow-hidden">

          {/* Giant suit bg */}
          <activeItem.suit
            className="absolute pointer-events-none select-none transition-all duration-700"
            style={{
              fontSize: '420px',
              right: '-40px',
              bottom: '-60px',
              color: 'rgba(255,255,255,0.015)',
              filter: 'blur(2px)',
            }}
          />

          {/* Glow behind content */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-700"
            style={{ background: activeItem.glowColor }}
          />

          {/* Content */}
          <div key={`${active}-${animKey}`} className="relative w-full max-w-2xl home-panel-enter">

            {/* Tag */}
            {activeItem.tag && (
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-300 bg-blue-500/10 border border-blue-400/20 px-3 py-1.5 rounded-full tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {activeItem.tag}
                </span>
              </div>
            )}

            {/* Title */}
            <h1
              className="text-7xl xl:text-8xl font-black text-white leading-none mb-5"
              style={{ fontFamily: 'Oswald, Impact, sans-serif', letterSpacing: '0.03em' }}
            >
              {activeItem.title}
            </h1>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-7">
              <div className="h-[2px] w-14 bg-amber-400" />
              <span className="text-amber-400/50 text-[10px] font-black uppercase tracking-[0.35em]">Leon-lab · Dealer Training</span>
            </div>

            {/* Desc */}
            <p className="text-slate-400 text-lg leading-relaxed mb-9 max-w-lg">{activeItem.desc}</p>

            {/* Bullets grid */}
            <ul className="grid grid-cols-2 gap-3 mb-12">
              {activeItem.bullets.map((b, i) => (
                <li
                  key={b}
                  className={cn(
                    'flex items-start gap-3 text-sm text-slate-300 rounded-xl px-4 py-3.5 border',
                    activeItem.borderColor
                  )}
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <span className={cn('font-black text-sm shrink-0 mt-px', activeItem.accentColor)}>{activeItem.suitChar}</span>
                  {b}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => navigate(activeItem.path)}
              className="group relative flex items-center gap-3 font-black px-9 py-4.5 rounded-2xl text-base uppercase tracking-widest transition-all duration-300 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 0 40px rgba(251,191,36,0.25), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              <span className="relative text-slate-900">進入 {activeItem.title}</span>
              <ChevronRight className="relative w-5 h-5 text-slate-900 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes homePanelEnter {
          0% { opacity: 0; transform: translateX(16px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .home-panel-enter {
          animation: homePanelEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes suitFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
