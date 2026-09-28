import { LearningStatus } from "../../generated/prisma/index.js";
import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
import {
  StudentVocabularyRepository,
  studentVocabularyRepository,
} from "./student-vocabulary.repository.js";
import {
  AddStudentVocabularyInput,
  GetStudentVocabularyQueryInput,
  UpdateStudentVocabularyInput,
} from "./student-vocabulary.schema.js";

export class StudentVocabularyService {
  constructor(
    private studentVocabularyRepo: StudentVocabularyRepository = studentVocabularyRepository
  ) {}

  /**
   * Lấy danh sách từ vựng của học viên kèm phân trang Lazy Loading.
   * Không có bất kỳ bộ lọc/tìm kiếm nào theo đúng yêu cầu bài toán.
   */
  @logExecution()
  async getVocabularyList(userId: number, query: GetStudentVocabularyQueryInput) {
    const { limit = 10, cursor, page } = query;

    const result = await this.studentVocabularyRepo.findWithLazyLoading(
      userId,
      limit,
      cursor,
      page
    );

    return {
      items: result.items,
      pagination: {
        limit,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        totalItems: result.totalItems,
      },
    };
  }

  /**
   * Xem chi tiết một từ vựng trong danh sách của học viên
   */
  @logExecution()
  async getVocabularyDetail(userId: number, id: number) {
    const item = await this.studentVocabularyRepo.findById(id, userId);
    if (!item) {
      throw new ApiError(
        404,
        "vocabulary_not_found",
        "Không tìm thấy từ vựng trong danh sách của bạn hoặc bạn không có quyền truy cập"
      );
    }
    return item;
  }

  /**
   * Thêm từ vựng vào danh sách của học viên
   * Có thể chọn từ có sẵn qua wordId hoặc tự tạo từ vựng mới
   */
  @logExecution()
  @recordActivity(
    "STUDENT_ADD_VOCABULARY",
    (result, userId) =>
      `Học viên ID ${userId} thêm từ vựng "${result?.word?.headword || result?.id}" vào danh sách học`
  )
  async addVocabulary(userId: number, data: AddStudentVocabularyInput) {
    let targetWordId: number;

    if (data.wordId) {
      // 1. Kiểm tra từ vựng có tồn tại trong hệ thống không
      const existingWord = await this.studentVocabularyRepo.findWordById(data.wordId);
      if (!existingWord) {
        throw new ApiError(404, "word_not_found", "Không tìm thấy từ vựng trong hệ thống");
      }
      targetWordId = existingWord.id;
    } else if (data.headword && data.meaning) {
      // 2. Tìm hoặc tạo mới từ vựng cá nhân trong bảng words
      let word = await this.studentVocabularyRepo.findExactWord(data.headword, data.partOfSpeech);
      if (!word) {
        word = await this.studentVocabularyRepo.createWord({
          headword: data.headword,
          partOfSpeech: data.partOfSpeech || null,
          cefrLevel: data.cefrLevel || null,
          phonetic: data.phonetic || null,
          audioUrl: data.audioUrl || null,
          imageUrl: data.imageUrl || null,
          meaning: data.meaning || null,
          exampleSentence: data.exampleSentence || null,
        });
      }
      targetWordId = word.id;
    } else {
      throw new ApiError(
        400,
        "invalid_input",
        "Vui lòng cung cấp wordId của từ có sẵn hoặc nhập headword và meaning để tạo từ mới"
      );
    }

    // 3. Kiểm tra từ đã có trong danh sách của học viên chưa
    const alreadyAdded = await this.studentVocabularyRepo.findByWordAndUser(
      targetWordId,
      userId
    );
    if (alreadyAdded) {
      throw new ApiError(
        409,
        "word_already_added",
        "Từ vựng này đã tồn tại trong danh sách học của bạn"
      );
    }

    // 4. Tạo bản ghi UserProgress
    const status = (data.status as LearningStatus) || LearningStatus.new;
    return await this.studentVocabularyRepo.createProgress(userId, targetWordId, status);
  }

  /**
   * Cập nhật thông tin/trạng thái từ vựng trong danh sách của học viên
   */
  @logExecution()
  @recordActivity(
    "STUDENT_UPDATE_VOCABULARY",
    (result, userId, id) =>
      `Học viên ID ${userId} cập nhật trạng thái từ vựng #${id} thành công`
  )
  async updateVocabulary(userId: number, id: number, data: UpdateStudentVocabularyInput) {
    const existing = await this.studentVocabularyRepo.findById(id, userId);
    if (!existing) {
      throw new ApiError(
        404,
        "vocabulary_not_found",
        "Không tìm thấy từ vựng trong danh sách của bạn hoặc bạn không có quyền cập nhật"
      );
    }

    const updatePayload: {
      status?: LearningStatus;
      memoryLevel?: number;
      nextReviewDate?: Date;
    } = {};

    if (data.status) {
      updatePayload.status = data.status as LearningStatus;
    }
    if (data.memoryLevel !== undefined) {
      updatePayload.memoryLevel = data.memoryLevel;
    }
    if (data.nextReviewDate) {
      updatePayload.nextReviewDate = new Date(data.nextReviewDate);
    }

    // Cập nhật nghĩa hoặc câu ví dụ cho từ nếu có truyền vào
    if (data.meaning || data.exampleSentence) {
      await this.studentVocabularyRepo.updateWord(existing.wordId, {
        meaning: data.meaning,
        exampleSentence: data.exampleSentence,
      });
    }

    return await this.studentVocabularyRepo.updateProgress(id, userId, updatePayload);
  }

  /**
   * Xóa từ vựng khỏi danh sách của học viên
   */
  @logExecution()
  @recordActivity(
    "STUDENT_DELETE_VOCABULARY",
    (_result, userId, id) =>
      `Học viên ID ${userId} đã xóa từ vựng #${id} khỏi danh sách học`
  )
  async deleteVocabulary(userId: number, id: number) {
    const existing = await this.studentVocabularyRepo.findById(id, userId);
    if (!existing) {
      throw new ApiError(
        404,
        "vocabulary_not_found",
        "Không tìm thấy từ vựng trong danh sách của bạn hoặc bạn không có quyền xóa"
      );
    }

    await this.studentVocabularyRepo.deleteProgress(id, userId);
    return {
      id,
      message: "Xóa từ vựng khỏi danh sách học thành công",
    };
  }
}

export const studentVocabularyService = new StudentVocabularyService();
