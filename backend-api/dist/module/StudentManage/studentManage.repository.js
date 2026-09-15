var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
export class StudentManageRepository {
    async findStudentsWithPagination(filter) {
        const { page, limit, search, sortBy, sortOrder } = filter;
        const skip = (page - 1) * limit;
        const whereCondition = {
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
        ]);
        return { totalItems, students };
    }
    async findStudentDetailById(userId) {
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
    async countStudent() {
        return prisma.user.count({
            where: {
                role: "user",
            },
        });
    }
}
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentManageRepository.prototype, "findStudentsWithPagination", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StudentManageRepository.prototype, "findStudentDetailById", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StudentManageRepository.prototype, "countStudent", null);
export const studentManageRepository = new StudentManageRepository();
