import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import { CheckCircle2, XCircle, ChevronRight, Calculator, RotateCcw, Plus, Minus } from 'lucide-react';
import * as PotCalc from '../utils/potCalculator';
import { cn } from '../utils/cn';

interface SplitPotGameProps {
  potPlayers:        PotCalc.Player[];
  potAmountAnswers:  Record<string, string>;
  userEligible:      Record<string, number[]>;
  showResult:        boolean;
  correctPots:       PotCalc.PotStage[];
  scenarioContext?:  PotCalc.ScenarioContext | null;
  onAmountChange:    (potName: string, value: string) => void;
  onToggleEligible:  (potName: string, playerId: number) => void;
  onCheckResult:     () => void;
  onReset:           () => void;
}

// ── Position visual config ────────────────────────────────────────────────────
const POS_CONFIG: Record<string, { bg: string; text: string; ring: string; light: string; border: string; label: string }> = {
  UTG: { bg: '#ef4444', text: '#fff',     ring: 'rgba(239,68,68,0.4)',   light: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   label: 'Under The Gun' },
  HJ:  { bg: '#f97316', text: '#fff',     ring: 'rgba(249,115,22,0.4)',  light: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  label: 'Hijack'        },
  CO:  { bg: '#eab308', text: '#1c1917',  ring: 'rgba(234,179,8,0.4)',   light: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.3)',   label: 'Cut-Off'       },
  BTN: { bg: '#22c55e', text: '#052e16',  ring: 'rgba(34,197,94,0.4)',   light: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   label: 'Button'        },
  SB:  { bg: '#3b82f6', text: '#fff',     ring: 'rgba(59,130,246,0.4)',  light: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  label: 'Small Blind'   },
  BB:  { bg: '#a855f7', text: '#fff',     ring: 'rgba(168,85,247,0.4)',  light: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)',  label: 'Big Blind'     },
};
const DEFAULT_POS = { bg: '#64748b', text: '#fff', ring: 'rgba(100,116,139,0.4)', light: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', label: '' };

function getPosConfig(pos: string) { return POS_CONFIG[pos] ?? DEFAULT_POS; }

// ── Position badge ────────────────────────────────────────────────────────────
function PosBadge({ pos, size = 'md' }: { pos: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = getPosConfig(pos);
  const sizeClass = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-[10px] px-2 py-1';
  return (
    <span
      className={cn('font-black rounded-lg tracking-wider uppercase shrink-0', sizeClass)}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {pos}
    </span>
  );
}

// ── Chip breakdown bar ────────────────────────────────────────────────────────
const CHIP_DENOMS = [
  { value: 5000, bg: '#9333ea', label: '5K'  },
  { value: 1000, bg: '#475569', label: '1K'  },
  { value: 500,  bg: '#dc2626', label: '500' },
  { value: 100,  bg: '#94a3b8', label: '100' },
];

function ChipBar({ amount }: { amount: number }) {
  const chips: { bg: string; label: string; count: number }[] = [];
  let rem = amount;
  for (const d of CHIP_DENOMS) {
    const n = Math.floor(rem / d.value);
    if (n > 0) chips.push({ ...d, count: n });
    rem %= d.value;
  }
  if (!chips.length) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {chips.map(({ bg, label, count }) => (
        <div key={label} className="flex items-center gap-0.5">
          {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-black/25 flex items-center justify-center"
              style={{ backgroundColor: bg, marginLeft: i > 0 ? '-4px' : 0, zIndex: i, position: 'relative' }}
            >
              <span className="text-[5px] font-black text-white/80">{label}</span>
            </div>
          ))}
          {count > 5 && <span className="text-[9px] text-slate-500 font-bold ml-0.5">×{count}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Action label logic ────────────────────────────────────────────────────────
function getActionLabel(bet: number, prevMaxBet: number): { label: string; sublabel: string } {
  if (prevMaxBet === 0) return { label: '首推全下', sublabel: 'Open All-In' };
  if (bet < prevMaxBet)  return { label: '跟注全下（不足）', sublabel: 'Call All-In · Short Stack' };
  if (bet === prevMaxBet) return { label: '跟注全下', sublabel: 'Call All-In' };
  return { label: '超推全下', sublabel: 'Re-Raise All-In' };
}

// ══════════════════════════════════════════════════════════════════════════════
export const SplitPotGame = memo<SplitPotGameProps>(({
  potPlayers,
  potAmountAnswers,
  userEligible,
  showResult,
  correctPots,
  scenarioContext,
  onAmountChange,
  onToggleEligible,
  onCheckResult,
  onReset,
}) => {
  const [phase, setPhase]       = useState<'story' | 'answer'>('story');
  const [revealed, setRevealed] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setPhase('story');
    setRevealed(0);
  }, [potPlayers]);

  const storyComplete = revealed >= potPlayers.length;
  const runningTotal  = potPlayers.slice(0, revealed).reduce((s, p) => s + p.bet, 0);
  const allAnswered   = correctPots.every(pot => (potAmountAnswers[pot.name] ?? '').trim() !== '');

  const handleAmountInput = useCallback(
    (potName: string) => (e: React.ChangeEvent<HTMLInputElement>) => onAmountChange(potName, e.target.value),
    [onAmountChange]
  );

  const nudgeAmount = useCallback((potName: string, delta: number) => {
    const cur  = parseInt(potAmountAnswers[potName] || '0') || 0;
    onAmountChange(potName, String(Math.max(0, cur + delta)));
  }, [potAmountAnswers, onAmountChange]);

  const potStatus = (pot: PotCalc.PotStage) => {
    const amountOk   = parseInt(potAmountAnswers[pot.name] || '0') === pot.amount;
    const selected   = userEligible[pot.name] ?? [];
    const eligibleOk =
      selected.length === pot.eligiblePlayerIds.length &&
      selected.every(id => pot.eligiblePlayerIds.includes(id));
    return { amountOk, eligibleOk, allOk: amountOk && eligibleOk };
  };

  const isAllCorrect = showResult && correctPots.every(p => potStatus(p).allOk);

  // Next action preview text
  const nextPlayer = potPlayers[revealed];
  const nextMaxBet = potPlayers.slice(0, revealed).reduce((max, p) => Math.max(max, p.bet), 0);
  const nextAction = nextPlayer ? getActionLabel(nextPlayer.bet, nextMaxBet) : null;

  // ── STORY PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'story') {
    return (
      <div className="space-y-4 sp-enter">

        {/* Context bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.07]"
          style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">牌局進行中</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-slate-400 font-bold">
            {scenarioContext?.blindLabel ?? '—'} · Texas Hold'em · 翻牌前全下
          </span>
          <div className="ml-auto text-xs text-slate-600 font-bold">
            {revealed} / {potPlayers.length} 位行動
          </div>
        </div>

        {/* Action log */}
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)' }}>

          {/* Header */}
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">行動順序</span>
            <span className="text-[9px] text-slate-700">（依位置順序揭露）</span>
          </div>

          {/* Player rows */}
          <div className="divide-y divide-white/[0.04]">
            {potPlayers.map((player, i) => {
              const pos        = player.name;
              const c          = getPosConfig(pos);
              const prevMaxBet = potPlayers.slice(0, i).reduce((max, p) => Math.max(max, p.bet), 0);
              const actionInfo = getActionLabel(player.bet, prevMaxBet);
              const isDone     = i < revealed;
              const isNext     = i === revealed;
              const isPending  = i > revealed;

              return (
                <div
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 transition-all duration-500',
                    isDone   ? 'opacity-100' :
                    isNext   ? 'opacity-100' :
                    'opacity-25'
                  )}
                  style={isNext ? { background: 'rgba(255,255,255,0.03)' } : undefined}
                >
                  {/* Step number */}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border shrink-0 transition-all duration-500',
                    isDone   ? 'text-white border-transparent' :
                    isNext   ? 'text-white border-white/20 animate-pulse' :
                    'text-slate-700 border-white/[0.06]'
                  )}
                    style={isDone ? { backgroundColor: c.bg, borderColor: 'transparent' } : undefined}>
                    {isDone ? '✓' : i + 1}
                  </div>

                  {/* Position badge */}
                  <PosBadge pos={pos} size="md" />

                  {/* Action info */}
                  <div className="flex-1 min-w-0">
                    {isDone ? (
                      <>
                        <div className="text-xs font-black text-white">{actionInfo.label}</div>
                        <div className="text-[10px] text-slate-500">{actionInfo.sublabel}</div>
                      </>
                    ) : isNext ? (
                      <div className="text-xs text-slate-500 font-bold animate-pulse">等待行動...</div>
                    ) : (
                      <div className="text-xs text-slate-700">待機</div>
                    )}
                  </div>

                  {/* Bet amount + chips */}
                  {isDone ? (
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-amber-400 text-base">
                        ${player.bet.toLocaleString()}
                      </div>
                      <ChipBar amount={player.bet} />
                    </div>
                  ) : isNext ? (
                    <div className="font-mono text-slate-600 text-sm font-bold">???</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Running pot */}
        <div className="rounded-2xl border border-white/[0.07] p-4 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div>
            <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">目前桌面底池</div>
            <div className={cn(
              'text-3xl font-black font-mono transition-all duration-500',
              runningTotal > 0 ? 'text-amber-400' : 'text-slate-800'
            )}>
              {runningTotal > 0 ? `$${runningTotal.toLocaleString()}` : '—'}
            </div>
          </div>
          {runningTotal > 0 && (
            <div className="text-right">
              <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">已入池籌碼</div>
              <ChipBar amount={runningTotal} />
            </div>
          )}
        </div>

        {/* Blind info strip */}
        {scenarioContext && (
          <div className="flex gap-2 text-[10px]">
            <div className="flex-1 rounded-xl border border-white/[0.06] px-3 py-2 text-center"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="text-slate-600 font-bold">小盲 SB</div>
              <div className="text-slate-400 font-black font-mono">${scenarioContext.sb.toLocaleString()}</div>
            </div>
            <div className="flex-1 rounded-xl border border-white/[0.06] px-3 py-2 text-center"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="text-slate-600 font-bold">大盲 BB</div>
              <div className="text-slate-400 font-black font-mono">${scenarioContext.bb.toLocaleString()}</div>
            </div>
            <div className="flex-1 rounded-xl border border-white/[0.06] px-3 py-2 text-center"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="text-slate-600 font-bold">底池數量</div>
              <div className="text-slate-400 font-black">{correctPots.length} 個</div>
            </div>
          </div>
        )}

        {/* Action button */}
        {!storyComplete ? (
          <button
            onClick={() => setRevealed(r => r + 1)}
            className="w-full flex items-center justify-center gap-3 font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.22)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <ChevronRight className="w-4 h-4 text-amber-400" />
            {nextPlayer && nextAction ? (
              <span>
                <span style={{ color: getPosConfig(nextPlayer.name).bg }}>{nextPlayer.name}</span>
                {' — '}{nextAction.label}
              </span>
            ) : '下一個行動'}
          </button>
        ) : (
          <button
            onClick={() => setPhase('answer')}
            className="w-full flex items-center justify-center gap-3 font-black py-5 rounded-2xl text-sm uppercase tracking-widest transition-all duration-300 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0c0a00',
              boxShadow: '0 4px 24px rgba(251,191,36,0.2)',
            }}
          >
            <Calculator className="w-4 h-4" />
            所有玩家已全下 — 開始計算底池
          </button>
        )}

        <style>{`
          @keyframes spEnter {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .sp-enter { animation: spEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        `}</style>
      </div>
    );
  }

  // ── ANSWER PHASE ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sp-enter">

      {/* Scenario recap bar */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">本局玩家</span>
          {scenarioContext && (
            <span className="text-[9px] text-slate-600 font-bold">{scenarioContext.blindLabel} · 翻牌前全下</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 p-3">
          {potPlayers.map((p, i) => {
            const c = getPosConfig(p.name);
            const prevMax = potPlayers.slice(0, i).reduce((max, pl) => Math.max(max, pl.bet), 0);
            const { label: actLabel } = getActionLabel(p.bet, prevMax);
            return (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: c.light, borderColor: c.border }}>
                <PosBadge pos={p.name} size="sm" />
                <div>
                  <div className="text-[10px] text-slate-500 leading-none">{actLabel}</div>
                  <div className="text-sm font-black font-mono text-amber-400">${p.bet.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instruction */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs text-slate-500 border border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.015)' }}>
        <span className="text-amber-500 shrink-0 mt-px">♠</span>
        點選每個底池的有資格玩家（可爭奪此池），再填入正確金額，完成後核對答案
      </div>

      {/* Pot cards */}
      <div className="space-y-4">
        {correctPots.map((pot, potIdx) => {
          const status   = showResult ? potStatus(pot) : null;
          const selected = userEligible[pot.name] ?? [];
          const isMain   = potIdx === 0;

          return (
            <div
              key={pot.name}
              className="rounded-2xl border overflow-hidden transition-all duration-300"
              style={{
                background: status
                  ? status.allOk ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)'
                  : 'rgba(255,255,255,0.02)',
                borderColor: status
                  ? status.allOk ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'
                  : 'rgba(255,255,255,0.08)',
              }}
            >
              {/* Pot header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    'text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest',
                    isMain
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/20'
                      : 'bg-blue-400/15 text-blue-300 border border-blue-400/20'
                  )}>
                    {pot.name}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    {pot.eligiblePlayerIds.length} 位有資格
                  </span>
                </div>
                {status && (
                  status.allOk
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    : <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="p-5 space-y-4">

                {/* Eligible player toggles */}
                <div>
                  <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-2.5">
                    可爭奪此底池的玩家
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {potPlayers.map((p, i) => {
                      const c         = getPosConfig(p.name);
                      const isSel     = selected.includes(p.id);
                      const isWrong   = showResult && isSel  && !pot.eligiblePlayerIds.includes(p.id);
                      const isMissed  = showResult && !isSel &&  pot.eligiblePlayerIds.includes(p.id);
                      const isCorrect = showResult && isSel  &&  pot.eligiblePlayerIds.includes(p.id);

                      return (
                        <button
                          key={p.id}
                          disabled={showResult}
                          onClick={() => onToggleEligible(pot.name, p.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-xs transition-all duration-200 active:scale-95 disabled:cursor-default"
                          style={
                            isWrong   ? { background: 'rgba(239,68,68,0.12)',  borderColor: 'rgba(239,68,68,0.45)',   color: '#fca5a5' } :
                            isMissed  ? { background: 'rgba(34,197,94,0.10)',  borderColor: 'rgba(34,197,94,0.5)',    color: '#86efac', outline: '2px dashed rgba(34,197,94,0.4)' } :
                            isCorrect ? { background: 'rgba(34,197,94,0.12)',  borderColor: 'rgba(34,197,94,0.4)',    color: '#86efac' } :
                            isSel     ? { background: c.light,                 borderColor: c.border,                 color: '#fff', boxShadow: `0 0 0 2px ${c.ring}` } :
                                        { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }
                          }
                        >
                          <PosBadge pos={p.name} size="sm" />
                          <span className="font-mono text-[10px] opacity-70">${p.bet.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                  {status && !status.eligibleOk && (
                    <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      正確：{pot.eligiblePlayerIds.map(id => potPlayers.find(p => p.id === id)?.name).join('、')}
                    </div>
                  )}
                </div>

                {/* Amount input */}
                <div>
                  <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-2.5">底池金額</div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={showResult}
                      onClick={() => nudgeAmount(pot.name, -100)}
                      className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all active:scale-90 disabled:opacity-30"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-lg pointer-events-none">$</span>
                      <input
                        ref={el => { inputRefs.current[pot.name] = el; }}
                        type="number"
                        inputMode="numeric"
                        disabled={showResult}
                        value={potAmountAnswers[pot.name] || ''}
                        onChange={handleAmountInput(pot.name)}
                        placeholder="0"
                        className={cn(
                          'w-full pl-8 pr-4 py-3 rounded-xl font-mono font-black text-xl text-right outline-none border-2 transition-all duration-200',
                          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                        )}
                        style={showResult
                          ? status?.amountOk
                            ? { background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.35)', color: '#86efac' }
                            : { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }
                          : { background: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }
                        }
                        onFocus={e => { if (!showResult) (e.target as HTMLInputElement).style.borderColor = 'rgba(251,191,36,0.5)'; }}
                        onBlur={e  => { if (!showResult) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      />
                    </div>

                    <button
                      disabled={showResult}
                      onClick={() => nudgeAmount(pot.name, 100)}
                      className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all active:scale-90 disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {status && !status.amountOk && (
                      <div className="text-emerald-400 font-mono font-black text-lg shrink-0">
                        ${pot.amount.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Quick-add chips */}
                  {!showResult && (
                    <div className="flex gap-1.5 mt-2">
                      {[100, 500, 1000, 5000].map(v => (
                        <button
                          key={v}
                          onClick={() => nudgeAmount(pot.name, v)}
                          className="text-[9px] font-black px-2 py-1 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          +{v >= 1000 ? `${v / 1000}K` : v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!showResult ? (
        <button
          disabled={!allAnswered}
          onClick={onCheckResult}
          className="w-full font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: allAnswered ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'rgba(255,255,255,0.05)',
            color:      allAnswered ? '#0c0a00' : '#475569',
            border:     allAnswered ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          核對結果
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className="p-4 rounded-2xl font-black text-center border-2 text-base"
            style={isAllCorrect
              ? { background: 'rgba(34,197,94,0.08)',  borderColor: 'rgba(34,197,94,0.35)',  color: '#86efac' }
              : { background: 'rgba(239,68,68,0.08)',  borderColor: 'rgba(239,68,68,0.35)',  color: '#fca5a5' }}
          >
            {isAllCorrect ? '✓ 全部正確！底池計算完全正確' : '✗ 有誤，請看上方標示的正確答案'}
          </div>
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <RotateCcw className="w-4 h-4" />
            下一題
          </button>
        </div>
      )}

      <style>{`
        @keyframes spEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sp-enter { animation: spEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>
    </div>
  );
});

SplitPotGame.displayName = 'SplitPotGame';
