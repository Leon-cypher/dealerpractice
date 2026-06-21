import React, { memo } from 'react';

// Chip denomination config: value, bg colour, border colour, text colour, label
const CHIP_DENOMS = [
  { value: 5000, bg: 'bg-purple-600',  border: 'border-purple-400', text: 'text-white',        label: '5K' },
  { value: 1000, bg: 'bg-slate-800',   border: 'border-slate-500',  text: 'text-slate-200',     label: '1K' },
  { value: 500,  bg: 'bg-red-600',     border: 'border-red-400',    text: 'text-white',          label: '500' },
  { value: 100,  bg: 'bg-slate-300',   border: 'border-slate-400',  text: 'text-slate-900',      label: '100' },
] as const;

/** Decomposes `amount` into chip counts, largest denomination first. */
function decompose(amount: number): { value: number; count: number; bg: string; border: string; text: string; label: string }[] {
  let remaining = amount;
  return CHIP_DENOMS
    .map(d => {
      const count = Math.floor(remaining / d.value);
      remaining -= count * d.value;
      return { ...d, count };
    })
    .filter(d => d.count > 0);
}

interface ChipStackProps {
  amount: number;
  /** Show the total amount below the chips (used in the confirmed-pots section) */
  showTotal?: boolean;
  /** Compact mode: single small chip dot per denomination (used in center-pot area) */
  compact?: boolean;
}

/** Renders an `amount` as a row of coloured poker chips. No total is shown by default. */
export const ChipStack = memo<ChipStackProps>(({ amount, showTotal = false, compact = false }) => {
  const groups = decompose(amount);

  if (compact) {
    // One dot per denomination present — used for "chips in pot" visual
    return (
      <div className="flex gap-0.5 items-center">
        {groups.map(g => (
          <div
            key={g.value}
            className={`w-4 h-4 rounded-full ${g.bg} border ${g.border} shadow-sm`}
            title={`${g.count} × ${g.value}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      {/* Chip row */}
      <div className="flex flex-wrap gap-2 items-center">
        {groups.map(g => (
          <div key={g.value} className="flex items-center gap-1">
            {/* Stack of chip circles – show up to 5, then "+n" */}
            {Array.from({ length: Math.min(g.count, 5) }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full ${g.bg} border-2 ${g.border} flex items-center justify-center shadow-md`}
                style={{
                  marginLeft: i > 0 ? '-6px' : undefined,
                  zIndex: i,
                  position: 'relative',
                }}
              >
                <span className={`text-[8px] font-black ${g.text} select-none`}>{g.label}</span>
              </div>
            ))}
            {g.count > 5 && (
              <span className="text-[10px] font-bold text-slate-400 ml-0.5">×{g.count}</span>
            )}
          </div>
        ))}
        {groups.length === 0 && (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </div>

      {/* Optional total label */}
      {showTotal && (
        <div className="text-brand-gold font-black text-lg font-mono">
          ${amount.toLocaleString()}
        </div>
      )}
    </div>
  );
});

ChipStack.displayName = 'ChipStack';
