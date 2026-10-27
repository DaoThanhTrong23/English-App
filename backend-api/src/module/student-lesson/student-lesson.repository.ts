import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { GetStudentCoursesQueryInput } from "./student-lesson.schema.js";

export class StudentLessonRepository {
  /**
   * Lấy danh sách khóa học (Topics) đang hoạt động kèm số lượng bài học
   */
  @logExecution()
  async findCourses(filter: GetStudentCoursesQueryInput & { preferredIds?: number[] }) {
    const { page = 1, limit, search, cefrLevel, isExplore, preferredIds = [] } = filter as any;
    const safeLimit = limit || 10;
    const skip = (page - 1) * safeLimit;

    const conditions: any[] = [];

    if (search) {
      conditions.push({ OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ] });
    }

    if (cefrLevel) {
      conditions.push({ cefrLevel });
    }

    if (isExplore) {
      // Trang Khám Phá: Tuyệt đối KHÔNG hiển thị bất kỳ chủ đề nào đang bị xóa mềm
      conditions.push({ deletedAt: null });
    } else {
      // Danh sách học: Hiển thị chủ đề chưa xóa mềm HOẶC các chủ đề học viên đã ghi danh
      if (preferredIds.length > 0) {
        conditions.push({
          OR: [
            { deletedAt: null },
            { id: { in: preferredIds } },
          ],
        });
      } else {
        conditions.push({ deletedAt: null });
      }
    }

    const whereCondition = conditions.length > 0 ? { AND: conditions } : {};

    const [totalItems, courses] = await Promise.all([
      prisma.topic.count({ where: whereCondition }),
      prisma.topic.findMany({
        where: whereCondition,
        skip,
        take: safeLimit,
        orderBy: { id: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      }),
    ]);

    return { totalItems, courses };
  }

  /**
   * Lấy chi tiết khóa học theo ID kèm danh sách bài học
   */
  @logExecution()
  async findCourseById(courseId: number) {
    return prisma.topic.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { id: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            cefrLevel: true,
            thumbnailUrl: true,
            videoUrl: true,
            createdAt: true,
            _count: {
              select: {
                lessonWords: true,
                tests: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Lấy danh sách bài học thuộc một khóa học
   */
  @logExecution()
  async findLessonsByCourseId(courseId: number) {
    return prisma.lesson.findMany({
      where: {
        topicId: courseId,
        deletedAt: null,
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        topicId: true,
        title: true,
        description: true,
        cefrLevel: true,
        thumbnailUrl: true,
        videoUrl: true,
        createdAt: true,
        _count: {
          select: {
            lessonWords: true,
            tests: true,
          },
        },
      },
    });
  }

  /**
   * Lấy chi tiết một bài học (nội dung lý thuyết, từ vựng, bài test)
   */
  @logExecution()
  async findLessonDetailById(lessonId: number) {
    return prisma.lesson.findFirst({
      where: {
        id: lessonId,
        deletedAt: null,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            description: true,
            cefrLevel: true,
          },
        },
        lessonWords: {
          include: {
            word: true,
          },
        },
        tests: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Lấy tiến trình học từ vựng của học viên theo danh sách wordIds
   */
  @logExecution()
  async findStudentWordsProgress(userId: number, wordIds: number[]) {
    if (wordIds.length === 0) return [];
    return prisma.userProgress.findMany({
      where: {
        userId,
        wordId: { in: wordIds },
      },
    });
  }

  /**
   * Lấy kết quả làm bài kiểm tra của học viên theo danh sách testIds
   */
  @logExecution()
  async findStudentTestResults(userId: number, testIds: number[]) {
    if (testIds.length === 0) return [];
    return prisma.userTestResult.findMany({
      where: {
        userId,
        testId: { in: testIds },
      },
      orderBy: {
        completedAt: "desc",
      },
    });
  }

  /**
   * Kiểm tra học viên đã hoàn thành bài học chưa qua Activity Log
   */
  @logExecution()
  async hasCompletedLesson(userId: number, lessonId: number) {
    const log = await prisma.activityLog.findFirst({
      where: {
        userId,
        actionType: "STUDENT_COMPLETE_LESSON_SUCCESS",
        description: {
          contains: `bài học #${lessonId}`,
        },
      },
    });
    if (log) return true;

    const tests = await prisma.test.findMany({
      where: { lessonId },
      select: { id: true },
    });
    if (tests.length === 0) return false;

    const results = await prisma.userTestResult.findMany({
      where: {
        userId,
        testId: { in: tests.map((t) => t.id) },
        totalScore: { gt: 0 },
      },
      select: { testId: true },
    });

    const completedSet = new Set(results.map((r) => r.testId));
    return tests.every((t) => completedSet.has(t.id));
  }

  /**
   * Cộng điểm XP cho học viên khi hoàn thành bài học
   */
  @logExecution()
  async awardLessonXp(userId: number, xp: number) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        xpPoints: {
          increment: xp,
        },
      },
      select: {
        id: true,
        username: true,
        xpPoints: true,
      },
    });
  }

  @logExecution()
  async calculateUserStreak(userId: number) {
    const [loginLogs, testResults, activityLogs] = await Promise.all([
      prisma.loginLog.findMany({
        where: { userId },
        orderBy: { loginTime: 'desc' },
        take: 60,
        select: { loginTime: true }
      }),
      prisma.userTestResult.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 60,
        select: { completedAt: true }
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 60,
        select: { createdAt: true }
      })
    ]);

    const allDates: Date[] = [
      ...loginLogs.map(l => l.loginTime),
      ...testResults.map(t => t.completedAt),
      ...activityLogs.map(a => a.createdAt)
    ];

    if (allDates.length === 0) return 0;

    const uniqueDates = Array.from(new Set(allDates.map(l => {
      const d = new Date(l);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))).sort((a, b) => b - a);

    if (uniqueDates.length === 0) return 0;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const yesterdayTime = todayTime - 86400000;
    
    const latest = uniqueDates[0];
    
    // Nếu ngày hoạt động gần nhất không phải hôm nay hoặc hôm qua -> mất chuỗi
    if (latest !== todayTime && latest !== yesterdayTime) {
       return 0;
    }

    let checkDate = latest;
    for (const d of uniqueDates) {
      if (d === checkDate) {
        currentStreak++;
        checkDate -= 86400000;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }

}

export const studentLessonRepository = new StudentLessonRepository();
