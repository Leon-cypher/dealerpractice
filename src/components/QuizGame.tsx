import React, { memo, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { Question } from '../utils/quizData';
import { cn } from '../utils/cn';

interface QuizGameProps {
  questions: Question[];
  currentIndex: number;
  selectedOption: string | null;
  showResult: boolean;
  onSelectOption: (option: string) => void;
  onNext: () => void;
}

const difficultyConfig: Record<string, { label: string; color: string; icon: string }> = {
  '初階': { label: '初階', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: '●' },
  '中階': { label: '中階', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: '●●' },
  '高階': { label: '高階', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: '●●●' },
};

export const QuizGame = memo<QuizGameProps>(({
  questions,
  currentIndex,
  selectedOption,
  showResult,
  onSelectOption,
  onNext
}) => {
  if (questions.length === 0) return null;
  
  const question = questions[currentIndex];
  const diff = difficultyConfig[question.difficulty] ?? difficultyConfig['中階'];

  const handleOptionSelect = useCallback((opt: string) => {
    if (!showResult) {
      onSelectOption(opt);
    }
  }, [showResult, onSelectOption]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/40 border border-white/10 p-6 md:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
        {/* Background suit decoration */}
        <div className="absolute -top-4 -right-4 text-[140px] text-white/[0.02] font-black select-none pointer-events-none" aria-hidden="true">♦</div>

        {/* 題目資訊 */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {question.category}
            </span>
            <span className={cn(
              "border px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1",
              diff.color
            )}>
              <Zap className="w-2.5 h-2.5" />
              {diff.label}
            </span>
          </div>
          <span className="text-slate-500 text-xs font-mono bg-white/5 px-3 py-1 rounded-full">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* 題目 */}
        <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-8">
          {question.question}
        </h2>

        {/* 選項 */}
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(question.options).map(([key, text]) => (
            <button
              key={key}
              onClick={() => handleOptionSelect(key)}
              className={cn(
                "w-full p-4 md:p-5 rounded-2xl text-left font-semibold transition-all border-2 flex justify-between items-center gap-3 group",
                showResult
                  ? (key === question.answer
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                    : (selectedOption === key
                      ? "bg-red-500/15 border-red-500 text-red-400"
                      : "bg-white/3 border-white/5 text-slate-500"))
                  : (selectedOption === key
                    ? "bg-blue-500/20 border-blue-500 text-white scale-[1.01]"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-blue-500/60 hover:text-white hover:scale-[1.01]")
              )}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors",
                  showResult && key === question.answer
                    ? "bg-emerald-500 text-white"
                    : showResult && selectedOption === key
                    ? "bg-red-500 text-white"
                    : "bg-white/10 text-slate-400"
                )}>
                  {key}
                </span>
                <span className="leading-snug">{text}</span>
              </span>
              {showResult && key === question.answer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {showResult && selectedOption === key && key !== question.answer && (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* 解析 */}
        {showResult && (
          <div className="mt-8 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-2 text-blue-400 mb-3 font-black uppercase text-xs tracking-widest">
              <AlertCircle className="w-4 h-4" /> 規則解析
            </div>
            <p className="text-blue-100/90 text-sm leading-relaxed whitespace-pre-line">
              {question.explanation}
            </p>
            <button
              onClick={onNext}
              className="mt-5 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-black uppercase text-xs shadow-lg hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              下一題練習 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

QuizGame.displayName = 'QuizGame';