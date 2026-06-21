import React, { memo, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, HelpCircle } from 'lucide-react';
import type { BlindsQuestion } from '../utils/blindsLogic';
import { cn } from '../utils/cn';

interface BlindsGameProps {
  question: BlindsQuestion;
  userInput: string;
  boolSelection: boolean | null;
  showResult: boolean;
  isCorrect: boolean | null;
  onInputChange: (v: string) => void;
  onBoolSelect: (v: boolean) => void;
  onCheckResult: () => void;
  onNext: () => void;
}

const badgeColorMap: Record<string, string> = {
  'NL 最小加注': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'PL 最大加注': 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  '全下重開':    'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

export const BlindsGame = memo<BlindsGameProps>(({
  question,
  userInput,
  boolSelection,
  showResult,
  isCorrect,
  onInputChange,
  onBoolSelect,
  onCheckResult,
  onNext,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever a new number question appears
  useEffect(() => {
    if (!showResult && question.answerType === 'number') {
      inputRef.current?.focus();
    }
  }, [question.id, showResult, question.answerType]);

  const canSubmit =
    question.answerType === 'number'
      ? userInput.replace(/\D/g, '').length > 0
      : boolSelection !== null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit && !showResult) {
      onCheckResult();
    }
  };

  const badgeClass = badgeColorMap[question.badge] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/40 border border-white/10 p-6 md:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 text-[140px] text-white/[0.02] font-black select-none pointer-events-none" aria-hidden="true">
          ♠
        </div>

        {/* Badge */}
        <div className="mb-6">
          <span className={cn('border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', badgeClass)}>
            {question.badge}
          </span>
        </div>

        {/* Scenario Card */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 md:p-5 mb-6 space-y-2">
          {question.scenarioLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-slate-500 font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
              <span>{line}</span>
            </div>
          ))}
        </div>

        {/* Question */}
        <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-2">
          {question.question}
        </h2>

        {/* Hint */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-8">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{question.hint}</span>
        </div>

        {/* Input area */}
        {question.answerType === 'number' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={userInput}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={showResult}
                placeholder="輸入答案（數字）"
                className={cn(
                  'w-full bg-slate-800/70 border rounded-2xl px-5 py-4 text-xl font-bold text-center tracking-wider outline-none transition-all duration-300',
                  showResult
                    ? (isCorrect
                        ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                        : 'border-red-500 text-red-300 bg-red-500/10')
                    : 'border-white/20 text-white placeholder-slate-600 focus:border-brand-gold/60 focus:bg-slate-800'
                )}
              />
            </div>
            {!showResult && (
              <button
                onClick={onCheckResult}
                disabled={!canSubmit}
                className="sm:w-auto w-full bg-gradient-to-r from-brand-gold to-yellow-400 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-brand-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              >
                確認答案
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { if (!showResult) onBoolSelect(true); }}
              disabled={showResult}
              className={cn(
                'flex-1 py-5 rounded-2xl font-black text-base border-2 transition-all duration-300',
                showResult
                  ? (question.answer === true
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : (boolSelection === true
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-white/5 border-white/10 text-slate-500'))
                  : (boolSelection === true
                      ? 'bg-blue-500/20 border-blue-500 text-white scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 hover:scale-[1.02]')
              )}
            >
              {question.type === 'REOPEN_ACTION' ? '✓ 是，可再加注' : '✓ 是'}
            </button>
            <button
              onClick={() => { if (!showResult) onBoolSelect(false); }}
              disabled={showResult}
              className={cn(
                'flex-1 py-5 rounded-2xl font-black text-base border-2 transition-all duration-300',
                showResult
                  ? (question.answer === false
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : (boolSelection === false
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-white/5 border-white/10 text-slate-500'))
                  : (boolSelection === false
                      ? 'bg-blue-500/20 border-blue-500 text-white scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 hover:scale-[1.02]')
              )}
            >
              {question.type === 'REOPEN_ACTION' ? '✗ 否，只能跟注或棄牌' : '✗ 否'}
            </button>
            {!showResult && (
              <button
                onClick={onCheckResult}
                disabled={!canSubmit}
                className="sm:w-auto w-full bg-gradient-to-r from-brand-gold to-yellow-400 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-brand-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              >
                確認答案
              </button>
            )}
          </div>
        )}

        {/* Result */}
        {showResult && (
          <div className={cn(
            'mt-8 p-5 border rounded-2xl animate-in zoom-in duration-300',
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}>
            <div className={cn(
              'flex items-center gap-2 mb-3 font-black uppercase text-xs tracking-widest',
              isCorrect ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isCorrect
                ? <><CheckCircle2 className="w-4 h-4" /> 正確！</>
                : <><XCircle className="w-4 h-4" /> 錯誤！</>
              }
              {!isCorrect && (
                <span className="ml-1 font-normal text-slate-300 normal-case tracking-normal">
                  正確答案：
                  <span className="font-black text-white">
                    {typeof question.answer === 'boolean'
                      ? (question.answer ? '是，重開行動' : '否，不重開')
                      : question.answer}
                  </span>
                </span>
              )}
            </div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {question.explanation}
            </p>
            <button
              onClick={onNext}
              className="mt-5 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-black uppercase text-xs shadow-lg hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              下一題 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

BlindsGame.displayName = 'BlindsGame';
