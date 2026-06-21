import { useState, useCallback, useMemo } from 'react';
import type { Question } from '../utils/quizData';
import {
  getExamQuestions,
  EXAM_QUESTION_COUNT,
  EXAM_POINTS_PER_QUESTION,
  EXAM_PASS_THRESHOLD,
} from '../utils/quizLogic';

export type ExamPhase = 'intro' | 'exam' | 'results';

export interface ExamAnswer {
  questionId: number;
  selected: string;
  isCorrect: boolean;
  category: string;
}

export interface CategoryStat {
  category: string;
  total: number;
  correct: number;
}

export interface ExamResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  categoryStats: CategoryStat[];
  answers: ExamAnswer[];
}

export function useExamGame() {
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ExamResult | null>(null);

  const currentQuestion = questions[currentIdx] ?? null;
  const selectedForCurrent = currentQuestion ? (selections[currentQuestion.id] ?? null) : null;
  const isLastQuestion = currentIdx === EXAM_QUESTION_COUNT - 1;
  const answeredCount = Object.keys(selections).length;

  const startExam = useCallback(() => {
    setQuestions(getExamQuestions());
    setCurrentIdx(0);
    setSelections({});
    setResult(null);
    setPhase('exam');
  }, []);

  const selectOption = useCallback((option: string) => {
    if (!currentQuestion) return;
    setSelections(prev => ({ ...prev, [currentQuestion.id]: option }));
  }, [currentQuestion]);

  const goNext = useCallback(() => {
    setCurrentIdx(prev => Math.min(prev + 1, EXAM_QUESTION_COUNT - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIdx(prev => Math.max(prev - 1, 0));
  }, []);

  const jumpTo = useCallback((idx: number) => {
    setCurrentIdx(idx);
  }, []);

  const submitExam = useCallback(() => {
    const answers: ExamAnswer[] = questions.map(q => {
      const selected = selections[q.id] ?? '';
      return {
        questionId: q.id,
        selected,
        isCorrect: selected === q.answer,
        category: q.category,
      };
    });

    const correctCount = answers.filter(a => a.isCorrect).length;
    const score = correctCount * EXAM_POINTS_PER_QUESTION;

    const categoryMap: Record<string, { total: number; correct: number }> = {};
    for (const a of answers) {
      if (!categoryMap[a.category]) categoryMap[a.category] = { total: 0, correct: 0 };
      categoryMap[a.category].total += 1;
      if (a.isCorrect) categoryMap[a.category].correct += 1;
    }
    const categoryStats: CategoryStat[] = Object.entries(categoryMap)
      .map(([category, { total, correct }]) => ({ category, total, correct }))
      .sort((a, b) => b.total - a.total);

    setResult({
      score,
      passed: score >= EXAM_PASS_THRESHOLD,
      correctCount,
      totalCount: EXAM_QUESTION_COUNT,
      categoryStats,
      answers,
    });
    setPhase('results');
  }, [questions, selections]);

  const restartExam = useCallback(() => {
    setPhase('intro');
    setQuestions([]);
    setCurrentIdx(0);
    setSelections({});
    setResult(null);
  }, []);

  const wrongQuestions = useMemo(() => {
    if (!result) return [];
    return result.answers
      .filter(a => !a.isCorrect)
      .map(a => ({
        question: questions.find(q => q.id === a.questionId)!,
        selected: a.selected,
      }));
  }, [result, questions]);

  return {
    phase,
    questions,
    currentIdx,
    currentQuestion,
    selections,
    selectedForCurrent,
    isLastQuestion,
    answeredCount,
    result,
    wrongQuestions,
    startExam,
    selectOption,
    goNext,
    goPrev,
    jumpTo,
    submitExam,
    restartExam,
  };
}
