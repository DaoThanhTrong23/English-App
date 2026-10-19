export const mockCourse = {
  id: 1,
  title: "English for Travel",
  description: "Travel vocab and phrases",
  cefrLevel: "A2",
  createdAt: new Date(),
  lessons: [
    { id: 101, title: "At the Airport", deletedAt: null },
    { id: 102, title: "Hotel Check-in", deletedAt: null },
  ],
};

export const mockLessonDetail = {
  id: 101,
  topicId: 1,
  title: "At the Airport",
  description: "Vocab at airport",
  content: "<p>Theory content</p>",
  videoUrl: "https://example.com/video.mp4",
  cefrLevel: "A2",
  thumbnailUrl: null,
  lessonWords: [],
  tests: [],
};
