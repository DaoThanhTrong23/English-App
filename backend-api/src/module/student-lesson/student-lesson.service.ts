import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
import {
  StudentLessonRepository,
  studentLessonRepository,
} from "./student-lesson.repository.js";
import { GetStudentCoursesQueryInput } from "./student-lesson.schema.js";

export class StudentLessonService {
  constructor(
    private studentLessonRepo: StudentLessonRepository = studentLessonRepository
  ) {}

  /**
   * 1. Lấy danh sách khóa học / chủ đề cho học viên (có phân trang, tìm kiếm, lọc CEFR)
   */
  @logExecution()
  async getCoursesList(_userId: number, query: GetStudentCoursesQueryInput) {
    const { totalItems, courses } = await this.studentLessonRepo.findCourses(query);
    const totalPages = Math.ceil(totalItems / query.limit) || 1;

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      cefrLevel: course.cefrLevel,
      createdAt: course.createdAt,
      totalLessons: course.lessons.length,
    }));

    return {
      pagination: {
        currentPage: query.page,
        limit: query.limit,
        totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
      },
      items: formattedCourses,
    };
  }

  /**
   * 2. Lấy thông tin khóa học và danh sách bài học thuộc khóa học đó
   */
  @logExecution()
  async getCourseDetail(userId: number, courseId: number) {
    const course = await this.studentLessonRepo.findCourseById(courseId);
    if (!course) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học yêu cầu");
    }

    // Lấy thông tin bài học và trạng thái hoàn thành
    const lessonsWithStatus = await Promise.all(
      course.lessons.map(async (lesson) => {
        const isCompleted = await this.studentLessonRepo.hasCompletedLesson(userId, lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          cefrLevel: lesson.cefrLevel,
          thumbnailUrl: lesson.thumbnailUrl,
          videoUrl: lesson.videoUrl,
          createdAt: lesson.createdAt,
          totalWords: lesson._count.lessonWords,
          totalTests: lesson._count.tests,
          isCompleted,
        };
      })
    );

    const completedLessonsCount = lessonsWithStatus.filter((l) => l.isCompleted).length;
    const progressPercentage =
      lessonsWithStatus.length > 0
        ? Math.round((completedLessonsCount / lessonsWithStatus.length) * 100)
        : 0;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      cefrLevel: course.cefrLevel,
      totalLessons: lessonsWithStatus.length,
      completedLessons: completedLessonsCount,
      progressPercentage,
      lessons: lessonsWithStatus,
    };
  }

  /**
   * 2b. Lấy riêng danh sách bài học thuộc một khóa học
   */
  @logExecution()
  async getLessonsByCourse(userId: number, courseId: number) {
    const course = await this.studentLessonRepo.findCourseById(courseId);
    if (!course) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học yêu cầu");
    }

    const lessons = await this.studentLessonRepo.findLessonsByCourseId(courseId);

    const items = await Promise.all(
      lessons.map(async (lesson) => {
        const isCompleted = await this.studentLessonRepo.hasCompletedLesson(userId, lesson.id);
        return {
          id: lesson.id,
          topicId: lesson.topicId,
          title: lesson.title,
          description: lesson.description,
          cefrLevel: lesson.cefrLevel,
          thumbnailUrl: lesson.thumbnailUrl,
          videoUrl: lesson.videoUrl,
          createdAt: lesson.createdAt,
          totalWords: lesson._count.lessonWords,
          totalTests: lesson._count.tests,
          isCompleted,
        };
      })
    );

    return {
      course: {
        id: course.id,
        title: course.title,
        cefrLevel: course.cefrLevel,
      },
      lessons: items,
    };
  }

  /**
   * 3. Xem chi tiết bài học (Lý thuyết Rich Text / HTML, video, từ vựng trọng tâm + trạng thái cá nhân, bài kiểm tra)
   */
  @logExecution()
  async getLessonDetail(userId: number, lessonId: number) {
    const lesson = await this.studentLessonRepo.findLessonDetailById(lessonId);
    if (!lesson) {
      throw new ApiError(
        404,
        "lesson_not_found",
        "Không tìm thấy bài học hoặc bài học đã bị gỡ bỏ"
      );
    }

    // 1. Trích xuất danh sách wordIds và testIds của bài học
    const wordIds = lesson.lessonWords.map((lw) => lw.wordId);
    const testIds = lesson.tests.map((t) => t.id);

    // 2. Lấy dữ liệu học tập cá nhân của học viên song song
    const [userWordProgresses, userTestResults, isCompleted] = await Promise.all([
      this.studentLessonRepo.findStudentWordsProgress(userId, wordIds),
      this.studentLessonRepo.findStudentTestResults(userId, testIds),
      this.studentLessonRepo.hasCompletedLesson(userId, lessonId),
    ]);

    // Tạo Map để tra cứu O(1)
    const progressMap = new Map<number, (typeof userWordProgresses)[0]>();
    for (const p of userWordProgresses) {
      progressMap.set(p.wordId, p);
    }

    const testResultMap = new Map<number, typeof userTestResults>();
    for (const tr of userTestResults) {
      if (!testResultMap.has(tr.testId)) {
        testResultMap.set(tr.testId, []);
      }
      testResultMap.get(tr.testId)!.push(tr);
    }

    // 3. Ghép thông tin từ vựng kèm trạng thái ghi nhớ cá nhân
    const words = lesson.lessonWords.map((lw) => {
      const w = lw.word;
      const userProgress = progressMap.get(w.id);

      return {
        id: w.id,
        headword: w.headword,
        partOfSpeech: w.partOfSpeech,
        cefrLevel: w.cefrLevel,
        phonetic: w.phonetic,
        meaning: w.meaning,
        exampleSentence: w.exampleSentence,
        audioUrl: w.audioUrl,
        imageUrl: w.imageUrl,
        userProgress: {
          isSaved: Boolean(userProgress),
          status: userProgress?.status || "unlearned",
          memoryLevel: userProgress?.memoryLevel ?? 0,
          nextReviewDate: userProgress?.nextReviewDate || null,
        },
      };
    });

    // 4. Ghép thông tin bài kiểm tra kèm điểm số cá nhân cao nhất
    const tests = lesson.tests.map((test) => {
      const results = testResultMap.get(test.id) || [];
      const bestScore =
        results.length > 0
          ? Math.max(...results.map((r) => Number(r.totalScore)))
          : null;

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        cefrLevel: test.ceftLevel,
        totalQuestions: test._count.questions,
        userResult: {
          isTaken: results.length > 0,
          attemptsCount: results.length,
          bestScore,
          lastCompletedAt: results[0]?.completedAt || null,
        },
      };
    });

    // 5. Tính toán tiến độ tổng thể của học viên cho bài học này
    const wordsLearned = words.filter(
      (w) => w.userProgress.status === "learning" || w.userProgress.status === "mastered"
    ).length;
    const testsCompleted = tests.filter((t) => t.userResult.isTaken).length;

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content, // Nội dung lý thuyết Rich Text / HTML
      videoUrl: lesson.videoUrl, // Video bài giảng
      thumbnailUrl: lesson.thumbnailUrl,
      cefrLevel: lesson.cefrLevel,
      createdAt: lesson.createdAt,
      course: lesson.topic
        ? {
            id: lesson.topic.id,
            title: lesson.topic.title,
            description: lesson.topic.description,
            cefrLevel: lesson.topic.cefrLevel,
          }
        : null,
      summary: {
        totalWords: words.length,
        wordsLearned,
        totalTests: tests.length,
        testsCompleted,
        isCompleted,
      },
      words,
      tests,
    };
  }

  /**
   * 4. Đánh dấu hoàn thành bài học và nhận điểm thưởng kinh nghiệm (XP)
   */
  @logExecution()
  @recordActivity(
    "STUDENT_COMPLETE_LESSON",
    (result, userId, lessonId) =>
      `Học viên ID ${userId} đã hoàn thành bài học #${lessonId}, nhận ${result.xpAwarded} XP`
  )
  async completeLesson(userId: number, lessonId: number) {
    const lesson = await this.studentLessonRepo.findLessonDetailById(lessonId);
    if (!lesson) {
      throw new ApiError(404, "lesson_not_found", "Không tìm thấy bài học");
    }

    const alreadyCompleted = await this.studentLessonRepo.hasCompletedLesson(userId, lessonId);
    const xpBonus = alreadyCompleted ? 0 : 20; // 20 XP cho lần đầu hoàn thành

    let updatedUser = null;
    if (xpBonus > 0) {
      updatedUser = await this.studentLessonRepo.awardLessonXp(userId, xpBonus);
    }

    return {
      lessonId,
      lessonTitle: lesson.title,
      isCompleted: true,
      firstTimeCompleted: !alreadyCompleted,
      xpAwarded: xpBonus,
      totalXp: updatedUser?.xpPoints ?? undefined,
      message: alreadyCompleted
        ? "Bạn đã hoàn thành bài học này trước đó!"
        : `Chúc mừng bạn đã hoàn tất bài học và nhận được +${xpBonus} XP!`,
    };
  }
}

export const studentLessonService = new StudentLessonService();
