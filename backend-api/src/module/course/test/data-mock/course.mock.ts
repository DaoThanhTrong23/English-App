export const mockCourseItem = {
  id: 1,
  topicId: 1,
  title: "Bài học 1: Chào hỏi",
  description: "Mô tả bài học",
  cefrLevel: "A1",
  thumbnailUrl: null,
  createdAt: new Date(),
  deletedAt: null,
  _count: { lessonWords: 5 },
  lessonWords: [],
};

export const mockCreateCourseInput = {
  title: "Bài học 2: Gia đình",
  description: "Từ vựng về gia đình",
  cefrLevel: "A1",
  topicId: 1,
  wordIds: [1, 2],
};
