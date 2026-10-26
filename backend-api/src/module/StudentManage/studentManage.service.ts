import { id } from "zod/v4/locales";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { studentManageRepository, StudentManageRepository } from "./studentManage.repository.js";
import { GetStudentQueryInput } from "./studentManage.schema.js";
import { ApiError } from "../../shared/http/api-error.js";
import { prisma } from "../../config/prisma.js";
import { notificationService } from "../notification/notification.service.js";

export class StudentManageService {
    constructor(
        private studentRepo: StudentManageRepository = studentManageRepository
    ) { }

    @logExecution()
    async getStudentslist(query: GetStudentQueryInput) {
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
                avatarUrl: st.avatarUrl,
                xpPoints: st.xpPoints,
                isLocked: st.isLocked,
                lastLoginDate: st.lastLoginDate,
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
            }
        })

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
        }

    }

  @logExecution()
  async getStudentDetail(studentId: number) {
    const student = await this.studentRepo.findStudentDetailById(studentId);
    if (!student) {
      throw new ApiError(404, "student_not_found", "Không tìm thấy học viên");
    }
    const totalWords = student.userProgress.length;
    const masteredWords = student.userProgress.filter(
      (p) => p.status === "mastered"
    ).length;
    const learningWords = student.userProgress.filter(
      (p) => p.status === "learning"
    ).length;
    // Tính điểm trung bình các bài kiểm tra
    const averageScore =
      student.userTestResults.length > 0
        ? (
            student.userTestResults.reduce(
              (acc, curr) => acc + Number(curr.totalScore),
              0
            ) / student.userTestResults.length
          ).toFixed(1)
        : 0;
    return {
      profile: {
        id: student.id,
        username: student.username,
        email: student.email,
        avatarUrl: student.avatarUrl,
        xpPoints: student.xpPoints,
        isLocked: student.isLocked,
        cefrLevel: student.cefrLevel,
        grammarElo: student.grammarElo,
        vocabElo: student.vocabElo,
        readingElo: student.readingElo,
        listeningElo: student.listeningElo,
        preferredTopics: student.preferredTopics,
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

  @logExecution()
  async getStudentCount(){
    const total = await studentManageRepository.countStudent();

    return {total};
  }
  
  @logExecution()
  async getUserProgress(userId: number) {
    const student = await studentManageRepository.findStudentDetailById(userId);
    if (!student) {
      throw new ApiError(404, "not_found", "Không tìm thấy người dùng");
    }
    return studentManageRepository.findUserProgress(userId);
  }

  @logExecution()
  async getUserAiChat(userId: number) {
    const student = await studentManageRepository.findStudentDetailById(userId);
    if (!student) {
      throw new ApiError(404, "not_found", "Không tìm thấy người dùng");
    }
    return studentManageRepository.findUserAiChat(userId);
  }

  @logExecution()
  async getTopStudents(limit: number = 5) {
    return studentManageRepository.getTopStudents(limit);
  }

  @logExecution()
  async updateStudentLockStatus(studentId: number, isLocked: boolean) {
    const student = await prisma.user.findFirst({
      where: { id: studentId, role: { name: "user" } },
    });
    if (!student) {
      throw new ApiError(404, "student_not_found", "Không tìm thấy học viên");
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: { isLocked },
      select: {
        id: true,
        username: true,
        email: true,
        isLocked: true,
      },
    });

    if (isLocked) {
      // Hủy refresh tokens để đăng xuất ngay lập tức
      await prisma.refreshToken.deleteMany({
        where: { userId: studentId },
      });
      notificationService.notifyAdmins(
        "Khóa tài khoản học viên",
        `Tài khoản của học viên ${student.username} (${student.email}) đã bị khóa quyền truy cập.`
      ).catch(() => {});
    } else {
      notificationService.notifyAdmins(
        "Mở khóa tài khoản học viên",
        `Tài khoản của học viên ${student.username} (${student.email}) đã được mở khóa hoạt động trở lại.`
      ).catch(() => {});
    }

    return updated;
  }
}

export const studentManageService = new StudentManageService();