import { useState, useCallback } from 'react';
import { generateBlindsQuestion } from '../utils/blindsLogic';
import type { BlindsQuestion } from '../utils/blindsLogic';

export function useBlindsGame(generateFn: () => BlindsQuestion = generateBlindsQuestion) {
  const [question, setQuestion] = useState<BlindsQuestion | null>(null);
  const [userInput, setUserInput] = useState('');
  const [boolSelection, setBoolSelection] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const init = useCallback(() => {
    setQuestion(generateFn());
    setUserInput('');
    setBoolSelection(null);
    setShowResult(false);
    setIsCorrect(null);
  }, [generateFn]);

  const checkResult = useCallback((): boolean => {
    if (!question) return false;

    let correct: boolean;
    if (question.answerType === 'number') {
      const parsed = parseInt(userInput.replace(/\D/g, ''), 10);
      correct = parsed === (question.answer as number);
    } else {
      correct = boolSelection === (question.answer as boolean);
    }

    setIsCorrect(correct);
    setShowResult(true);
    return correct;
  }, [question, userInput, boolSelection]);

  return {
    question,
    userInput,
    boolSelection,
    showResult,
    isCorrect,
    init,
    checkResult,
    setUserInput,
    setBoolSelection,
  };
}
