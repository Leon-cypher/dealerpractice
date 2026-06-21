import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ChevronDown,
  PlayCircle, RefreshCw, Award, Target, FileText,
  AlertCircle, CheckCircle2, XCircle, LogIn,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import {
  collection, addDoc, getDocs,
  query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../utils/cn';
import { useExamGame } from '../hooks/useExamGame';
import { useAuth } from '../hooks/useAuth';
import { useGameAuth } from '../hooks/useGameAuth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { InAppBrowserWarningModal } from '../components/InAppBrowserWarningModal';
import { useAchievements } from '../hooks/useAchievements';
import { useAchievementToast } from '../hooks/useAchievementToast';
import { AchievementToast } from '../components/AchievementToast';
import type { ExamResult, CategoryStat } from '../hooks/useExamGame';
import type { Question } from '../utils/quizData';
import { EXAM_PASS_THRESHOLD } from '../utils/quizLogic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamRecord {
  id: string;
  user_id: string;
  nickname: string;
  score: number;
  passed: boolean;
  correct_count: number;
  total_count: number;
  created_at: Timestamp | null;
}

function formatDate(ts: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Login Gate ───────────────────────────────────────────────────────────────

function LoginGateScreen() {
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const gameAuth = useGameAuth(showToast);
  const [signingIn, setSigningIn] = useState(false);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await gameAuth.handleGoogleLogin();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 flex flex-col">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <InAppBrowserWarningModal
        isOpen={gameAuth.inAppBrowserWarning.isOpen}
        onCopyUrl={gameAuth.copyUrlToClipboard}
        onProceed={gameAuth.proceedWithInAppLogin}
        onClose={gameAuth.inAppBrowserWarning.close}
      />
      <button
        onClick={() => navigate('/test-mode')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> 返回測驗選擇
      </button>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-sm w-full bg-slate-800/50 border border-white/10 rounded-3xl p-8 text-center">
          <div className="p-4 bg-yellow-400/15 rounded-2xl inline-flex mb-6">
            <LogIn className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black mb-2">登入以開始考試</h2>
          <p className="text-slate-400 text-sm mb-6">
            登入後才能儲存考試成績與查看歷史紀錄
          </p>
          <button
            onClick={handleLogin}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900
                       py-3.5 rounded-2xl font-black hover:bg-slate-100
                       disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {signingIn
              ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <FcGoogle className="w-5 h-5" />
            }
            使用 Google 登入
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
      <Icon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-black text-white">{value}</div>
    </div>
  );
}

interface ExamIntroScreenProps {
  onStart: () => void;
  history: ExamRecord[];
  historyLoading: boolean;
}

function ExamIntroScreen({ onStart, history, historyLoading }: ExamIntroScreenProps) {
  const navigate = useNavigate();
  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/test-mode')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> 返回測驗選擇
        </button>

        <h1 className="text-4xl md:text-5xl font-black text-yellow-400 mb-1">測驗模式</h1>
        <p className="text-slate-400 mb-8">荷官規則認證模擬考試</p>

        <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatTile icon={FileText} label="題目數量" value="50 題" />
            <StatTile icon={Award} label="每題分值" value="2 分" />
            <StatTile icon={Target} label="滿分" value="100 分" />
            <StatTile icon={CheckCircle2} label="及格標準" value="90 分" />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <h3 className="text-amber-400 font-black mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 考試須知
            </h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• 從 110 題題庫隨機抽取 50 題</li>
              <li>• 答題過程中不顯示對錯，交卷後統一公布</li>
              <li>• 可自由前後瀏覽題目並更改答案</li>
              <li>• 未作答題目自動計 0 分</li>
              <li>• 達到 90 分（45 題正確）視為通過</li>
            </ul>
          </div>

          {/* History */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">考試紀錄</h3>
            {historyLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-2">尚無考試紀錄</p>
            ) : (
              <div className="space-y-3">
                {bestScore !== null && (
                  <div className="flex items-center justify-between p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                    <span className="text-xs text-slate-400 font-semibold">最高分</span>
                    <span className="text-lg font-black text-yellow-400">{bestScore} 分</span>
                  </div>
                )}
                <div className="space-y-2 pt-1">
                  {history.slice(0, 3).map(record => (
                    <div key={record.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 shrink-0">{formatDate(record.created_at)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{record.score} 分</span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-bold',
                          record.passed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        )}>
                          {record.passed ? '通過' : '未通過'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900
                       py-4 rounded-2xl font-black text-lg shadow-lg
                       hover:from-yellow-300 hover:to-yellow-400
                       hover:scale-[1.02] transition-all duration-300
                       flex items-center justify-center gap-3"
          >
            <PlayCircle className="w-6 h-6" />
            開始測驗
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Exam Screen ──────────────────────────────────────────────────────────────

interface ExamQuestionScreenProps {
  questions: Question[];
  currentIdx: number;
  currentQuestion: Question;
  selectedForCurrent: string | null;
  selections: Record<number, string>;
  answeredCount: number;
  isLastQuestion: boolean;
  onSelect: (opt: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onJumpTo: (idx: number) => void;
  onSubmit: () => void;
}

function ExamQuestionScreen({
  questions, currentIdx, currentQuestion, selectedForCurrent,
  selections, answeredCount, isLastQuestion,
  onSelect, onNext, onPrev, onJumpTo, onSubmit,
}: ExamQuestionScreenProps) {
  const navigate = useNavigate();
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const total = questions.length;
  const unansweredCount = total - answeredCount;

  const difficultyColor: Record<string, string> = {
    '初階': 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    '中階': 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    '高階': 'text-red-400 bg-red-500/15 border-red-500/30',
    '進階': 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    '地獄': 'text-pink-400 bg-pink-500/15 border-pink-500/30',
  };

  const handleSubmitClick = () => {
    if (unansweredCount > 0) {
      setShowSubmitWarning(true);
    } else {
      onSubmit();
    }
  };

  const showSubmit = isLastQuestion || answeredCount === total;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
          <div className="bg-slate-800 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-2">確定要退出測驗？</h3>
            <p className="text-slate-400 text-sm mb-6">
              目前的作答進度將不會保存，也不會計入成績。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/test-mode')}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-400 transition-colors"
              >
                退出測驗
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black text-sm hover:bg-white/20 transition-colors"
              >
                繼續作答
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors text-sm font-semibold shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> 退出
          </button>
          <span className="text-sm text-slate-300 font-semibold">第 {currentIdx + 1} / {total} 題</span>
          <span className="text-sm text-slate-400 shrink-0">
            已作答 <span className="text-yellow-400 font-black">{answeredCount}</span>/{total}
          </span>
        </div>
        <div className="max-w-2xl mx-auto mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-8">
        {/* Answer map grid */}
        <div className="grid grid-cols-10 gap-1.5 my-5">
          {questions.map((q, idx) => {
            const isAnswered = selections[q.id] !== undefined;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => onJumpTo(idx)}
                className={cn(
                  'h-8 rounded-lg text-xs font-black transition-all',
                  isCurrent
                    ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900 bg-yellow-400 text-slate-900'
                    : isAnswered
                    ? 'bg-yellow-400/25 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-400/40'
                    : 'bg-white/5 text-slate-500 border border-white/10 hover:border-white/30 hover:text-slate-300'
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-6 mb-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full border border-white/10">
              {currentQuestion.category}
            </span>
            <span className={cn(
              'text-xs px-2.5 py-1 rounded-full border font-bold',
              difficultyColor[currentQuestion.difficulty] ?? 'text-slate-400 bg-white/5 border-white/10'
            )}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <p className="text-white font-semibold leading-relaxed mb-6 text-base md:text-lg">
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, text]) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={cn(
                  'w-full p-4 rounded-2xl text-left font-semibold transition-all border-2 flex items-center gap-3 text-sm md:text-base',
                  selectedForCurrent === key
                    ? 'bg-yellow-400/15 border-yellow-400 text-white scale-[1.01]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/30 hover:text-white hover:scale-[1.005]'
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0',
                  selectedForCurrent === key ? 'bg-yellow-400 text-slate-900' : 'bg-white/10 text-slate-400'
                )}>
                  {key}
                </span>
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Submit warning */}
        {showSubmitWarning && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4 animate-in fade-in duration-200">
            <p className="text-amber-300 text-sm font-bold mb-3">
              ⚠ 尚有 {unansweredCount} 題未作答，未作答題將計 0 分
            </p>
            <div className="flex gap-3">
              <button
                onClick={onSubmit}
                className="flex-1 bg-amber-500 text-slate-900 py-2.5 rounded-xl font-black text-sm hover:bg-amber-400 transition-colors"
              >
                確認交卷
              </button>
              <button
                onClick={() => setShowSubmitWarning(false)}
                className="flex-1 bg-white/10 text-white py-2.5 rounded-xl font-black text-sm hover:bg-white/20 transition-colors"
              >
                繼續作答
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10
                       text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> 上一題
          </button>

          {showSubmit ? (
            <button
              onClick={handleSubmitClick}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500
                         text-slate-900 font-black text-sm hover:from-yellow-300 hover:to-yellow-400
                         hover:scale-[1.02] transition-all shadow-lg"
            >
              交卷
            </button>
          ) : (
            <div className="flex-1" />
          )}

          <button
            onClick={onNext}
            disabled={isLastQuestion}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10
                       text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            下一題 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function CategoryRow({ stat }: { stat: CategoryStat }) {
  const pct = Math.round((stat.correct / stat.total) * 100);
  const color = pct === 100 ? 'text-emerald-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400';
  const barColor = pct === 100 ? 'bg-emerald-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <span className="flex-1 text-sm text-slate-300 font-medium min-w-0 truncate">{stat.category}</span>
      <span className="text-xs text-slate-500 tabular-nums w-10 text-right shrink-0">{stat.correct}/{stat.total}</span>
      <span className={cn('text-xs font-black tabular-nums w-10 text-right shrink-0', color)}>{pct}%</span>
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
        <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type SaveStatus = 'saving' | 'saved' | 'error';

interface ExamResultsScreenProps {
  result: ExamResult;
  wrongQuestions: Array<{ question: Question; selected: string }>;
  saveStatus: SaveStatus;
  onRestart: () => void;
}

function ExamResultsScreen({ result, wrongQuestions, saveStatus, onRestart }: ExamResultsScreenProps) {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-yellow-400 mb-4">測驗結果</h1>

        {/* Save status */}
        <div className="flex justify-center mb-4 h-6">
          {saveStatus === 'saving' && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
              儲存成績中...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 成績已儲存
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> 儲存失敗，請稍後再試
            </span>
          )}
        </div>

        {/* Pass/Fail banner */}
        <div className={cn(
          'rounded-3xl p-8 text-center mb-6 border-2',
          result.passed ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-red-500/15 border-red-500/50'
        )}>
          <div className="text-5xl mb-3">{result.passed ? '🎉' : '😔'}</div>
          <div className={cn('text-3xl font-black mb-2', result.passed ? 'text-emerald-400' : 'text-red-400')}>
            {result.passed ? '恭喜通過！' : '未達及格標準'}
          </div>
          <div className="text-slate-400 text-sm">及格標準：{EXAM_PASS_THRESHOLD} 分（45 題正確）</div>
        </div>

        {/* Score tiles */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">總分</div>
            <div className="text-5xl font-black text-yellow-400">{result.score}</div>
            <div className="text-slate-500 text-sm">/ 100</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">答對題數</div>
            <div className="text-5xl font-black text-white">{result.correctCount}</div>
            <div className="text-slate-500 text-sm">/ {result.totalCount}</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-300">各類別成績</h3>
          </div>
          <div className="divide-y divide-white/5">
            {result.categoryStats.map(stat => <CategoryRow key={stat.category} stat={stat} />)}
          </div>
        </div>

        {/* Wrong answer review */}
        {wrongQuestions.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setReviewOpen(prev => !prev)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10
                         rounded-2xl px-5 py-4 text-sm font-bold hover:bg-white/10 transition-colors"
            >
              <span>查看錯題解析（{wrongQuestions.length} 題）</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', reviewOpen && 'rotate-180')} />
            </button>

            {reviewOpen && (
              <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {wrongQuestions.map(({ question, selected }) => (
                  <div key={question.id} className="bg-black/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex gap-2 items-center mb-3">
                      <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">錯誤</span>
                      <span className="text-xs text-slate-500">{question.category}</span>
                    </div>
                    <p className="text-sm text-white font-semibold mb-4 leading-relaxed">{question.question}</p>
                    <div className="space-y-2 mb-4">
                      {Object.entries(question.options).map(([key, text]) => (
                        <div
                          key={key}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl text-sm border',
                            key === question.answer
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                              : key === selected
                              ? 'bg-red-500/15 border-red-500/50 text-red-400'
                              : 'bg-white/3 border-white/5 text-slate-600'
                          )}
                        >
                          <span className={cn(
                            'w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0',
                            key === question.answer ? 'bg-emerald-500 text-white'
                            : key === selected ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-slate-500'
                          )}>
                            {key}
                          </span>
                          <span className="flex-1">{text}</span>
                          {key === question.answer && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 text-emerald-400" />}
                          {key === selected && key !== question.answer && <XCircle className="w-4 h-4 ml-auto shrink-0 text-red-400" />}
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> 規則解析
                      </div>
                      <p className="text-xs text-blue-100/80 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/10
                     text-white py-4 rounded-2xl font-black hover:bg-white/15 hover:border-white/20
                     transition-all duration-300 hover:scale-[1.01]"
        >
          <RefreshCw className="w-5 h-5" /> 重新測驗
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function TestModePage() {
  const { user, profile, loading } = useAuth();
  const exam = useExamGame();

  const { notifications: achievementNotifications, showAchievement, dismissAchievement } = useAchievementToast();
  const achievements = useAchievements(user?.uid, showAchievement);

  const [history, setHistory] = useState<ExamRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saving');
  const savedRef = useRef(false);

  // Fetch history when user is on intro screen
  useEffect(() => {
    if (!user || exam.phase !== 'intro') return;
    setHistoryLoading(true);
    const q = query(
      collection(db, 'exam_records'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    getDocs(q)
      .then(snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamRecord))))
      .catch(() => { /* index not ready yet — silently skip */ })
      .finally(() => setHistoryLoading(false));
  }, [user, exam.phase]);

  // Save record once when results appear
  useEffect(() => {
    if (!exam.result || !user || savedRef.current) return;
    savedRef.current = true;
    setSaveStatus('saving');

    addDoc(collection(db, 'exam_records'), {
      user_id: user.uid,
      nickname: profile?.nickname || user.displayName || '匿名',
      score: exam.result.score,
      passed: exam.result.passed,
      correct_count: exam.result.correctCount,
      total_count: exam.result.totalCount,
      category_stats: exam.result.categoryStats,
      created_at: serverTimestamp(),
    })
      .then(() => {
        setSaveStatus('saved');
        if (exam.result) {
          achievements.recordExamResult({ score: exam.result.score });
        }
      })
      .catch(() => setSaveStatus('error'));
  }, [exam.result, user, profile]);

  // Reset saved flag when restarting
  const handleRestart = () => {
    savedRef.current = false;
    exam.restartExam();
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login gate
  if (!user) return <LoginGateScreen />;

  if (exam.phase === 'intro') {
    return (
      <ExamIntroScreen
        onStart={exam.startExam}
        history={history}
        historyLoading={historyLoading}
      />
    );
  }

  if (exam.phase === 'exam' && exam.currentQuestion) {
    return (
      <ExamQuestionScreen
        questions={exam.questions}
        currentIdx={exam.currentIdx}
        currentQuestion={exam.currentQuestion}
        selectedForCurrent={exam.selectedForCurrent}
        selections={exam.selections}
        answeredCount={exam.answeredCount}
        isLastQuestion={exam.isLastQuestion}
        onSelect={exam.selectOption}
        onNext={exam.goNext}
        onPrev={exam.goPrev}
        onJumpTo={exam.jumpTo}
        onSubmit={exam.submitExam}
      />
    );
  }

  if (exam.phase === 'results' && exam.result) {
    return (
      <>
        <AchievementToast notifications={achievementNotifications} onDismiss={dismissAchievement} />
        <ExamResultsScreen
          result={exam.result}
          wrongQuestions={exam.wrongQuestions}
          saveStatus={saveStatus}
          onRestart={handleRestart}
        />
      </>
    );
  }

  return null;
}
