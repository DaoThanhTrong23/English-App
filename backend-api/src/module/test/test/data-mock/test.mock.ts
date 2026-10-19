export const mockTestItem = {
  id: 1,
  lessonId: 10,
  title: "Kiểm tra đầu vào B1",
  description: "Bài kiểm tra đánh giá năng lực",
  ceftLevel: "B1",
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: {
    questions: 5,
    userTestResults: 12,
  },
};

export const mockQuestionItem = {
  id: 1,
  testId: 1,
  quesionText: "What is the capital of France?",
  questionType: "multiple_choice",
  points: 10,
  difficultyElo: 1200,
  skillCategory: "Vocabulary",
  topic: "General",
  audioUrl: null,
  imageUrl: null,
  answers: [
    { id: 1, answerText: "Paris", isCorrect: true },
    { id: 2, answerText: "London", isCorrect: false },
    { id: 3, answerText: "Berlin", isCorrect: false },
    { id: 4, answerText: "Madrid", isCorrect: false },
  ],
};

export const mockCreateTestInput = {
  lessonId: 10,
  title: "Bài thi thử Toeic",
  description: "Toeic full test",
  ceftLevel: "B2",
};

export const mockCreateQuestionInput = {
  quesionText: "Choose the correct preposition: She is interested ___ music.",
  questionType: "multiple_choice",
  points: 10,
  difficultyElo: 1300,
  skillCategory: "Grammar",
  answers: [
    { answerText: "in", isCorrect: true },
    { answerText: "on", isCorrect: false },
    { answerText: "at", isCorrect: false },
  ],
};
