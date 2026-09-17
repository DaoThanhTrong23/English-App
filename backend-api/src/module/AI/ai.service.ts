import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { EssayEvaluationResponse, GradeEssayInput } from "./ai.schema.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";

const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY || '');

class AiService {
    @logExecution()
    async gradeEssay(input: GradeEssayInput): Promise<EssayEvaluationResponse> {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });

        const prompt = `Bạn là giám khảo chấm thi tiếng Anh chuẩn quốc tế theo khung CEFR (A1, A2, B1, B2, C1, C2).
                        Hãy chấm điểm và đánh giá đoạn văn sau đây của người học:
                        ${input.topic ? `Chủ đề: "${input.topic}"` : ""}
                        Đoạn văn:
                        """
                        ${input.text}
                        """
                        Yêu cầu trả về kết quả theo đúng cấu trúc JSON sau (toàn bộ giải thích, nhận xét bằng TIẾNG VIỆT):
                        {
                        "overallScore": number (thang 10.0, ví dụ 6.5),
                        "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
                        "grammarScore": number (thang 10),
                        "vocabularyScore": number (thang 10),
                        "feedback": "Nhận xét tổng quát về bài viết",
                        "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
                        "improvements": ["Điểm cần khắc phục 1", "Điểm cần khắc phục 2"],
                        "corrections": [
                            {
                            "original": "cụm từ hoặc câu bị sai trong bài",
                            "issue": "giải thích chi tiết vì sao sai ngữ pháp/từ vựng",
                            "suggestion": "câu viết lại chính xác"
                            }
                        ],
                        "improvedVersion": "Đoạn văn viết lại hoàn chỉnh tự nhiên và mượt mà hơn"
                        }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text) as EssayEvaluationResponse;
    }

}

export const aiService = new  AiService();