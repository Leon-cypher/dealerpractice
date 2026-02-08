import React, { useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 專業賭場大面額配色
const CHIP_DENOMINATIONS = [
  { value: 50000, color: 'from-pink-500 to-pink-700',   edge: 'bg-pink-800',   label: '50k' },
  { value: 10000, color: 'from-sky-400 to-sky-600',    edge: 'bg-sky-800',    label: '10k' },
  { value: 5000,  color: 'from-orange-400 to-orange-600', edge: 'bg-orange-800', label: '5k' },
  { value: 1000,  color: 'from-yellow-300 to-yellow-500', edge: 'bg-yellow-700', label: '1k' },
  { value: 500,   color: 'from-purple-500 to-purple-700', edge: 'bg-purple-900', label: '500' },
  { value: 100,   color: 'from-slate-700 to-slate-900',  edge: 'bg-black',      label: '100' },
];

interface ChipStackProps {
  amount: number;
  maxChipsDisplay?: number;
  className?: string;
}

export const VisualChipStack: React.FC<ChipStackProps> = ({ 
  amount, 
  maxChipsDisplay = 12,
  className 
}) => {
  const chips = useMemo(() => {
    let remaining = amount;
    const result: typeof CHIP_DENOMINATIONS[0][] = [];
    CHIP_DENOMINATIONS.forEach(denom => {
      const count = Math.floor(remaining / denom.value);
      for (let i = 0; i < count; i++) {
        if (result.length < maxChipsDisplay) result.push(denom);
      }
      remaining %= denom.value;
    });
    return result.reverse(); // 由下往上疊
  }, [amount, maxChipsDisplay]);

  if (amount <= 0) return null;

  return (
    <div className={cn("flex flex-col items-center justify-end min-h-[100px] relative", className)}>
      <div className="relative flex flex-col-reverse items-center">
        {chips.map((chip, index) => (
          <div
            key={index}
            className="relative"
            style={{
              zIndex: index,
              marginTop: index === 0 ? '0' : '-14px', // 讓圓盤重疊顯示側面
            }}
          >
            {/* 籌碼側面 (厚度感) */}
            <div className={cn("w-10 h-5 rounded-full shadow-lg", chip.edge)}></div>
            
            {/* 籌碼表面 (正圓) */}
            <div className={cn(
              "absolute top-0 w-10 h-4 rounded-full border border-white/20 bg-gradient-to-br flex items-center justify-center overflow-hidden",
              chip.color
            )}>
              {/* 籌碼表面花紋 */}
              <div className="absolute inset-0 flex justify-around opacity-20 rotate-45">
                <div className="w-1 h-full bg-white"></div>
                <div className="w-1 h-full bg-white"></div>
              </div>
              <div className="absolute inset-1 border border-dashed border-white/10 rounded-full"></div>
              
              {/* 只有最上面的籌碼顯示面額 */}
              {index === chips.length - 1 && (
                <span className="text-[7px] font-black text-white drop-shadow-md z-10">{chip.label}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 金額標籤 (立在桌面上的感覺) */}
      <div className="mt-1 bg-black/80 px-2 py-0.5 rounded border border-poker-gold/30 shadow-2xl">
        <span className="text-[9px] font-mono text-poker-gold font-black">${amount.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default VisualChipStack;