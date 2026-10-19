export const mockMemoryWords = [
  {
    id: 1,
    headword: "sun",
    meaning: "mặt trời",
    partOfSpeech: "noun",
    phonetic: "/sʌn/",
    audioUrl: "https://example.com/sun.mp3",
    imageUrl: "https://example.com/sun.png",
  },
  {
    id: 2,
    headword: "moon",
    meaning: "mặt trăng",
    partOfSpeech: "noun",
    phonetic: "/muːn/",
    audioUrl: "https://example.com/moon.mp3",
    imageUrl: "https://example.com/moon.png",
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
    headword: "earth",
    meaning: "trái đất",
    partOfSpeech: "noun",
    phonetic: "/ɜːθ/",
    audioUrl: "https://example.com/earth.mp3",
    imageUrl: "https://example.com/earth.png",
  },
  {
    id: 5,
    headword: "sky",
    meaning: "bầu trời",
    partOfSpeech: "noun",
    phonetic: "/skaɪ/",
    audioUrl: "https://example.com/sky.mp3",
    imageUrl: "https://example.com/sky.png",
  },
  {
    id: 6,
    headword: "cloud",
    meaning: "đám mây",
    partOfSpeech: "noun",
    phonetic: "/klaʊd/",
    audioUrl: "https://example.com/cloud.mp3",
    imageUrl: "https://example.com/cloud.png",
  },
];

export const mockSaveMemoryProgressInput = {
  currentScore: 30,
  matchedPairs: 3,
  totalPairs: 6,
  turns: 8,
  lessonId: 1,
};

export const mockFinishMemoryInput = {
  totalScore: 60,
  duration: 45,
  turns: 12,
  correctPairs: 6,
  totalPairs: 6,
  lessonId: 1,
};
