import { prisma } from "../../config/prisma.js";

export class TestRepository {
  async findTests(ceftLevel?: string, search?: string) {
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
