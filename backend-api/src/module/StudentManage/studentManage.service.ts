import { id } from "zod/v4/locales";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { studentManageRepository, StudentManageRepository } from "./studentManage.repository.js";
import { GetStudentQueryInput } from "./studentManage.schema.js";
import { ApiError } from "../../shared/http/api-error.js";

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

}

export const studentManageService = new StudentManageService();