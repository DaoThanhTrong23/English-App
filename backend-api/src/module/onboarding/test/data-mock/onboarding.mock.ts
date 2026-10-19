export const mockOnboardingQuestions = [
  {
    id: 1,
    quesionText: "She _____ to school every day.",
    questionType: "multiple_choice" as const,
    points: 10,
    difficultyElo: 1000,
    skillCategory: "Grammar",
    answers: [
      { id: 101, answerText: "goes", isCorrect: true },
      { id: 102, answerText: "go", isCorrect: false },
      { id: 103, answerText: "going", isCorrect: false },
      { id: 104, answerText: "went", isCorrect: false },
    ],
  },
  {
    id: 2,
    quesionText: "What is the synonym of 'gigantic'?",
    questionType: "multiple_choice" as const,
    points: 10,
    difficultyElo: 1400,
    skillCategory: "Vocabulary",
    answers: [
      { id: 201, answerText: "Huge", isCorrect: true },
      { id: 202, answerText: "Tiny", isCorrect: false },
      { id: 203, answerText: "Weak", isCorrect: false },
      { id: 204, answerText: "Slow", isCorrect: false },
    ],
  },
];

export const mockUserAnswers = [
  { id: "1", answer: "goes", timeTakenMs: 3500 },
  { id: "2", answer: "Huge", timeTakenMs: 4000 },
];
