import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ChevronDown,
  PlayCircle, RefreshCw, Award, Target, FileText,
  AlertCircle, CheckCircle2, XCircle, LogIn,
  Globe,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import {
  collection, addDoc, getDocs,
  query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../utils/cn';
import { useTdaExamGame } from '../hooks/useTdaExamGame';
import { useAuth } from '../hooks/useAuth';
import { useGameAuth } from '../hooks/useGameAuth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { InAppBrowserWarningModal } from '../components/InAppBrowserWarningModal';
import { useAchievements } from '../hooks/useAchievements';
import { useAchievementToast } from '../hooks/useAchievementToast';
import { AchievementToast } from '../components/AchievementToast';
import type { TdaExamResult } from '../hooks/useTdaExamGame';
import type { TdaQuestion } from '../utils/tdaQuizData';
import { TDA_EXAM_PASS_THRESHOLD, TDA_EXAM_QUESTION_COUNT } from '../utils/quizLogic';

interface TdaExamRecord {
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
          <div className="p-4 bg-cyan-400/15 rounded-2xl inline-flex mb-6">
            <LogIn className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black mb-2">登入以開始 TDA 測驗</h2>
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

function StatTile({ icon: Icon, label, value, color = 'text-cyan-400' }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
      <Icon className={cn('w-6 h-6 mx-auto mb-2', color)} />
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-black text-white">{value}</div>
    </div>
  );
}

interface TdaExamIntroScreenProps {
  onStart: () => void;
  history: TdaExamRecord[];
  historyLoading: boolean;
}

function TdaExamIntroScreen({ onStart, history, historyLoading }: TdaExamIntroScreenProps) {
  const navigate = useNavigate();
  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : null;
  const passCount = Math.ceil(TDA_EXAM_QUESTION_COUNT * TDA_EXAM_PASS_THRESHOLD / 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/test-mode')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> 返回測驗選擇
        </button>

        <h1 className="text-4xl md:text-5xl font-black text-cyan-400 mb-1">TDA 規則測驗</h1>
        <p className="text-slate-400 mb-8">TDA 官方題庫 · 中英對照 · 81 題隨機抽 40 題</p>

        <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatTile icon={FileText} label="題目數量" value={`${TDA_EXAM_QUESTION_COUNT} 題`} />
            <StatTile icon={Award} label="題庫來源" value="TDA 81題" />
            <StatTile icon={Target} label="滿分" value="100 分" />
            <StatTile icon={CheckCircle2} label="及格標準" value={`${TDA_EXAM_PASS_THRESHOLD} 分`} />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-amber-300 text-sm font-bold leading-relaxed">
              此 TDA 模擬題目部分答案可能不符合樂玩實際判決規則，有問題請洽 Leon
            </p>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5">
            <h3 className="text-cyan-400 font-black mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 考試須知
            </h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• 從 TDA 官方題庫 81 題隨機抽取 40 題</li>
              <li>• 題目包含中英文對照，方便理解原文題意</li>
              <li>• 部分題目為多選題，需選出所有正確答案</li>
              <li>• 答題過程中不顯示對錯，交卷後統一公布</li>
              <li>• 可自由前後瀏覽題目並更改答案</li>
              <li>• 未作答題目自動計 0 分</li>
              <li>• 達到 {TDA_EXAM_PASS_THRESHOLD} 分（{passCount} 題正確）視為通過</li>
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
                  <div className="flex items-center justify-between p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-xl">
                    <span className="text-xs text-slate-400 font-semibold">最高分</span>
                    <span className="text-lg font-black text-cyan-400">{bestScore} 分</span>
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
            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-900
                       py-4 rounded-2xl font-black text-lg shadow-lg
                       hover:from-cyan-300 hover:to-cyan-400
                       hover:scale-[1.02] transition-all duration-300
                       flex items-center justify-center gap-3"
          >
            <PlayCircle className="w-6 h-6" />
            開始 TDA 測驗
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Exam Screen ──────────────────────────────────────────────────────────────

interface TdaExamQuestionScreenProps {
  questions: TdaQuestion[];
  currentIdx: number;
  currentQuestion: TdaQuestion;
  selectedForCurrent: string[];
  selections: Record<number, string[]>;
  answeredCount: number;
  isLastQuestion: boolean;
  onToggle: (opt: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onJumpTo: (idx: number) => void;
  onSubmit: () => void;
}

function TdaExamQuestionScreen({
  questions, currentIdx, currentQuestion, selectedForCurrent,
  selections, answeredCount, isLastQuestion,
  onToggle, onNext, onPrev, onJumpTo, onSubmit,
}: TdaExamQuestionScreenProps) {
  const navigate = useNavigate();
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const total = questions.length;
  const unansweredCount = total - answeredCount;

  const handleSubmitClick = () => {
    if (unansweredCount > 0) {
      setShowSubmitWarning(true);
    } else {
      onSubmit();
    }
  };

  const showSubmit = isLastQuestion || answeredCount === total;
  const optionEntries = showEnglish
    ? Object.entries(currentQuestion.optionsEn)
    : Object.entries(currentQuestion.options);

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
            已作答 <span className="text-cyan-400 font-black">{answeredCount}</span>/{total}
          </span>
        </div>
        <div className="max-w-2xl mx-auto mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-8">
        {/* Answer map grid */}
        <div className="grid grid-cols-10 gap-1.5 my-5">
          {questions.map((q, idx) => {
            const isAnswered = selections[q.id] !== undefined && selections[q.id].length > 0;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => onJumpTo(idx)}
                className={cn(
                  'h-8 rounded-lg text-xs font-black transition-all',
                  isCurrent
                    ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900 bg-cyan-400 text-slate-900'
                    : isAnswered
                    ? 'bg-cyan-400/25 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/40'
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
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">
                TDA #{currentQuestion.id}
              </span>
              {currentQuestion.multiSelect && (
                <span className="text-xs bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/30 font-bold">
                  多選題
                </span>
              )}
            </div>
            <button
              onClick={() => setShowEnglish(prev => !prev)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-bold transition-all',
                showEnglish
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              {showEnglish ? 'English' : '中文'}
            </button>
          </div>

          <p className="text-white font-semibold leading-relaxed mb-2 text-base md:text-lg">
            {showEnglish ? currentQuestion.questionEn : currentQuestion.question}
          </p>
          {showEnglish && (
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {currentQuestion.question}
            </p>
          )}
          {!showEnglish && (
            <p className="text-slate-500 text-xs leading-relaxed mb-4 italic">
              {currentQuestion.questionEn}
            </p>
          )}

          <div className="space-y-3">
            {optionEntries.map(([key, text]) => {
              const isSelected = selectedForCurrent.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => onToggle(key)}
                  className={cn(
                    'w-full p-4 rounded-2xl text-left font-semibold transition-all border-2 flex items-center gap-3 text-sm md:text-base',
                    isSelected
                      ? 'bg-cyan-400/15 border-cyan-400 text-white scale-[1.01]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/30 hover:text-white hover:scale-[1.005]'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0',
                    isSelected ? 'bg-cyan-400 text-slate-900' : 'bg-white/10 text-slate-400'
                  )}>
                    {currentQuestion.multiSelect
                      ? (isSelected ? '✓' : key)
                      : key
                    }
                  </span>
                  <span className="flex-1 leading-snug">{text}</span>
                </button>
              );
            })}
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
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500
                         text-slate-900 font-black text-sm hover:from-cyan-300 hover:to-cyan-400
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

type SaveStatus = 'saving' | 'saved' | 'error';

interface TdaExamResultsScreenProps {
  result: TdaExamResult;
  wrongQuestions: Array<{ question: TdaQuestion; selected: string[] }>;
  saveStatus: SaveStatus;
  onRestart: () => void;
}

function TdaExamResultsScreen({ result, wrongQuestions, saveStatus, onRestart }: TdaExamResultsScreenProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const passCount = Math.ceil(TDA_EXAM_QUESTION_COUNT * TDA_EXAM_PASS_THRESHOLD / 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-cyan-400 mb-4">TDA 測驗結果</h1>

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
          <div className="text-slate-400 text-sm">及格標準：{TDA_EXAM_PASS_THRESHOLD} 分（{passCount} 題正確）</div>
        </div>

        {/* Score tiles */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">總分</div>
            <div className="text-5xl font-black text-cyan-400">{result.score}</div>
            <div className="text-slate-500 text-sm">/ 100</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">答對題數</div>
            <div className="text-5xl font-black text-white">{result.correctCount}</div>
            <div className="text-slate-500 text-sm">/ {result.totalCount}</div>
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
                {wrongQuestions.map(({ question, selected }) => {
                  const correctSet = new Set(question.answer.split(''));
                  return (
                    <div key={question.id} className="bg-black/30 border border-white/10 rounded-2xl p-5">
                      <div className="flex gap-2 items-center mb-3">
                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">錯誤</span>
                        <span className="text-xs text-slate-500">TDA #{question.id}</span>
                        {question.multiSelect && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">多選</span>
                        )}
                      </div>
                      <p className="text-sm text-white font-semibold mb-2 leading-relaxed">{question.question}</p>
                      <p className="text-xs text-slate-500 italic mb-4 leading-relaxed">{question.questionEn}</p>
                      <div className="space-y-2 mb-4">
                        {Object.entries(question.options).map(([key, text]) => {
                          const isCorrect = correctSet.has(key);
                          const wasSelected = selected.includes(key);
                          return (
                            <div
                              key={key}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl text-sm border',
                                isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                  : wasSelected
                                  ? 'bg-red-500/15 border-red-500/50 text-red-400'
                                  : 'bg-white/3 border-white/5 text-slate-600'
                              )}
                            >
                              <span className={cn(
                                'w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0',
                                isCorrect ? 'bg-emerald-500 text-white'
                                : wasSelected ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-slate-500'
                              )}>
                                {key}
                              </span>
                              <span className="flex-1">{text}</span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 text-emerald-400" />}
                              {wasSelected && !isCorrect && <XCircle className="w-4 h-4 ml-auto shrink-0 text-red-400" />}
                            </div>
                          );
                        })}
                      </div>
                      {/* English options for reference */}
                      <details className="group">
                        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1">
                          <Globe className="w-3 h-3" /> 查看英文選項
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {Object.entries(question.optionsEn).map(([key, text]) => (
                            <div key={key} className="text-xs text-slate-500 pl-4">
                              <span className="font-bold">{key}.</span> {text}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  );
                })}
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

export function TdaTestModePage() {
  const { user, profile, loading } = useAuth();
  const exam = useTdaExamGame();

  const { notifications: achievementNotifications, showAchievement, dismissAchievement } = useAchievementToast();
  const achievements = useAchievements(user?.uid, showAchievement);

  const [history, setHistory] = useState<TdaExamRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saving');
  const savedRef = useRef(false);

  useEffect(() => {
    if (!user || exam.phase !== 'intro') return;
    setHistoryLoading(true);
    const q = query(
      collection(db, 'tda_exam_records'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    getDocs(q)
      .then(snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as TdaExamRecord))))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [user, exam.phase]);

  useEffect(() => {
    if (!exam.result || !user || savedRef.current) return;
    savedRef.current = true;
    setSaveStatus('saving');

    addDoc(collection(db, 'tda_exam_records'), {
      user_id: user.uid,
      nickname: profile?.nickname || user.displayName || '匿名',
      score: exam.result.score,
      passed: exam.result.passed,
      correct_count: exam.result.correctCount,
      total_count: exam.result.totalCount,
      created_at: serverTimestamp(),
    })
      .then(() => {
        setSaveStatus('saved');
        if (exam.result) {
          achievements.recordExamResult({ score: exam.result.score });
        }
      })
      .catch((err) => {
        console.error('TDA 成績存檔失敗:', err);
        setSaveStatus('error');
      });
  }, [exam.result, user, profile]);

  const handleRestart = () => {
    savedRef.current = false;
    exam.restartExam();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginGateScreen />;

  if (exam.phase === 'intro') {
    return (
      <TdaExamIntroScreen
        onStart={exam.startExam}
        history={history}
        historyLoading={historyLoading}
      />
    );
  }

  if (exam.phase === 'exam' && exam.currentQuestion) {
    return (
      <TdaExamQuestionScreen
        questions={exam.questions}
        currentIdx={exam.currentIdx}
        currentQuestion={exam.currentQuestion}
        selectedForCurrent={exam.selectedForCurrent}
        selections={exam.selections}
        answeredCount={exam.answeredCount}
        isLastQuestion={exam.isLastQuestion}
        onToggle={exam.toggleOption}
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
        <TdaExamResultsScreen
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
