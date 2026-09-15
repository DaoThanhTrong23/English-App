var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { studentManageRepository } from "./studentManage.repository.js";
import { ApiError } from "../../shared/http/api-error.js";
export class StudentManageService {
    studentRepo;
    constructor(studentRepo = studentManageRepository) {
        this.studentRepo = studentRepo;
    }
    async getStudentslist(query) {
        const { totalItems, students } = await this.studentRepo.findStudentsWithPagination(query);
        const totalPages = Math.ceil(totalItems / query.limit);
        const formattedStudents = students.map((st) => {
            const totalWords = st.userProgress.length;
            const masteredWords = st.userProgress.filter((p) => p.status === "mastered").length;
            const learningWords = st.userProgress.filter((p) => p.status === "learning").length;
            const lastestActivity = st.acctivitylogs[0]?.createdAt || null;
            const lasttActiveAt = st.lastLoginDate && lastestActivity
                ? st.lastLoginDate > lastestActivity
                    ? st.lastLoginDate
                    : lastestActivity
                : st.lastLoginDate || lastestActivity;
            return {
                id: st.id,
                username: st.username,
                email: st.email,
                xpPoints: st.xpPoints,
                lasLoginDate: st.lastLoginDate,
                lastActiveAt: lasttActiveAt,
                lastestActivity: lastestActivity,
                joinedAt: st.createdAt,
                progress: {
                    totalWordsTracked: totalWords,
                    masteredWords,
                    learningWords,
                    completedTestCount: st._count.userTestResults,
                    achivievementsCount: st._count.userAchievements
                }
            };
        });
        return {
            pagination: {
                currentPage: query.page,
                limit: query.limit,
                totalItems,
                totalPages,
                hasNextPage: query.page < totalPages,
                hasPrevPage: query.page > 1,
            },
            items: formattedStudents
        };
    }
    async getStudentDetail(studentId) {
        const student = await this.studentRepo.findStudentDetailById(studentId);
        if (!student) {
            throw new ApiError(404, "student_not_found", "Không tìm thấy học viên");
        }
        const totalWords = student.userProgress.length;
        const masteredWords = student.userProgress.filter((p) => p.status === "mastered").length;
        const learningWords = student.userProgress.filter((p) => p.status === "learning").length;
        // Tính điểm trung bình các bài kiểm tra
        const averageScore = student.userTestResults.length > 0
            ? (student.userTestResults.reduce((acc, curr) => acc + Number(curr.totalScore), 0) / student.userTestResults.length).toFixed(1)
            : 0;
        return {
            profile: {
                id: student.id,
                username: student.username,
                email: student.email,
                xpPoints: student.xpPoints,
                lastLoginDate: student.lastLoginDate,
                joinedAt: student.createdAt,
            },
            progressSummary: {
                totalWords,
                masteredWords,
                learningWords,
                testsCompleted: student.userTestResults.length,
                averageTestScore: Number(averageScore),
                achievementsUnlocked: student.userAchievements.length,
            },
            recentTests: student.userTestResults.slice(0, 5),
            recentActivities: student.acctivitylogs,
            achievements: student.userAchievements.map((ua) => ua.achievement),
        };
    }
    async getStudentCount() {
        const total = await studentManageRepository.countStudent();
        return { total };
    }
}
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentManageService.prototype, "getStudentslist", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StudentManageService.prototype, "getStudentDetail", null);
__decorate([
    logExecution(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StudentManageService.prototype, "getStudentCount", null);
export const studentManageService = new StudentManageService();
