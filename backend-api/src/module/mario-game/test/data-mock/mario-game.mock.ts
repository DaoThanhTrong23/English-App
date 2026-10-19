export const mockMarioWords = [
  {
    id: 1,
    headword: "jump",
    meaning: "nhảy",
    partOfSpeech: "verb",
    phonetic: "/dʒʌmp/",
    audioUrl: "https://example.com/jump.mp3",
    imageUrl: "https://example.com/jump.png",
  },
  {
    id: 2,
    headword: "run",
    meaning: "chạy",
    partOfSpeech: "verb",
    phonetic: "/rʌn/",
    audioUrl: "https://example.com/run.mp3",
    imageUrl: "https://example.com/run.png",
  },
  {
    id: 3,
    headword: "star",
    meaning: "ngôi sao",
    partOfSpeech: "noun",
    phonetic: "/stɑːr/",
    audioUrl: "https://example.com/star.mp3",
    imageUrl: "https://example.com/star.png",
  },
  {
    id: 4,
    headword: "castle",
    meaning: "lâu đài",
    partOfSpeech: "noun",
    phonetic: "/ˈkɑːsl/",
    audioUrl: "https://example.com/castle.mp3",
    imageUrl: "https://example.com/castle.png",
  },
];

export const mockMarioMatchPairInput = {
  currentScore: 50,
  matchedPairs: 2,
  totalPairs: 4,
  lessonId: 2,
};

export const mockMarioFinishGameInput = {
  totalScore: 100,
  duration: 40,
  correctPairs: 4,
  totalPairs: 4,
  lessonId: 2,
};
