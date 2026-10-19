export const mockStudentTest = {
  id: 1,
  title: "Mini Test Unit 1",
  description: "Kiểm tra sau bài 1",
  ceftLevel: "A1",
  questions: [
    {
      id: 101,
      testId: 1,
      quesionText: "She ___ a doctor.",
      questionType: "multiple_choice",
      points: 10,
      difficultyElo: 1000,
      skillCategory: "Grammar",
      answers: [
        { id: 1, answerText: "is", isCorrect: true },
        { id: 2, answerText: "are", isCorrect: false },
      ],
    },
    {
      id: 102,
      testId: 1,
      quesionText: "Điền từ: I live ___ Hanoi.",
      questionType: "fill_in_blank",
      points: 10,
      difficultyElo: 1100,
      skillCategory: "Vocabulary",
      answers: [
        { id: 3, answerText: "in", isCorrect: true },
      ],
    },
  ],
};

export const mockTestUser = {
  id: 1,
  username: "student_01",
  grammarElo: 1000,
  vocabElo: 1000,
  readingElo: 1000,
  listeningElo: 1000,
  cefrLevel: "A1",
  xpPoints: 100,
};

export const mockTestSubmission = [
  { questionId: 101, selectedAnswerId: 1, timeTakenMs: 4000 },
  { questionId: 102, textAnswer: "in", timeTakenMs: 6000 },
];
