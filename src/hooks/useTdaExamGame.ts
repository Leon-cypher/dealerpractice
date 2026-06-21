import { useState, useCallback, useMemo } from 'react';
import type { TdaQuestion } from '../utils/tdaQuizData';
import {
  getTdaExamQuestions,
  TDA_EXAM_QUESTION_COUNT,
  TDA_EXAM_PASS_THRESHOLD,
} from '../utils/quizLogic';

export type TdaExamPhase = 'intro' | 'exam' | 'results';

export interface TdaExamAnswer {
  questionId: number;
  selected: string[];
  isCorrect: boolean;
}

export interface TdaExamResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  answers: TdaExamAnswer[];
}

export function useTdaExamGame() {
  const [phase, setPhase] = useState<TdaExamPhase>('intro');
  const [questions, setQuestions] = useState<TdaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<TdaExamResult | null>(null);

  const currentQuestion = questions[currentIdx] ?? null;
  const selectedForCurrent = currentQuestion ? (selections[currentQuestion.id] ?? []) : [];
  const isLastQuestion = currentIdx === TDA_EXAM_QUESTION_COUNT - 1;
  const answeredCount = Object.keys(selections).length;

  const startExam = useCallback(() => {
    setQuestions(getTdaExamQuestions());
    setCurrentIdx(0);
    setSelections({});
    setResult(null);
    setPhase('exam');
  }, []);

  const toggleOption = useCallback((option: string) => {
    if (!currentQuestion) return;
    setSelections(prev => {
      const current = prev[currentQuestion.id] ?? [];
      if (currentQuestion.multiSelect) {
        const next = current.includes(option)
          ? current.filter(o => o !== option)
          : [...current, option];
        return { ...prev, [currentQuestion.id]: next };
      }
      return { ...prev, [currentQuestion.id]: [option] };
    });
  }, [currentQuestion]);

  const goNext = useCallback(() => {
    setCurrentIdx(prev => Math.min(prev + 1, TDA_EXAM_QUESTION_COUNT - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIdx(prev => Math.max(prev - 1, 0));
  }, []);

  const jumpTo = useCallback((idx: number) => {
    setCurrentIdx(idx);
  }, []);

  const submitExam = useCallback(() => {
    const answers: TdaExamAnswer[] = questions.map(q => {
      const selected = selections[q.id] ?? [];
      const correctSet = new Set(q.answer.split(''));
      const selectedSet = new Set(selected);
      const isCorrect =
        correctSet.size === selectedSet.size &&
        [...correctSet].every(c => selectedSet.has(c));
      return {
        questionId: q.id,
        selected,
        isCorrect,
      };
    });

    const correctCount = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / TDA_EXAM_QUESTION_COUNT) * 100);

    setResult({
      score,
      passed: score >= TDA_EXAM_PASS_THRESHOLD,
      correctCount,
      totalCount: TDA_EXAM_QUESTION_COUNT,
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
    toggleOption,
    goNext,
    goPrev,
    jumpTo,
    submitExam,
    restartExam,
  };
}
