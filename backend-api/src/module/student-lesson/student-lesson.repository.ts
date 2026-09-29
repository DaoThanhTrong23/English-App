import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { GetStudentCoursesQueryInput } from "./student-lesson.schema.js";

export class StudentLessonRepository {
  /**
   * Lấy danh sách khóa học (Topics) đang hoạt động kèm số lượng bài học
   */
  @logExecution()
  async findCourses(filter: GetStudentCoursesQueryInput) {
    const { page, limit, search, cefrLevel } = filter;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (cefrLevel) {
      whereCondition.cefrLevel = cefrLevel;
    }

    const [totalItems, courses] = await Promise.all([
      prisma.topic.count({ where: whereCondition }),
      prisma.topic.findMany({
        where: whereCondition,
        skip,
        take: limit,
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
    return Boolean(log);
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
}

export const studentLessonRepository = new StudentLessonRepository();
