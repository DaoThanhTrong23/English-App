export const mockBubbleWords = [
  {
    id: 1,
    headword: "apple",
    meaning: "quả táo",
    partOfSpeech: "noun",
    phonetic: "/ˈæp.əl/",
    audioUrl: "https://example.com/apple.mp3",
    imageUrl: "https://example.com/apple.png",
  },
  {
    id: 2,
    headword: "banana",
    meaning: "quả chuối",
    partOfSpeech: "noun",
    phonetic: "/bəˈnæn.ə/",
    audioUrl: "https://example.com/banana.mp3",
    imageUrl: "https://example.com/banana.png",
  },
  {
    id: 3,
    headword: "orange",
    meaning: "quả cam",
    partOfSpeech: "noun",
    phonetic: "/ˈɒr.ɪndʒ/",
    audioUrl: "https://example.com/orange.mp3",
    imageUrl: "https://example.com/orange.png",
  },
  {
    id: 4,
    headword: "grape",
    meaning: "quả nho",
    partOfSpeech: "noun",
    phonetic: "/ɡreɪp/",
    audioUrl: "https://example.com/grape.mp3",
    imageUrl: "https://example.com/grape.png",
  },
];

export const mockMatchPairInput = {
  currentScore: 20,
  matchedPairs: 2,
  totalPairs: 4,
  lessonId: 1,
};

export const mockFinishGameInput = {
  totalScore: 40,
  duration: 35,
  correctPairs: 4,
  totalPairs: 4,
  lessonId: 1,
};
