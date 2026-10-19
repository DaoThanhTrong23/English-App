export const mockGameItem = {
  id: 1,
  name: "Bong bóng từ vựng",
  code: "bubble_burst",
  description: "Trò chơi ghép bóng",
  thumbnailUrl: "/games/bubble.png",
  settings: [
    { difficulty: "EASY", itemCount: 6, pointsPerItem: 10, timeLimit: 60 },
    { difficulty: "HARD", itemCount: 10, pointsPerItem: 20, timeLimit: 40 },
  ],
};

export const mockGameWord = {
  id: 1,
  headword: "computer",
  meaning: "máy vi tính",
  partOfSpeech: "noun",
  phonetic: "/kəmˈpjuː.tər/",
  audioUrl: "https://example.com/audio.mp3",
  imageUrl: "https://example.com/image.png",
};

export const mockGameHistory = {
  id: 1,
  userId: 1,
  gameCode: "bubble_burst",
  score: 100,
  duration: 45,
  correctPairs: 10,
  totalPairs: 10,
  createdAt: new Date(),
};
