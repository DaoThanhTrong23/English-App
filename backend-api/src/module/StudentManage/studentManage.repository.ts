import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { GetStudentQueryInput } from "./studentManage.schema.js";

export class StudentManageRepository {

  @logExecution()
  async findStudentsWithPagination(filter: GetStudentQueryInput) {
    const { page, limit, search, sortBy, sortOrder } = filter;

    const skip = (page - 1) * limit;

    const whereCondition: any = {
      role: "user"
    };

    if (search) {
      whereCondition.OR = [
        { username: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [totalItems, students] = await Promise.all([
      prisma.user.count({ where: whereCondition }),

      prisma.user.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          username: true,
          email: true,
          xpPoints: true,
          lastLoginDate: true,
          createdAt: true,
          _count: {
            select: {
              userProgress: true,
              userTestResults: true,
              userAchievements: true
            }
          },
          userProgress: {
            select: {
              status: true
            }
          },

          userTestResults: {
            include: {
              test: { select: { id: true, title: true, ceftLevel: true } },
            },
            orderBy: { completedAt: "desc" },
          },
          userAchievements: {
            include: {
              achievement: true,
            },
            orderBy: { unlockedAt: "desc" },
          },
          acctivitylogs: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },

      })
    ])

    return { totalItems, students };
  }

  @logExecution()
  async findStudentDetailById(userId: number) {
    return prisma.user.findFirst({
      where: { id: userId, role: "user" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        xpPoints: true,
        lastLoginDate: true,
        createdAt: true,
        userProgress: {
          include: {
            word: {
              select: {
                id: true,
                headword: true,
                meaning: true,
                cefrLevel: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        userTestResults: {
          include: {
            test: { select: { id: true, title: true, ceftLevel: true } },
          },
          orderBy: { completedAt: "desc" },
        },
        userAchievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: "desc" },
        },
        acctivitylogs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

}


export const studentManageRepository = new StudentManageRepository();