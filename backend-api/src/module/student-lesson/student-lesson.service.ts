import { prisma } from '../../config/prisma.js';
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
  async getCoursesList(userId: number, query: GetStudentCoursesQueryInput & { targetLevelGroup?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userCefr = user?.cefrLevel || 'A1';
    const userTopics = user?.interests ? user.interests.split(',').map((t: string) => t.trim().toLowerCase()) : [];

    const SYNONYM_DICT: Record<string, string[]> = {
      'công nghệ (it)': ['it', 'công nghệ', 'lập trình', 'phần mềm', 'developer', 'máy tính', 'công nghệ thông tin', 'coding', 'coder', 'frontend', 'backend', 'ai', 'trí tuệ nhân tạo', 'data', 'dữ liệu', 'web', 'app', 'mobile', 'ứng dụng', 'mạng', 'network', 'cyber', 'bảo mật', 'database'],
      'du lịch': ['du lịch', 'travel', 'khách sạn', 'nhà hàng', 'sân bay', 'tourism', 'tourist', 'đặt phòng', 'hotel', 'resort', 'vé máy bay', 'chuyến bay', 'flight', 'nghỉ dưỡng', 'hướng dẫn viên', 'tour', 'passport', 'visa', 'hành lý', 'hộ chiếu'],
      'kinh doanh': ['kinh doanh', 'business', 'công sở', 'doanh nghiệp', 'tài chính', 'bán hàng', 'sales', 'marketing', 'văn phòng', 'startup', 'khởi nghiệp', 'đầu tư', 'kinh tế', 'thương mại', 'office', 'boss', 'quản lý', 'sếp', 'ceo', 'kế toán', 'accounting', 'hợp đồng', 'thương lượng'],
      'giải trí / game': ['giải trí', 'game', 'trò chơi', 'phim', 'âm nhạc', 'music', 'movie', 'thể thao', 'sport', 'bóng đá', 'ca nhạc', 'ca sĩ', 'diễn viên', 'hollywood', 'esports', 'streaming', 'youtube', 'tiktok', 'vlog', 'nghệ sĩ', 'idol', 'giải vô địch', 'cinema'],
      'văn hóa nghệ thuật': ['văn hóa', 'nghệ thuật', 'art', 'culture', 'lịch sử', 'bảo tàng', 'hội họa', 'kiến trúc', 'văn học', 'thơ ca', 'phong tục', 'truyền thống', 'di sản', 'gallery', 'exhibition', 'triển lãm', 'điêu khắc', 'tôn giáo', 'tín ngưỡng'],
      'giao tiếp hằng ngày': ['giao tiếp', 'hằng ngày', 'hàng ngày', 'cuộc sống', 'đời sống', 'daily', 'communication', 'chào hỏi', 'sinh hoạt', 'bạn bè', 'gia đình', 'mua sắm', 'shopping', 'thời tiết', 'weather', 'hỏi đường', 'ăn uống', 'food', 'restaurant', 'sức khỏe', 'bác sĩ'],
      'kỹ năng mềm': ['kỹ năng', 'mềm', 'thuyết trình', 'lãnh đạo', 'đàm phán', 'soft skills', 'làm việc nhóm', 'teamwork', 'quản lý thời gian', 'time management', 'giải quyết vấn đề', 'giao tiếp hiệu quả', 'tự học', 'tư duy', 'mindset', 'phỏng vấn', 'interview'],
      'học thuật': ['học thuật', 'academic', 'ielts', 'toefl', 'toeic', 'nghiên cứu', 'khoa học', 'trường học', 'giáo dục', 'đại học', 'university', 'college', 'sinh viên', 'student', 'thi cử', 'exam', 'test', 'luận văn', 'thesis', 'essay', 'ngữ pháp', 'từ vựng chuẩn', 'giáo sư']
    };

    const expandedKeywords = new Set<string>();
    userTopics.forEach((topic: string) => {
      const synonyms = SYNONYM_DICT[topic];
      if (synonyms) {
        synonyms.forEach(s => expandedKeywords.add(s));
      } else {
        expandedKeywords.add(topic);
      }
    });

    let { courses } = await this.studentLessonRepo.findCourses({ ...query, limit: 1000, page: 1 });
    
    // 1. Lọc theo targetLevelGroup do người dùng chọn lúc Onboarding
    if (query.targetLevelGroup) {
      const allowedLevels = query.targetLevelGroup.split('-'); // VD: 'A1-A2' -> ['A1', 'A2']
      courses = courses.filter(c => c.cefrLevel && allowedLevels.includes(c.cefrLevel));
    }

    // 2. Chấm điểm cá nhân hóa
    const scoredCourses = courses.map((course: any) => {
      let score = 0;
      if (course.cefrLevel === userCefr) score += 10;
      const desc = (course.description || '').toLowerCase();
      const title = (course.title || '').toLowerCase();
      
      expandedKeywords.forEach((keyword: string) => {
        if (desc.includes(keyword) || title.includes(keyword)) score += 5;
      });
      return { ...course, personalizedScore: score };
    });

    // 3. Sắp xếp ưu tiên
    scoredCourses.sort((a: any, b: any) => b.personalizedScore - a.personalizedScore);

    // 4. Giới hạn số lượng (Admin cấu hình, mặc định 7)
    // Ưu tiên: admin config từ ENV > query.limit > 7
    const ADMIN_TOPIC_LIMIT = process.env.ADMIN_TOPIC_LIMIT ? parseInt(process.env.ADMIN_TOPIC_LIMIT) : 7;
    const limit = query.limit || ADMIN_TOPIC_LIMIT;
    const page = query.page || 1;
    const totalItems = scoredCourses.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    
    const paginatedCourses = scoredCourses.slice((page - 1) * limit, page * limit);

    const formattedCourses = paginatedCourses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      cefrLevel: course.cefrLevel,
      imageUrl: course.imageUrl,
      createdAt: course.createdAt,
      totalLessons: course.lessons?.length || 0,
      personalizedScore: course.personalizedScore
    }));

    return {
      pagination: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      items: formattedCourses,
      streak: await this.studentLessonRepo.calculateUserStreak(userId),
    };
  }

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
