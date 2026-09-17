import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
import { courseRepository, CourseRepository } from "./course.repository.js";
import {
  CreateCourseInput,
  GetCoursesQueryInput,
  UpdateCourseInput,
} from "./course.schema.js";

export class CourseService {
  constructor(private courseRepo: CourseRepository = courseRepository) {}

  @logExecution()
  async getCoursesList(query: GetCoursesQueryInput) {
    const { totalItems, courses } = await this.courseRepo.findWithPagination(query);
    const totalPages = Math.ceil(totalItems / query.limit) || 1;

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      topicId: course.topicId,
      title: course.title,
      description: course.description,
      cefrLevel: course.cefrLevel,
      thumbnailUrl: course.thumbnailUrl,
      createdAt: course.createdAt,
      deletedAt: course.deletedAt,
      isDeleted: course.deletedAt !== null,
      totalWords: course._count.lessonWords,
    }));

    return {
      pagination: {
        currentPage: query.page,
        limit: query.limit,
        totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
      },
      items: formattedCourses,
    };
  }

  @logExecution()
  async getCourseDetail(id: number) {
    const course = await this.courseRepo.findById(id, false);
    if (!course) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học hoặc khóa học đã bị xóa");
    }

    const words = course.lessonWords.map((lw) => lw.word);

    return {
      id: course.id,
      topicId: course.topicId,
      title: course.title,
      description: course.description,
      content: course.content,
      videoUrl: course.videoUrl,
      cefrLevel: course.cefrLevel,
      thumbnailUrl: course.thumbnailUrl,
      createdAt: course.createdAt,
      deletedAt: course.deletedAt,
      isDeleted: course.deletedAt !== null,
      totalWords: course._count.lessonWords,
      words,
    };
  }

  @logExecution()
  async getCourseCount() {
    const total = await this.courseRepo.countCourses();
    return { total };
  }

  @logExecution()
  @recordActivity("ADMIN_CREATE_COURSE", (result, data, adminId) => 
    `Admin ID ${adminId ?? "Unknown"} tạo khóa học mới "${data?.title}" (ID: ${result?.id})`
  )
  async createCourse(data: CreateCourseInput, adminId?: number) {
    if (data.wordIds && data.wordIds.length > 0) {
      const validWordIds = await this.courseRepo.checkWordsExist(data.wordIds);
      if (validWordIds.length !== data.wordIds.length) {
        const missingIds = data.wordIds.filter((id) => !validWordIds.includes(id));
        throw new ApiError(
          400,
          "invalid_word_ids",
          `Các từ vựng có ID sau không tồn tại: ${missingIds.join(", ")}`
        );
      }
    }

    const newCourse = await this.courseRepo.createCourse({
      topicId: data.topicId,
      title: data.title,
      description: data.description,
      content: data.content,
      videoUrl: data.videoUrl,
      cefrLevel: data.cefrLevel,
      thumbnailUrl: data.thumbnailUrl,
      wordIds: data.wordIds,
    });

    return {
      id: newCourse?.id,
      topicId: newCourse?.topicId,
      title: newCourse?.title,
      description: newCourse?.description,
      content: newCourse?.content,
      videoUrl: newCourse?.videoUrl,
      cefrLevel: newCourse?.cefrLevel,
      thumbnailUrl: newCourse?.thumbnailUrl,
      createdAt: newCourse?.createdAt,
      totalWords: newCourse?._count.lessonWords ?? 0,
      words: newCourse?.lessonWords.map((lw) => lw.word) ?? [],
    };
  }

  @logExecution()
  @recordActivity("ADMIN_UPDATE_COURSE", (result, id, data, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} cập nhật khóa học ID ${id}`
  )
  async updateCourse(id: number, data: UpdateCourseInput, adminId?: number) {
    const existing = await this.courseRepo.findById(id, false);
    if (!existing) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học để cập nhật");
    }

    if (data.wordIds && data.wordIds.length > 0) {
      const validWordIds = await this.courseRepo.checkWordsExist(data.wordIds);
      if (validWordIds.length !== data.wordIds.length) {
        const missingIds = data.wordIds.filter((wId) => !validWordIds.includes(wId));
        throw new ApiError(
          400,
          "invalid_word_ids",
          `Các từ vựng có ID sau không tồn tại: ${missingIds.join(", ")}`
        );
      }
    }

    const updated = await this.courseRepo.updateCourse(id, {
      topicId: data.topicId,
      title: data.title,
      description: data.description,
      content: data.content,
      videoUrl: data.videoUrl,
      cefrLevel: data.cefrLevel,
      thumbnailUrl: data.thumbnailUrl,
      wordIds: data.wordIds,
    });

    return {
      id: updated?.id,
      topicId: updated?.topicId,
      title: updated?.title,
      description: updated?.description,
      content: updated?.content,
      videoUrl: updated?.videoUrl,
      cefrLevel: updated?.cefrLevel,
      thumbnailUrl: updated?.thumbnailUrl,
      createdAt: updated?.createdAt,
      totalWords: updated?._count.lessonWords ?? 0,
      words: updated?.lessonWords.map((lw) => lw.word) ?? [],
    };
  }

  @logExecution()
  @recordActivity("ADMIN_SOFT_DELETE_COURSE", (result, id, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} đã xóa mềm khóa học ID ${id}`
  )
  async softDeleteCourse(id: number, adminId?: number) {
    const existing = await this.courseRepo.findById(id, false);
    if (!existing) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học hoặc khóa học đã bị xóa");
    }

    await this.courseRepo.softDelete(id);
    return { success: true, message: "Xóa mềm khóa học thành công" };
  }

  @logExecution()
  @recordActivity("ADMIN_RESTORE_COURSE", (result, id, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} đã khôi phục khóa học ID ${id}`
  )
  async restoreCourse(id: number, adminId?: number) {
    const existing = await this.courseRepo.findById(id, true);
    if (!existing) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học để khôi phục");
    }

    if (existing.deletedAt === null) {
      throw new ApiError(400, "course_not_deleted", "Khóa học này đang hoạt động bình thường, không cần khôi phục");
    }

    await this.courseRepo.restore(id);
    return { success: true, message: "Khôi phục khóa học thành công" };
  }

  @logExecution()
  @recordActivity("ADMIN_ADD_WORDS_TO_COURSE", (result, id, wordIds, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} thêm ${wordIds.length} từ vựng vào khóa học ID ${id}`
  )
  async addWordsToCourse(id: number, wordIds: number[], adminId?: number) {
    const existing = await this.courseRepo.findById(id, false);
    if (!existing) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học");
    }

    const validWordIds = await this.courseRepo.checkWordsExist(wordIds);
    if (validWordIds.length !== wordIds.length) {
      const missingIds = wordIds.filter((wId) => !validWordIds.includes(wId));
      throw new ApiError(
        400,
        "invalid_word_ids",
        `Các từ vựng có ID sau không tồn tại: ${missingIds.join(", ")}`
      );
    }

    const updated = await this.courseRepo.addWordsToCourse(id, wordIds);

    return {
      id: updated?.id,
      title: updated?.title,
      totalWords: updated?._count.lessonWords ?? 0,
      words: updated?.lessonWords.map((lw) => lw.word) ?? [],
    };
  }

  @logExecution()
  @recordActivity("ADMIN_REMOVE_WORD_FROM_COURSE", (result, id, wordId, adminId) =>
    `Admin ID ${adminId ?? "Unknown"} gỡ từ vựng ID ${wordId} khỏi khóa học ID ${id}`
  )
  async removeWordFromCourse(id: number, wordId: number, adminId?: number) {
    const existing = await this.courseRepo.findById(id, false);
    if (!existing) {
      throw new ApiError(404, "course_not_found", "Không tìm thấy khóa học");
    }

    const relation = await this.courseRepo.findLessonWord(id, wordId);
    if (!relation) {
      throw new ApiError(404, "word_not_in_course", "Từ vựng không nằm trong khóa học này");
    }

    await this.courseRepo.removeWordFromCourse(id, wordId);
    return { success: true, message: "Gỡ từ vựng khỏi khóa học thành công" };
  }
}

export const courseService = new CourseService();
