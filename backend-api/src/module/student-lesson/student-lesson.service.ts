import { achievementEvaluator } from '../achievement/achievement.evaluator.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
import {
  StudentLessonRepository,
  studentLessonRepository,
} from "./student-lesson.repository.js";
import { GetStudentCoursesQueryInput } from "./student-lesson.schema.js";
import { keywordSettingService } from "../keyword-setting/keyword-setting.service.js";
import { topicSettingService } from "../topic-setting/topic-setting.service.js";

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

    const SYNONYM_DICT = keywordSettingService.getSynonymDict();

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
    
    // Danh sách các khóa học học viên đã đăng ký / chọn học
    const preferredCourseIds = user?.preferredTopics
      ? user.preferredTopics.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id))
      : [];

    // 1. Lọc theo targetLevelGroup do người dùng chọn lúc Onboarding hoặc chọn trên giao diện
    if (query.targetLevelGroup) {
      const allowedLevels = query.targetLevelGroup.split('-'); // VD: 'A1-A2' -> ['A1', 'A2'], 'A1' -> ['A1']
      courses = courses.filter(c => c.cefrLevel && allowedLevels.includes(c.cefrLevel));
    }

    // 2. Chấm điểm cá nhân hóa
    const scoredCourses = courses.map((course: any) => {
      let score = 0;
      const isEnrolled = preferredCourseIds.includes(course.id);
      if (isEnrolled) score += 100; // Khóa học đã đăng ký luôn được ưu tiên hàng đầu trong phần học chính
      if (course.cefrLevel === userCefr) score += 10;
      const desc = (course.description || '').toLowerCase();
      const title = (course.title || '').toLowerCase();
      
      expandedKeywords.forEach((keyword: string) => {
        if (desc.includes(keyword) || title.includes(keyword)) score += 5;
      });
      return { ...course, personalizedScore: score, isEnrolled };
    });

    // 3. Sắp xếp ưu tiên
    scoredCourses.sort((a: any, b: any) => b.personalizedScore - a.personalizedScore);

    // 4. Giới hạn số lượng (Admin cấu hình tùy chỉnh cho từng cấp độ của người học)
    const levelLimit = topicSettingService.getLimitForLevel(query.targetLevelGroup || userCefr);
    const limit = query.limit || Math.max(levelLimit, preferredCourseIds.length);
    const page = query.page || 1;
    const totalItems = scoredCourses.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    
    const paginatedCourses = scoredCourses.slice((page - 1) * limit, page * limit);

    const formattedCourses = await Promise.all(paginatedCourses.map(async (course: any) => {
      const lessons = course.lessons || [];
      const totalLessons = lessons.length;
      
      const lessonIds = lessons.map((l: any) => l.id);
      const testsInCourse = await prisma.test.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { id: true, lessonId: true }
      });
      const testIds = testsInCourse.map(t => t.id);

      const userResults = await prisma.userTestResult.findMany({
        where: {
          userId,
          testId: { in: testIds },
          totalScore: { gt: 0 }
        },
        select: { testId: true }
      });

      const completedTestIds = new Set(userResults.map(r => r.testId));

      let completedLessonsCount = 0;
      for (const lesson of lessons) {
        const testsOfLesson = testsInCourse.filter(t => t.lessonId === lesson.id);
        const hasFinished = testsOfLesson.some(t => completedTestIds.has(t.id));
        if (hasFinished) completedLessonsCount++;
      }

      const totalTestsCount = testsInCourse.length;
      const progressPercentage = totalTestsCount > 0 
        ? Math.min(100, Math.round((completedTestIds.size / totalTestsCount) * 100))
        : (totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        cefrLevel: course.cefrLevel,
        imageUrl: course.imageUrl,
        createdAt: course.createdAt,
        totalLessons,
        personalizedScore: course.personalizedScore,
        isEnrolled: course.isEnrolled,
        progressPercentage,
        completedLessons: completedLessonsCount
      };
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

  /**
   * Đăng ký / Thêm chủ đề vào phần học chính của học viên
   */
  @logExecution()
  async enrollCourse(userId: number, courseId: number) {
    const course = await prisma.topic.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!course) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy chủ đề yêu cầu");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "user_not_found", "Không tìm thấy thông tin học viên");
    }

    const preferredCourseIds = user.preferredTopics
      ? user.preferredTopics.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id))
      : [];

    const isAlreadyInPreferred = preferredCourseIds.includes(courseId);

    // Kiểm tra xem học viên đã từng làm bài test nào thuộc chủ đề này chưa
    const lessonIds = course.lessons.map((l: any) => l.id);
    let hasStudiedTests = false;
    if (lessonIds.length > 0) {
      const testsInCourse = await prisma.test.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { id: true },
      });
      const testIds = testsInCourse.map(t => t.id);
      if (testIds.length > 0) {
        const existingResult = await prisma.userTestResult.findFirst({
          where: {
            userId,
            testId: { in: testIds },
          },
        });
        if (existingResult) {
          hasStudiedTests = true;
        }
      }
    }

    // Kiểm tra xem học viên đã từng học từ vựng nào thuộc chủ đề này chưa
    let hasWordProgress = false;
    if (lessonIds.length > 0) {
      const existingWordProgress = await prisma.userProgress.findFirst({
        where: {
          userId,
          word: {
            lessonWords: {
              some: { lessonId: { in: lessonIds } },
            },
          },
        },
      });
      if (existingWordProgress) {
        hasWordProgress = true;
      }
    }

    // Nếu đã có chủ đề trong danh sách học chính hoặc đã từng làm test/học từ vựng của chủ đề này
    if (isAlreadyInPreferred || hasStudiedTests || hasWordProgress) {
      // Đảm bảo chủ đề được ghim vào preferredTopics nếu chưa có
      if (!isAlreadyInPreferred) {
        const updatedPreferred = [...preferredCourseIds, courseId].join(',');
        await prisma.user.update({
          where: { id: userId },
          data: { preferredTopics: updatedPreferred },
        });
      }

      return {
        alreadyEnrolled: true,
        courseId,
        courseTitle: course.title,
        message: "Bạn đang học chủ đề này.",
      };
    }

    // Thêm chủ đề vào danh sách học chính (preferredTopics)
    const updatedPreferred = [...preferredCourseIds, courseId].join(',');

    // Cập nhật interests nếu chưa có để tối ưu gợi ý hệ thống FAME-KT
    let updatedInterests = user.interests || '';
    const interestsList = updatedInterests.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    if (course.title && !interestsList.includes(course.title.toLowerCase())) {
      updatedInterests = updatedInterests ? `${updatedInterests}, ${course.title}` : course.title;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferredTopics: updatedPreferred,
        interests: updatedInterests,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        actionType: "ENROLL_COURSE",
        description: `Học viên đăng ký học chủ đề: ${course.title}`,
      },
    });

    return {
      alreadyEnrolled: false,
      courseId,
      courseTitle: course.title,
      message: "Đã thêm chủ đề vào phần học chính của bạn!",
    };
  }

  @logExecution()
  async getCourseDetail(userId: number, courseId: number) {
    const course = await this.studentLessonRepo.findCourseById(courseId);
    if (!course) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học yêu cầu");
    }

    // Tự động ghi nhận chủ đề vào preferredTopics nếu chưa có
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredTopics: true } });
      if (user) {
        const preferredIds = user.preferredTopics
          ? user.preferredTopics.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n))
          : [];
        if (!preferredIds.includes(courseId)) {
          await prisma.user.update({
            where: { id: userId },
            data: { preferredTopics: [...preferredIds, courseId].join(',') }
          });
        }
      }
    } catch (_) {}

    // Lấy thông tin bài học và trạng thái hoàn thành dựa trên kết quả test thực tế
    const lessonIds = course.lessons.map(l => l.id);
    const testsInCourse = await prisma.test.findMany({
      where: { lessonId: { in: lessonIds } },
      select: { id: true, lessonId: true }
    });
    const testIds = testsInCourse.map(t => t.id);

    const userResults = await prisma.userTestResult.findMany({
      where: {
        userId,
        testId: { in: testIds },
        totalScore: { gt: 0 }
      },
      select: { testId: true }
    });

    const completedTestIds = new Set(userResults.map(r => r.testId));

    const lessonsWithStatus = course.lessons.map((lesson) => {
      const testsOfLesson = testsInCourse.filter(t => t.lessonId === lesson.id);
      const isCompleted = testsOfLesson.some(t => completedTestIds.has(t.id));
      const completedTestsCount = testsOfLesson.filter(t => completedTestIds.has(t.id)).length;
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
        completedTests: completedTestsCount
      };
    });

    const completedLessonsCount = lessonsWithStatus.filter((l) => l.isCompleted).length;
    const totalTestsCount = testsInCourse.length;
    const progressPercentage = totalTestsCount > 0 
      ? Math.min(100, Math.round((completedTestIds.size / totalTestsCount) * 100))
      : (lessonsWithStatus.length > 0 ? Math.round((completedLessonsCount / lessonsWithStatus.length) * 100) : 0);

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      cefrLevel: course.cefrLevel,
      imageUrl: course.imageUrl,
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
        imageUrl: course.imageUrl,
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

    // Tự động ghi nhận chủ đề của bài học vào preferredTopics nếu chưa có
    try {
      const topicId = (lesson as any).topic?.id || (lesson as any).topicId;
      if (topicId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredTopics: true } });
        if (user) {
          const preferredIds = user.preferredTopics
            ? user.preferredTopics.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n))
            : [];
          if (!preferredIds.includes(topicId)) {
            await prisma.user.update({
              where: { id: userId },
              data: { preferredTopics: [...preferredIds, topicId].join(',') }
            });
          }
        }
      }
    } catch (_) {}

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

  /**
   * 7. Tổng hợp tiến độ hoàn thành theo từng cấp độ CEFR (A1 - C2) và cấp chứng chỉ
   */
  @logExecution()
  async getLevelsProgress(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, cefrLevel: true, xpPoints: true }
    });

    const LEVEL_GROUPS = [
      { id: 'A1-A2', name: 'Dễ', title: 'Dễ (A1 - A2)', desc: 'Dành cho người mới bắt đầu', levels: ['A1', 'A2'], nextGroupId: 'B1-B2' },
      { id: 'B1-B2', name: 'Trung bình', title: 'Trung bình (B1 - B2)', desc: 'Giao tiếp cơ bản đến khá', levels: ['B1', 'B2'], nextGroupId: 'C1-C2' },
      { id: 'C1-C2', name: 'Khó', title: 'Khó (C1 - C2)', desc: 'Thành thạo và chuyên sâu', levels: ['C1', 'C2'], nextGroupId: null },
    ];

    const CEFR_LEVELS = [
      { level: 'A1', title: 'Cơ bản (A1)', desc: 'Chào hỏi, thói quen, đồ ăn thức uống hàng ngày' },
      { level: 'A2', title: 'Sơ cấp (A2)', desc: 'Du lịch, mua sắm, sức khỏe và đời sống' },
      { level: 'B1', title: 'Trung cấp (B1)', desc: 'Giáo dục, môi trường, công nghệ ứng dụng' },
      { level: 'B2', title: 'Trung cấp cao (B2)', desc: 'Truyền thông, kinh doanh và văn hóa xã hội' },
      { level: 'C1', title: 'Cao cấp (C1)', desc: 'Nghệ thuật, khoa học và các vấn đề toàn cầu' },
      { level: 'C2', title: 'Thành thạo (C2)', desc: 'Triết học, ngôn ngữ học và ngoại giao quốc tế' },
    ];

    const topics: any[] = await prisma.topic.findMany({
      include: {
        lessons: {
          where: { deletedAt: null },
          include: {
            tests: { select: { id: true } },
            lessonWords: { select: { wordId: true } }
          }
        }
      }
    });

    const userResults = await prisma.userTestResult.findMany({
      where: { userId, totalScore: { gt: 0 } },
      select: { testId: true }
    });
    const completedTestIds = new Set(userResults.map((r: any) => r.testId));

    // 1. Tiến độ cho 3 nhóm trình độ chính (Dễ, Trung bình, Khó)
    const levelGroupsProgress = LEVEL_GROUPS.map(grp => {
      const groupTopics = topics.filter((t: any) => grp.levels.includes(t.cefrLevel));
      const totalTopics = groupTopics.length;

      let totalLessons = 0;
      let completedLessons = 0;
      let totalTests = 0;
      let completedTests = 0;
      let totalWords = 0;
      let completedTopics = 0;

      for (const topic of groupTopics) {
        let topicCompletedLessons = 0;
        const topicLessons = topic.lessons || [];
        for (const lesson of topicLessons) {
          totalLessons++;
          totalWords += (lesson.lessonWords || []).length;
          const lessonTestIds = (lesson.tests || []).map((t: any) => t.id);
          totalTests += lessonTestIds.length;

          const isLessonDone = lessonTestIds.length > 0 && lessonTestIds.every((tid: number) => completedTestIds.has(tid));
          if (isLessonDone) {
            completedLessons++;
            topicCompletedLessons++;
          }
          lessonTestIds.forEach((tid: number) => {
            if (completedTestIds.has(tid)) completedTests++;
          });
        }

        if (topicLessons.length > 0 && topicCompletedLessons === topicLessons.length) {
          completedTopics++;
        }
      }

      const progressPercentage = totalTests > 0
        ? Math.min(100, Math.round((completedTests / totalTests) * 100))
        : (totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0);

      const isCompleted = progressPercentage >= 100 && totalTopics > 0;

      return {
        id: grp.id,
        level: grp.id,
        name: grp.name,
        title: grp.title,
        description: grp.desc,
        levels: grp.levels,
        nextGroupId: grp.nextGroupId,
        totalTopics,
        completedTopics,
        totalLessons,
        completedLessons,
        totalTests,
        completedTests,
        totalWords,
        progressPercentage,
        isCompleted,
        certificate: isCompleted ? {
          certificateId: `ENG-${grp.id}-${user?.id ? user.id.toString().padStart(4, '0') : '0001'}`,
          recipientName: user?.username || 'Học viên EngMaster',
          level: grp.id,
          levelName: grp.name,
          levelTitle: grp.title,
          totalLessons,
          totalWords,
          issuedDate: new Date().toLocaleDateString('vi-VN'),
          nextLevel: grp.nextGroupId
        } : null
      };
    });

    const levelsProgress = CEFR_LEVELS.map(lvl => {
      const levelTopics = topics.filter((t: any) => t.cefrLevel === lvl.level);
      const totalTopics = levelTopics.length;

      let totalLessons = 0;
      let completedLessons = 0;
      let totalTests = 0;
      let completedTests = 0;
      let totalWords = 0;
      let completedTopics = 0;

      for (const topic of levelTopics) {
        let topicCompletedLessons = 0;
        const topicLessons = topic.lessons || [];
        for (const lesson of topicLessons) {
          totalLessons++;
          totalWords += (lesson.lessonWords || []).length;
          const lessonTestIds = (lesson.tests || []).map((t: any) => t.id);
          totalTests += lessonTestIds.length;

          const isLessonDone = lessonTestIds.length > 0 && lessonTestIds.every((tid: number) => completedTestIds.has(tid));
          if (isLessonDone) {
            completedLessons++;
            topicCompletedLessons++;
          }
          lessonTestIds.forEach((tid: number) => {
            if (completedTestIds.has(tid)) completedTests++;
          });
        }

        if (topicLessons.length > 0 && topicCompletedLessons === topicLessons.length) {
          completedTopics++;
        }
      }

      const progressPercentage = totalTests > 0
        ? Math.min(100, Math.round((completedTests / totalTests) * 100))
        : (totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0);

      const isCompleted = progressPercentage >= 100 && totalTopics > 0;

      return {
        level: lvl.level,
        title: lvl.title,
        description: lvl.desc,
        totalTopics,
        completedTopics,
        totalLessons,
        completedLessons,
        totalTests,
        completedTests,
        totalWords,
        progressPercentage,
        isCompleted,
        certificate: isCompleted ? {
          certificateId: `ENG-${lvl.level}-${user?.id ? user.id.toString().padStart(4, '0') : '0001'}`,
          recipientName: user?.username || 'Học viên EngMaster',
          level: lvl.level,
          levelTitle: lvl.title,
          totalLessons,
          totalWords,
          issuedDate: new Date().toLocaleDateString('vi-VN')
        } : null
      };
    });

    return {
      user: {
        id: user?.id,
        username: user?.username,
        cefrLevel: user?.cefrLevel || 'A1',
        xpPoints: user?.xpPoints || 0
      },
      groups: levelGroupsProgress,
      levels: levelsProgress
    };
  }

  /**
   * 8. Đổi cấp độ học tập chính của học viên (hỗ trợ cả nhóm 'A1-A2', 'B1-B2', 'C1-C2')
   */
  @logExecution()
  async setActiveLevel(userId: number, level: string) {
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'A1-A2', 'B1-B2', 'C1-C2'];
    if (!validLevels.includes(level)) {
      throw new ApiError(400, "invalid_level", "Cấp độ không hợp lệ");
    }

    const baseCefr = level.includes('-') ? level.split('-')[0] : level;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { cefrLevel: baseCefr },
      select: { id: true, username: true, cefrLevel: true, xpPoints: true }
    });

    return {
      user: updatedUser,
      targetLevelGroup: level,
      message: `Đã chuyển sang cấp độ học tập ${level} thành công!`
    };
  }
}

export const studentLessonService = new StudentLessonService();
