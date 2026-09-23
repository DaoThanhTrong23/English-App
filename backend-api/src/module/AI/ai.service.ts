import { EssayEvaluationResponse, GradeEssayInput, SpeakingEvaluationResponse } from "./ai.schema.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import ollama from "ollama";
import pkg from "wavefile";
import { loggers } from "../../utils/logger.js";
import { env } from "../../config/env.js";

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const { WaveFile } = pkg;
const execFileAsync = promisify(execFile);

/**
 * Tự động tìm file thực thi whisper-cli phù hợp với từng hệ điều hành (Windows, Linux, macOS)
 */
function resolveWhisperBin(): string {
  const isWin = process.platform === "win32";
  const searchDirs = [
    path.resolve(process.cwd(), "bin/whisper"),
    path.resolve(process.cwd(), "bin/whisper/Release"),
    path.resolve(process.cwd(), "bin"),
  ];

  const candidateNames = isWin
    ? ["whisper-cli.exe", "main.exe", "whisper.exe"]
    : ["whisper-cli", "main", "whisper"];

  for (const dir of searchDirs) {
    for (const name of candidateNames) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  // Fallback to system command nếu đã cài vào PATH (ví dụ trên Linux / Mac brew)
  return isWin ? "whisper-cli.exe" : "whisper-cli";
}

/**
 * Tìm model GGML trong thư mục bin/whisper/models hoặc fallback
 */
function resolveWhisperModel(): string {
  const modelDirs = [
    path.resolve(process.cwd(), "bin/whisper/models"),
    path.resolve(process.cwd(), "bin/models"),
    path.resolve(process.cwd(), "models"),
  ];

  const modelNames = [
    "ggml-base.en.bin",
    "ggml-base.bin",
    "ggml-small.en.bin",
    "ggml-tiny.en.bin",
  ];

  for (const dir of modelDirs) {
    for (const name of modelNames) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return path.resolve(process.cwd(), "bin/whisper/models/ggml-base.en.bin");
}

/**
 * Chuẩn hóa âm thanh sang 16kHz, 16-bit Mono WAV để whisper.cpp đọc tối ưu nhất
 */
function normalizeAudioToWav(audioBuffer: Buffer): Buffer {
  try {
    const wav = new WaveFile(audioBuffer);

    // Chuyển stereo -> mono nếu có nhiều hơn 1 kênh
    const wavAny = wav as any;
    const numChannels = wavAny.fmt?.numChannels ?? 1;
    if (numChannels > 1) {
      const samples: any = wav.getSamples();
      if (Array.isArray(samples) && samples.length > 1) {
        const mono = new Float64Array(samples[0].length);
        for (let i = 0; i < samples[0].length; i++) {
          let sum = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            sum += samples[ch][i];
          }
          mono[i] = sum / numChannels;
        }
        wav.fromScratch(1, wavAny.fmt?.sampleRate ?? 16000, wavAny.bitDepth ?? "16", mono);
      }
    }

    // Đưa về 16kHz và 16-bit PCM
    wav.toSampleRate(16000);
    wav.toBitDepth("16");
    return Buffer.from(wav.toBuffer());
  } catch {
    // Nếu wavefile không đọc được (hoặc đã là PCM hợp lệ), giữ nguyên buffer ban đầu
    return audioBuffer;
  }
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
  "improvedVersion": "Đoạn văn viết lại hoàn chỉnh tự nhiên và mượt mà hơn bằng tiếng anh"
}`;

    const response = await ollama.chat({
      model: env.AiModel,
      messages: [{ role: "user", content: prompt }],
      format: "json",
    });

    return JSON.parse(response.message.content) as EssayEvaluationResponse;
  }

  /**
   * Bóc băng âm thanh siêu tốc 100% Offline qua whisper.cpp C++
   */
  async transcribeAudioLocal(audioBuffer: Buffer, contextPrompt?: string): Promise<string> {
    const whisperBin = resolveWhisperBin();
    const whisperModel = resolveWhisperModel();

    if (!fs.existsSync(whisperModel)) {
      throw new Error(`Không tìm thấy model Whisper tại: ${whisperModel}. Vui lòng tải model ggml-base.en.bin vào bin/whisper/models/`);
    }

    // 1. Chuẩn hóa buffer và ghi vào file tạm
    const normalizedBuffer = normalizeAudioToWav(audioBuffer);
    const tempFilePath = path.join(
      os.tmpdir(),
      `speech_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`
    );
    await fs.promises.writeFile(tempFilePath, normalizedBuffer);

    try {
      const threadCount = Math.max(1, Math.min(4, os.cpus().length));
      const args = [
        "-m", whisperModel,
        "-f", tempFilePath,
        "-l", "en",
        "--no-timestamps",
        "-nt",
        "-t", threadCount.toString(),
      ];

      // Đưa thêm context để Whisper bắt chính xác từ vựng liên quan
      if (contextPrompt && contextPrompt.trim().length > 0) {
        args.push("--prompt", contextPrompt.trim());
      }

      const { stdout } = await execFileAsync(whisperBin, args, {
        windowsHide: true,
      });

      // Lọc bỏ timestamps và khoảng trắng thừa
      const transcript = stdout
        .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, "")
        .replace(/\r?\n/g, " ")
        .trim();

      return transcript;
    } catch (error: any) {
      loggers.error("Lỗi khi chạy whisper.cpp:", error);
      throw new Error(`Lỗi nhận diện giọng nói (Whisper): ${error.message || error}`);
    } finally {
      // Dọn dẹp file tạm
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }

  @logExecution()
  async gradeSpeaking(
    audioBuffer: Buffer,
    _mimeType: string,
    topic?: string,
    targetSentence?: string
  ): Promise<SpeakingEvaluationResponse> {
    // Ghép context gợi ý cho Whisper để nhận diện chuẩn hơn
    const contextPrompt = [topic, targetSentence].filter(Boolean).join(". ");

    // Bước 1: Whisper bóc băng âm thanh thành text
    const transcript = await this.transcribeAudioLocal(audioBuffer, contextPrompt);
    loggers.info(`Văn bản nhận diện từ giọng nói: "${transcript}"`);

    // Kiểm tra nếu không nhận diện được âm thanh (im lặng hoặc tạp âm)
    if (!transcript || transcript.length < 2) {
      return {
        transcript: transcript || "(Không nhận diện được giọng nói)",
        overallScore: 0,
        cefrLevel: "A1",
        grammarScore: 0,
        vocabularyScore: 0,
        coherenceScore: 0,
        feedback: "Hệ thống không nhận diện được giọng nói rõ ràng từ bản ghi âm của bạn. Vui lòng kiểm tra micro và thử lại.",
        strengths: [],
        improvements: ["Nói to, rõ ràng và hạn chế tiếng ồn xung quanh."],
        corrections: [],
        improvedVersion: targetSentence || "",
      };
    }

    // Bước 2: Ollama chấm điểm dựa trên transcript
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
  "improvedVersion": "Bản diễn đạt lại hoàn chỉnh tự nhiên và hay hơn cho câu trả lời trên bằng tiếng anh"
}`;

    const response = await ollama.chat({
      model: env.AiModel,
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