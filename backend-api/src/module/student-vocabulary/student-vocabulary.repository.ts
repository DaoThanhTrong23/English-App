import { prisma } from "../../config/prisma.js";
import { LearningStatus } from "../../generated/prisma/index.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";

export class StudentVocabularyRepository {
  /**
   * Lấy danh sách từ vựng của học viên với cơ chế phân trang Lazy Loading (Cursor/Page)
   */
  @logExecution()
  async findWithLazyLoading(
    userId: number,
    limit: number,
    cursor?: number,
    page?: number
  ) {
    const totalItems = await prisma.userProgress.count({
      where: { userId },
    });

    let items;

    if (cursor) {
      // Phân trang bằng Cursor (Next ID)
      items = await prisma.userProgress.findMany({
        where: { userId },
        take: limit + 1, // Lấy dư 1 item để kiểm tra hasMore
        cursor: { id: cursor },
        skip: 1,
        orderBy: { id: "desc" },
        include: {
          word: true,
        },
      });
    } else if (page && page > 1) {
      // Phân trang bằng Page
      const skip = (page - 1) * limit;
      items = await prisma.userProgress.findMany({
        where: { userId },
        take: limit + 1,
        skip,
        orderBy: { id: "desc" },
        include: {
          word: true,
        },
      });
    } else {
      // Lấy đợt đầu tiên
      items = await prisma.userProgress.findMany({
        where: { userId },
        take: limit + 1,
        orderBy: { id: "desc" },
        include: {
          word: true,
        },
      });
    }

    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? paginatedItems[paginatedItems.length - 1].id : null;

    return {
      items: paginatedItems,
      nextCursor,
      hasMore,
      totalItems,
    };
  }

  /**
   * Tìm chi tiết từ vựng theo ID của UserProgress và userId (đảm bảo quyền sở hữu)
   */
  @logExecution()
  async findById(id: number, userId: number) {
    return prisma.userProgress.findFirst({
      where: { id, userId },
      include: {
        word: true,
      },
    });
  }

  /**
   * Kiểm tra từ vựng đã tồn tại trong danh sách học của học viên chưa
   */
  @logExecution()
  async findByWordAndUser(wordId: number, userId: number) {
    return prisma.userProgress.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
      include: {
        word: true,
      },
    });
  }

  /**
   * Thêm từ vựng vào tiến trình học của học viên
   */
  @logExecution()
  async createProgress(userId: number, wordId: number, status: LearningStatus = LearningStatus.new) {
    return prisma.userProgress.create({
      data: {
        userId,
        wordId,
        status,
        memoryLevel: 0,
        nextReviewDate: new Date(),
      },
      include: {
        word: true,
      },
    });
  }

  /**
   * Cập nhật thông tin tiến trình từ vựng của học viên
   */
  @logExecution()
  async updateProgress(
    id: number,
    userId: number,
    data: {
      status?: LearningStatus;
      memoryLevel?: number;
      nextReviewDate?: Date;
    }
  ) {
    return prisma.userProgress.update({
      where: { id },
      data,
      include: {
        word: true,
      },
    });
  }

  /**
   * Xóa từ vựng khỏi danh sách của học viên
   */
  @logExecution()
  async deleteProgress(id: number, userId: number) {
    return prisma.userProgress.delete({
      where: { id },
    });
  }

  /**
   * Tìm từ vựng gốc theo headword và partOfSpeech
   */
  @logExecution()
  async findExactWord(headword: string, partOfSpeech?: string | null) {
    return prisma.word.findFirst({
      where: {
        headword,
        partOfSpeech: partOfSpeech || null,
      },
    });
  }

  /**
   * Tìm từ theo wordId
   */
  @logExecution()
  async findWordById(wordId: number) {
    return prisma.word.findUnique({
      where: { id: wordId },
    });
  }

  /**
   * Tạo mới một từ vựng trong kho từ điển chung
   */
  @logExecution()
  async createWord(data: {
    headword: string;
    partOfSpeech?: string | null;
    cefrLevel?: string | null;
    phonetic?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    meaning?: string | null;
    exampleSentence?: string | null;
  }) {
    return prisma.word.create({
      data,
    });
  }

  /**
   * Cập nhật nội dung từ vựng
   */
  @logExecution()
  async updateWord(
    wordId: number,
    data: {
      meaning?: string;
      exampleSentence?: string;
    }
  ) {
    return prisma.word.update({
      where: { id: wordId },
      data,
    });
  }
}

export const studentVocabularyRepository = new StudentVocabularyRepository();
