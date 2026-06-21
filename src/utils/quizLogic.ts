import { QUIZ_DATA, Question } from './quizData';
import { TDA_QUIZ_DATA, TdaQuestion } from './tdaQuizData';

export function getRandomQuestions(count: number = 110): Question[] {
  const shuffled = [...QUIZ_DATA].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, QUIZ_DATA.length));
}

export function getQuestionById(id: number): Question | undefined {
  return QUIZ_DATA.find(q => q.id === id);
}

export const EXAM_QUESTION_COUNT = 50;
export const EXAM_POINTS_PER_QUESTION = 2;
export const EXAM_PASS_THRESHOLD = 90;

export function getExamQuestions(): Question[] {
  return getRandomQuestions(EXAM_QUESTION_COUNT);
}

export const TDA_EXAM_QUESTION_COUNT = 40;
export const TDA_EXAM_PASS_THRESHOLD = 90;

export function getTdaExamQuestions(): TdaQuestion[] {
  const shuffled = [...TDA_QUIZ_DATA].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(TDA_EXAM_QUESTION_COUNT, TDA_QUIZ_DATA.length));
}
