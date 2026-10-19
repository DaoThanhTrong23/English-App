export const mockEssayEvaluation = {
  overallScore: 7.5,
  cefrLevel: "B2",
  grammarScore: 7.0,
  vocabularyScore: 8.0,
  feedback: "Bài viết mạch lạc, từ vựng phong phú.",
  strengths: ["Cấu trúc câu đa dạng", "Từ vựng học thuật tốt"],
  improvements: ["Chú ý mạo từ 'the' và 'a'"],
  corrections: [
    {
      original: "He go to school",
      issue: "Sai chia động từ ở ngôi thứ ba số ít",
      suggestion: "He goes to school",
    },
  ],
  improvedVersion: "He goes to school every morning with his friends.",
};

export const mockSpeakingEvaluation = {
  transcript: "Hello, my name is John and I live in Hanoi.",
  overallScore: 8.0,
  cefrLevel: "B2",
  grammarScore: 8.0,
  vocabularyScore: 8.0,
  coherenceScore: 8.0,
  feedback: "Phát âm rõ ràng, nhịp điệu tự nhiên.",
  strengths: ["Lưu loát", "Trọng âm từ đúng"],
  improvements: ["Lưu ý âm đuôi /s/"],
  corrections: [],
  improvedVersion: "Hello, my name is John and I reside in Hanoi.",
};

export const mockPronunciationGOP = {
  targetWord: "hello",
  targetIpa: "həˈloʊ",
  spokenText: "hello",
  overallScore: 92,
  isCorrect: true,
  feedback: "Phát âm rất chuẩn xác!",
  phonemes: [
    { phoneme: "h", score: 95, status: "correct", heardAs: "h", feedback: "Tốt" },
    { phoneme: "ə", score: 90, status: "correct", heardAs: "ə", feedback: "Tốt" },
    { phoneme: "l", score: 92, status: "correct", heardAs: "l", feedback: "Tốt" },
    { phoneme: "oʊ", score: 91, status: "correct", heardAs: "oʊ", feedback: "Tốt" },
  ],
};

export const mockChatResponse = {
  response: "Hello! How can I help you practice English today?",
  sessionId: 123,
};
