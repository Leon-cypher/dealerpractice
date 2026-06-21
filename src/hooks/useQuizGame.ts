import { useState, useCallback } from 'react';
import type { Question } from '../utils/quizData';
import * as QuizLogic from '../utils/quizLogic';

export function useQuizGame() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const init = useCallback(() => {
    setQuestions(QuizLogic.getRandomQuestions(110));
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowResult(false);
  }, []);

  // Returns true/false if answer is valid, null if already answered
  const selectOption = useCallback((opt: string): boolean | null => {
    if (showResult || questions.length === 0) return null;
    const q = questions[currentIdx];
    setSelectedOption(opt);
    setShowResult(true);
    return opt === q.answer;
  }, [showResult, questions, currentIdx]);

  const nextQuestion = useCallback(() => {
    setCurrentIdx(prev => (prev + 1) % questions.length);
    setSelectedOption(null);
    setShowResult(false);
  }, [questions.length]);

  return {
    questions,
    currentIdx,
    selectedOption,
    showResult,
    init,
    selectOption,
    nextQuestion,
  };
}
