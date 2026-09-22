import { EssayEvaluationResponse, GradeEssayInput, SpeakingEvaluationResponse } from "./ai.schema.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import ollama from "ollama"
let transcriber: any = null;
async function getTranscriber() {
    if (!transcriber) {
        const { pipeline } = await import("@xenova/transformers");
        // Tải model whisper-small hoặc whisper-base tự động về máy (rất nhẹ và chính xác)
        transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-small");
    }
    return transcriber;
}


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
    async transcribeAudioLocal(audioBuffer: Buffer, mimeType: string = "audio/wav"): Promise<string> {
        const asr = await getTranscriber();
        // Chuyển Buffer sang chuỗi Base64 Data URI mà Whisper hỗ trợ trực tiếp
        const base64Audio = `data:${mimeType};base64,${audioBuffer.toString("base64")}`;
        // Whisper nhận diện giọng nói tiếng Anh
        const output = await asr(base64Audio, {
            language: "english",
            task: "transcribe",
        });
        return (output.text || "").trim();
    }


    @logExecution()
    async gradeSpeaking(
        audioBuffer: Buffer,
        mimeType: string,
        topic?: string,
        targetSentence?: string
    ): Promise<SpeakingEvaluationResponse> {
        // Bước 1: Dùng Whisper chạy offline để bóc băng giọng nói thành văn bản
        const transcript = await this.transcribeAudioLocal(audioBuffer, mimeType);
        // Bước 2: Dùng Ollama để chấm điểm văn bản transcript
        const prompt = `Bạn là giám khảo chấm thi Nói tiếng Anh chuẩn quốc tế theo khung CEFR (A1, A2, B1, B2, C1, C2).
                Dưới đây là lời nói của học viên đã được chuyển đổi từ bản ghi âm giọng nói thành văn bản (transcript):
                ${topic ? `Chủ đề bài nói: "${topic}"` : ""}
                ${targetSentence ? `Câu mẫu yêu cầu nói (nếu có): "${targetSentence}"` : ""}
                Văn bản học viên đã nói:
                """
                ${transcript}
                """
                Hãy đánh giá và trả về kết quả ĐÚNG định dạng JSON sau (toàn bộ nhận xét, giải thích bằng TIẾNG VIỆT):
                {
                "overallScore": number (thang 10.0, ví dụ 7.0),
                "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
                "grammarScore": number (thang 10),
                "vocabularyScore": number (thang 10),
                "coherenceScore": number (thang 10),
                "feedback": "Nhận xét tổng quan về phần nói",
                "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
                "improvements": ["Điểm cần khắc phục 1", "Điểm cần khắc phục 2"],
                "corrections": [
                    {
                    "original": "câu hoặc cụm từ người học nói sai",
                    "issue": "giải thích chi tiết vì sao sai",
                    "suggestion": "câu nói lại tự nhiên và đúng ngữ pháp"
                    }
                ],
                "improvedVersion": "Bản diễn đạt lại hoàn chỉnh tự nhiên và hay hơn cho câu trả lời trên"
                }`;
        const response = await ollama.chat({
            model: "qwen2.5:7b",
            messages: [{ role: "user", content: prompt }],
            format: "json",
        });
        const evaluation = JSON.parse(response.message.content);
        return {
            transcript,
            ...evaluation,
        } as SpeakingEvaluationResponse;
    }
}

export const aiService = new AiService();