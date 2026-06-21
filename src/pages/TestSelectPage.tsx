import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, Globe,
  FileText, Award, Target, CheckCircle2,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface ExamCard {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  accentColor: string;
  glowColor: string;
  iconBg: string;
  icon: React.ElementType;
  stats: { label: string; value: string }[];
  bullets: string[];
}

const EXAM_CARDS: ExamCard[] = [
  {
    id: 'basic',
    path: '/test-basic',
    title: '基本規則測驗',
    subtitle: '荷官規則認證模擬考試',
    color: 'from-yellow-500/20 to-amber-500/10',
    borderColor: 'border-yellow-500/30 hover:border-yellow-400/60',
    accentColor: 'text-yellow-400',
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(251,191,36,0.1)]',
    iconBg: 'bg-yellow-400/15',
    icon: BookOpen,
    stats: [
      { label: '題庫', value: '110 題' },
      { label: '抽題', value: '50 題' },
      { label: '滿分', value: '100 分' },
      { label: '及格', value: '90 分' },
    ],
    bullets: [
      '涵蓋規則判定、發牌程序、下注規範等',
      '每題 2 分，45 題正確即通過',
      '歷史成績紀錄與類別分析',
    ],
  },
  {
    id: 'tda',
    path: '/tda-test',
    title: 'TDA 模擬考',
    subtitle: 'TDA 官方題庫 · 中英對照',
    color: 'from-cyan-500/20 to-blue-500/10',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
    accentColor: 'text-cyan-400',
    glowColor: 'group-hover:shadow-[0_0_40px_rgba(34,211,238,0.1)]',
    iconBg: 'bg-cyan-400/15',
    icon: Globe,
    stats: [
      { label: '題庫', value: '81 題' },
      { label: '抽題', value: '40 題' },
      { label: '滿分', value: '100 分' },
      { label: '及格', value: '90 分' },
    ],
    bullets: [
      'TDA 官方題庫，含多選題',
      '中英文對照，可隨時切換語言',
      '部分答案可能與樂玩判決不同',
    ],
  },
];

export function TestSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" /> 返回首頁
        </button>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">規則測驗</h1>
        <p className="text-slate-400 mb-10">選擇測驗類型開始作答</p>

        <div className="grid md:grid-cols-2 gap-6">
          {EXAM_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className={cn(
                  'group relative text-left bg-gradient-to-br rounded-3xl border p-7 transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.99]',
                  card.color,
                  card.borderColor,
                  card.glowColor,
                )}
              >
                {/* Icon */}
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-5', card.iconBg)}>
                  <Icon className={cn('w-7 h-7', card.accentColor)} />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white mb-1">{card.title}</h2>
                <p className="text-sm text-slate-400 mb-5">{card.subtitle}</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {card.stats.map(s => (
                    <div key={s.label} className="bg-black/20 rounded-xl px-2 py-2.5 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">{s.label}</div>
                      <div className="text-sm font-black text-white">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Bullets */}
                <ul className="space-y-2 mb-6">
                  {card.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className={cn('w-4 h-4 shrink-0 mt-0.5', card.accentColor)} />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all',
                  'bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20',
                  card.accentColor,
                )}>
                  進入測驗 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
