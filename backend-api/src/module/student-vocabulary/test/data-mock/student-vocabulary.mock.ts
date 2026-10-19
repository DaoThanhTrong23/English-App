export const mockWord = {
  id: 10,
  headword: "resilience",
  partOfSpeech: "noun",
  cefrLevel: "C1",
  phonetic: "/rɪˈzɪliəns/",
  audioUrl: null,
  imageUrl: null,
  meaning: "Khả năng phục hồi nhanh chóng",
  exampleSentence: "Courage and resilience are key.",
  createdAt: new Date(),
};

export const mockUserProgress = {
  id: 1,
  userId: 1,
  wordId: 10,
  status: "learning" as const,
  memoryLevel: 2,
  nextReviewDate: new Date(Date.now() - 10000), // đã quá hạn
  createdAt: new Date(),
  updatedAt: new Date(),
  word: mockWord,
};
