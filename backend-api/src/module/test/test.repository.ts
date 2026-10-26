import { prisma } from "../../config/prisma.js";

export class TestRepository {
  async findTests(
    ceftLevel?: string, 
    search?: string, 
    lessonId?: number | null,
    page?: number,
    limit?: number,
    type?: 'placement' | 'lesson' | 'all'
  ) {
    const whereClause: any = {};
    if (ceftLevel) {
      if (ceftLevel === 'A') {
        whereClause.ceftLevel = { in: ['A1', 'A2'] };
      } else if (ceftLevel === 'B') {
        whereClause.ceftLevel = { in: ['B1', 'B2'] };
      } else if (ceftLevel === 'C') {
        whereClause.ceftLevel = { in: ['C1', 'C2'] };
      } else {
        whereClause.ceftLevel = ceftLevel;
      }
    }
    
    if (search) {
      whereClause.title = { contains: search };
    }

    // Lọc theo loại bài thi (Placement Test vs Lesson Test)
    if (type === 'placement') {
      whereClause.OR = [
        { lessonId: null },
        { title: { contains: 'đầu vào' } }
      ];
    } else if (type === 'lesson') {
      whereClause.lessonId = { not: null };
      whereClause.NOT = { title: { contains: 'đầu vào' } };
    } else if (lessonId !== undefined) {
      if (lessonId === null) {
        whereClause.lessonId = null;
      } else {
        whereClause.lessonId = lessonId;
      }
    }

    // Tương thích ngược: Nếu không yêu cầu phân trang, trả về danh sách phẳng
    if (page === undefined && limit === undefined) {
      return await prisma.test.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { questions: true }
          }
        },
        orderBy: { id: 'desc' }
      });
    }

    // Phân trang Server-side Offset-based
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 10);
    const skip = (p - 1) * l;

    const [items, total, placementCount, lessonCount, allCount] = await Promise.all([
      prisma.test.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { questions: true }
          }
        },
        orderBy: { id: 'desc' },
        skip,
        take: l
      }),
      prisma.test.count({ where: whereClause }),
      prisma.test.count({
        where: {
          OR: [
            { lessonId: null },
            { title: { contains: 'đầu vào' } }
          ]
        }
      }),
      prisma.test.count({
        where: {
          lessonId: { not: null },
          NOT: { title: { contains: 'đầu vào' } }
        }
      }),
      prisma.test.count()
    ]);

    return {
      items,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      },
      counts: {
        placement: placementCount,
        lesson: lessonCount,
        all: allCount
      }
    };
  }

  async findTestById(id: number) {
    return await prisma.test.findUnique({
      where: { id }
    });
  }

  async createTest(data: any) {
    return await prisma.test.create({ data });
  }

  async updateTest(id: number, data: any) {
    return await prisma.test.update({
      where: { id },
      data
    });
  }

  async deleteTest(id: number) {
    return await prisma.test.delete({
      where: { id }
    });
  }

  async findQuestionsByTestId(testId: number) {
    return await prisma.question.findMany({
      where: { testId },
      include: { answers: true },
      orderBy: { id: 'asc' }
    });
  }

  async createQuestionWithAnswers(testId: number, questionData: any, answersData: any[]) {
    return await prisma.question.create({
      data: {
        testId,
        quesionText: questionData.quesionText,
        questionType: questionData.questionType,
        points: questionData.points,
        difficultyElo: questionData.difficultyElo ? Number(questionData.difficultyElo) : 1200,
        skillCategory: questionData.skillCategory || null,
        topic: questionData.topic || null,
        audioUrl: questionData.audioUrl || null,
        imageUrl: questionData.imageUrl || null,
        answers: {
          create: answersData
        }
      },
      include: { answers: true }
    });
  }

  async updateQuestionWithAnswers(questionId: number, questionData: any, answersData?: any[]) {
    return await prisma.$transaction(async (tx: any) => {
      await tx.question.update({
        where: { id: questionId },
        data: {
          quesionText: questionData.quesionText,
          questionType: questionData.questionType,
          points: questionData.points,
          difficultyElo: questionData.difficultyElo !== undefined ? Number(questionData.difficultyElo) : undefined,
          skillCategory: questionData.skillCategory !== undefined ? questionData.skillCategory : undefined,
          topic: questionData.topic !== undefined ? questionData.topic : undefined,
          audioUrl: questionData.audioUrl !== undefined ? questionData.audioUrl : undefined,
          imageUrl: questionData.imageUrl !== undefined ? questionData.imageUrl : undefined,
        }
      });

      if (answersData) {
        await tx.answer.deleteMany({
          where: { questionId }
        });
        
        const answersToCreate = answersData.map((a: any) => ({
          answerText: a.answerText,
          isCorrect: a.isCorrect
        }));

        await tx.question.update({
          where: { id: questionId },
          data: {
            answers: {
              create: answersToCreate
            }
          }
        });
      }

      return await tx.question.findUnique({
        where: { id: questionId },
        include: { answers: true }
      });
    });
  }

  async deleteQuestion(id: number) {
    return await prisma.question.delete({
      where: { id }
    });
  }

  async getTestResults(testId: number) {
    const test = await prisma.test.findUnique({ where: { id: testId } });
    const results = await prisma.userTestResult.findMany({
      where: { testId },
      include: {
        user: { select: { id: true, username: true, email: true } }
      },
      orderBy: { completedAt: 'desc' }
    });
    return { test, results };
  }
}

export const testRepository = new TestRepository();
