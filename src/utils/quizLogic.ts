import { QUIZ_DATA, Question } from './quizData';

export function getRandomQuestions(count: number = 50): Question[] {
  const shuffled = [...QUIZ_DATA].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, QUIZ_DATA.length));
}

export function getQuestionById(id: number): Question | undefined {
  return QUIZ_DATA.find(q => q.id === id);
}
