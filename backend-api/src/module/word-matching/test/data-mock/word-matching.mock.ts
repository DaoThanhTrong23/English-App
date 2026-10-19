export const mockWordMatchingWords = [
  {
    id: 1,
    headword: "pen",
    meaning: "cây bút mực",
    partOfSpeech: "noun",
    phonetic: "/pen/",
    audioUrl: "https://example.com/pen.mp3",
    imageUrl: "https://example.com/pen.png",
  },
  {
    id: 2,
    headword: "book",
    meaning: "quyển sách",
    partOfSpeech: "noun",
    phonetic: "/bʊk/",
    audioUrl: "https://example.com/book.mp3",
    imageUrl: "https://example.com/book.png",
  },
  {
    id: 3,
    headword: "table",
    meaning: "cái bàn",
    partOfSpeech: "noun",
    phonetic: "/ˈteɪbl/",
    audioUrl: "https://example.com/table.mp3",
    imageUrl: "https://example.com/table.png",
  },
  {
    id: 4,
    headword: "chair",
    meaning: "cái ghế",
    partOfSpeech: "noun",
    phonetic: "/tʃeər/",
    audioUrl: "https://example.com/chair.mp3",
    imageUrl: "https://example.com/chair.png",
  },
];

export const mockSubmitWordMatchingInput = {
  duration: 30,
  lessonId: 1,
  answers: [
    { wordId: 1, selectedMeaningId: 1 },
    { wordId: 2, selectedMeaningId: 2 },
    { wordId: 3, selectedMeaningId: 4 }, // wrong
  ],
};

export const mockSaveWordMatchingProgressInput = {
  currentMatchedPairs: 2,
  totalPairs: 4,
  connectedPairs: [
    { wordId: 1, selectedMeaningId: 1 },
    { wordId: 2, selectedMeaningId: 2 },
  ],
  lessonId: 1,
};
