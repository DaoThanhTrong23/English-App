import { ApiError } from "../../shared/http/api-error.js";
import { testRepository, TestRepository } from "./test.repository.js";
import { prisma } from "../../config/prisma.js";
import xlsx from "xlsx";
import * as fs from "fs";

export const CEFR_ORDER: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export class TestService {
  constructor(private testRepo: TestRepository = testRepository) {}

  async getAllTests(
    ceftLevel?: string, 
    search?: string, 
    lessonId?: number | null,
    page?: number,
    limit?: number,
    type?: 'placement' | 'lesson' | 'all'
  ) {
    if (page !== undefined || limit !== undefined || type !== undefined) {
      return await this.testRepo.findTests(ceftLevel, search, lessonId, page, limit, type);
    }
    return await this.testRepo.findTests(ceftLevel, search, lessonId);
  }

  async createTest(data: any) {
    if (data.lessonId && data.ceftLevel) {
      const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
      if (lesson && lesson.cefrLevel) {
        const lessonRank = CEFR_ORDER[lesson.cefrLevel.toUpperCase()] || 1;
        const testRank = CEFR_ORDER[data.ceftLevel.toUpperCase()] || 1;
        if (Math.abs(testRank - lessonRank) > 1) {
          throw new ApiError(
            400,
            "level_mismatch",
            `Trình độ bài thi (${data.ceftLevel}) không tương thích với trình độ bài học (${lesson.cefrLevel})`
          );
        }
      }
    }
    return await this.testRepo.createTest(data);
  }

  async updateTest(id: number, data: any) {
    const existing = await this.testRepo.findTestById(id);
    if (!existing) throw new ApiError(404, "not_found", "Bài thi không tồn tại");
    return await this.testRepo.updateTest(id, data);
  }

  async deleteTest(id: number) {
    const existing = await this.testRepo.findTestById(id);
    if (!existing) throw new ApiError(404, "not_found", "Bài thi không tồn tại");
    return await this.testRepo.deleteTest(id);
  }

  async getQuestions(testId: number) {
    const existing = await this.testRepo.findTestById(testId);
    if (!existing) throw new ApiError(404, "not_found", "Bài thi không tồn tại");
    return await this.testRepo.findQuestionsByTestId(testId);
  }

  async addQuestion(testId: number, data: any) {
    const existing = await this.testRepo.findTestById(testId);
    if (!existing) throw new ApiError(404, "not_found", "Bài thi không tồn tại");

    if (existing.ceftLevel && data.difficultyElo) {
      const elo = Number(data.difficultyElo);
      const testLevel = existing.ceftLevel.toUpperCase();
      if ((testLevel === 'A1' || testLevel === 'A2') && elo > 1600) {
        throw new ApiError(
          400,
          "difficulty_mismatch",
          `Câu hỏi có độ khó Elo ${elo} quá cao so với bài thi cấp độ ${testLevel}`
        );
      }
    }

    return await this.testRepo.createQuestionWithAnswers(testId, data, data.answers);
  }

  async updateQuestion(testId: number, questionId: number, data: any) {
    return await this.testRepo.updateQuestionWithAnswers(questionId, data, data.answers);
  }

  async deleteQuestion(questionId: number) {
    return await this.testRepo.deleteQuestion(questionId);
  }

  async getTestResults(testId: number) {
    const existing = await this.testRepo.findTestById(testId);
    if (!existing) throw new ApiError(404, "not_found", "Bài thi không tồn tại");
    return await this.testRepo.getTestResults(testId);
  }

  async importExcel(testId: number, filePath: string) {
    const existing = await this.testRepo.findTestById(testId);
    if (!existing) throw new ApiError(404, "not_found", "Bài thi không tồn tại");

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const importedQuestions = [];

      // Helper lấy giá trị linh hoạt từ nhiều tên cột (Việt / Anh, hoa / thường, có khoảng trắng)
      const getVal = (row: any, aliases: string[]): string | null => {
        const rowKeys = Object.keys(row);
        for (const alias of aliases) {
          const target = alias.toLowerCase().trim();
          const matchedKey = rowKeys.find(k => k.toLowerCase().trim() === target);
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            const val = String(row[matchedKey]).trim();
            if (val !== '') return val;
          }
        }
        return null;
      };

      for (const row of data as any[]) {
        const quesionText = getVal(row, [
          'câu hỏi', 'cau hoi', 'question', 'question text', 'questiontext', 'quesiontext', 'nội dung câu hỏi', 'noi dung'
        ]);
        if (!quesionText) continue; // Bỏ qua dòng trống

        const rawType = (getVal(row, ['loại', 'loai', 'loại câu hỏi', 'loai cau hoi', 'type', 'question type', 'questiontype']) || '').toLowerCase();
        let questionType: "multiple_choice" | "fill_in_blank" | "listening" | "speaking" | "writing" = 'multiple_choice';

        if (rawType.includes('điền') || rawType.includes('dien') || rawType.includes('blank') || rawType.includes('fill')) {
          questionType = 'fill_in_blank';
        } else if (rawType.includes('nghe') || rawType.includes('listen')) {
          questionType = 'listening';
        } else if (rawType.includes('nói') || rawType.includes('noi') || rawType.includes('speak')) {
          questionType = 'speaking';
        } else if (rawType.includes('viết') || rawType.includes('viet') || rawType.includes('writ')) {
          questionType = 'writing';
        } else {
          questionType = 'multiple_choice';
        }

        const points = Number(getVal(row, ['điểm', 'diem', 'points', 'point', 'score'])) || 10;
        
        // Đọc các lựa chọn đáp án (tối đa 6 đáp án: 1-6 hoặc A-F)
        const optionCandidates: string[] = [];
        const letterMap: Record<number, string> = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f' };

        for (let i = 1; i <= 6; i++) {
          const letter = letterMap[i];
          const ans = getVal(row, [
            `đáp án ${i}`, `dap an ${i}`, `option ${i}`, `answer ${i}`, `câu trả lời ${i}`,
            `đáp án ${letter}`, `dap an ${letter}`, `option ${letter}`, `answer ${letter}`, letter
          ]);
          if (ans !== null && ans !== '') {
            optionCandidates.push(ans);
          }
        }

        // Xác định đáp án đúng linh hoạt: số (1, 2..), chữ cái (A, B, C, D) hoặc nội dung trực tiếp
        const rawCorrect = getVal(row, [
          'đáp án đúng', 'dap an dung', 'correct', 'correct answer', 'correctanswer', 'answer', 'key'
        ]) || '';

        let targetIndex = -1; // 0-based
        const numVal = parseInt(rawCorrect, 10);
        if (!isNaN(numVal) && numVal >= 1 && numVal <= optionCandidates.length) {
          targetIndex = numVal - 1;
        } else {
          const upper = rawCorrect.toUpperCase();
          if (['A', 'B', 'C', 'D', 'E', 'F'].includes(upper)) {
            targetIndex = upper.charCodeAt(0) - 65; // A -> 0, B -> 1,...
          } else {
            // Thử so khớp chính xác với nội dung các đáp án
            targetIndex = optionCandidates.findIndex(opt => opt.toLowerCase().trim() === rawCorrect.toLowerCase().trim());
          }
        }
        if (targetIndex < 0) targetIndex = 0; // Mặc định đáp án 1 nếu không chỉ định

        const answers = optionCandidates.map((optText, idx) => ({
          answerText: optText,
          isCorrect: (idx === targetIndex)
        }));

        // Với trắc nghiệm / điền khuyết: đảm bảo có ít nhất 1 đáp án
        if (answers.length === 0 && questionType !== 'speaking' && questionType !== 'writing') {
          const singleAns = rawCorrect || 'Đáp án đúng';
          answers.push({ answerText: singleAns, isCorrect: true });
        }

        const difficultyElo = Number(getVal(row, ['độ khó', 'do kho', 'elo', 'difficulty', 'difficultielo'])) || 1200;
        const skillCategory = getVal(row, ['kỹ năng', 'ky nang', 'skill', 'skillcategory']) || (
          questionType === 'listening' ? 'Listening' :
          questionType === 'speaking' ? 'Speaking' :
          questionType === 'writing' ? 'Writing' : 'Vocabulary'
        );
        const topic = getVal(row, ['chủ đề', 'chu de', 'topic']) || null;
        const audioUrl = getVal(row, ['audio', 'audiourl', 'âm thanh', 'am thanh', 'sound']) || null;
        const imageUrl = getVal(row, ['image', 'imageurl', 'hình ảnh', 'hinh anh', 'ảnh', 'anh', 'photo']) || null;

        const q = await this.testRepo.createQuestionWithAnswers(testId, {
          quesionText,
          questionType,
          points,
          difficultyElo,
          skillCategory,
          topic,
          audioUrl,
          imageUrl
        }, answers);
        
        importedQuestions.push(q);
      }

      // Xoá file sau khi import xong
      fs.unlinkSync(filePath);
      return { imported: importedQuestions.length };
    } catch (error) {
      console.error("Excel import error:", error);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new ApiError(400, "import_failed", "Lỗi khi đọc file Excel, vui lòng kiểm tra lại định dạng");
    }
  }
}

export const testService = new TestService();
