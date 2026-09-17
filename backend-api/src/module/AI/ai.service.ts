import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { EssayEvaluationResponse, GradeEssayInput } from "./ai.schema.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import ollama from "ollama";



class AiService {
    @logExecution()
    async gradeEssay(input: GradeEssayInput): Promise<EssayEvaluationResponse> {


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

        const response = await ollama.chat({
            model: "qwen2.5:7b", // hoặc "qwen2.5:3b", "llama3.2"
            messages: [{ role: "user", content: prompt }],
            format: "json", // Bắt buộc Ollama trả về đúng JSON
        });
        return JSON.parse(response.message.content) as EssayEvaluationResponse;
    }

}

export const aiService = new AiService();