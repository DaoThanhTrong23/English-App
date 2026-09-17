import { ApiError } from "../../shared/http/api-error.js";
import { testRepository, TestRepository } from "./test.repository.js";
import xlsx from "xlsx";
import * as fs from "fs";

export class TestService {
  constructor(private testRepo: TestRepository = testRepository) {}

  async getAllTests(ceftLevel?: string, search?: string) {
    return await this.testRepo.findTests(ceftLevel, search);
  }

  async createTest(data: any) {
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

      for (const row of data as any[]) {
        if (!row['Câu hỏi']) continue; // Bỏ qua dòng trống

        const quesionText = row['Câu hỏi'];
        const typeStr = row['Loại']?.toString().toLowerCase() || 'trắc nghiệm';
        const questionType = typeStr.includes('điền') ? 'fill_in_blank' : 'multiple_choice';
        const points = Number(row['Điểm']) || 10;
        
        const answers = [];
        const correctIndex = Number(row['Đáp án đúng']) || 1; // 1, 2, 3, 4

        for (let i = 1; i <= 6; i++) { // Hỗ trợ tối đa 6 đáp án cột Đáp án 1 -> 6
          const ans = row[`Đáp án ${i}`];
          if (ans !== undefined && ans !== null && ans !== '') {
            answers.push({
              answerText: ans.toString(),
              isCorrect: (i === correctIndex)
            });
          }
        }

        // Đảm bảo có ít nhất 1 đáp án
        if (answers.length === 0) {
          answers.push({ answerText: 'Đáp án tự động', isCorrect: true });
        }

        const q = await this.testRepo.createQuestionWithAnswers(testId, {
          quesionText,
          questionType,
          points
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
