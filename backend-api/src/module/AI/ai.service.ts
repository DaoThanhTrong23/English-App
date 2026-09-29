import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import {
  EssayEvaluationResponse,
  GradeEssayInput,
  SpeakingEvaluationResponse,
  PronunciationEvaluationResponse,
  PhonemeScoreDetail,
} from "./ai.schema.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import ollama from "ollama";
import pkg from "wavefile";
import { loggers } from "../../utils/logger.js";
import { env } from "../../config/env.js";

import * as ort from "onnxruntime-node";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const { WaveFile } = pkg;
const execFileAsync = promisify(execFile);

// ============================================================================
// 1. NẠP MÔ HÌNH ÂM HỌC ONNX (WAV2VEC2 PHONEME) VÀ BẢNG MÃ VOCAB.JSON
// ============================================================================
let onnxPhonemeSession: ort.InferenceSession | null = null;
let vocabMap: Record<string, number> = {};
let idToPhonemeMap: Record<number, string> = {};

async function getOnnxPhonemeSession(): Promise<ort.InferenceSession | null> {
  if (!onnxPhonemeSession) {
    const modelPath = path.resolve(process.cwd(), "models/phoneme_model.onnx");
    const vocabPath = path.resolve(process.cwd(), "models/vocab.json");

    if (fs.existsSync(vocabPath)) {
      const vocabRaw = JSON.parse(fs.readFileSync(vocabPath, "utf-8"));
      vocabMap = vocabRaw;
      idToPhonemeMap = Object.fromEntries(
        Object.entries(vocabRaw).map(([char, id]) => [Number(id), char as string])
      );
    }

    if (fs.existsSync(modelPath)) {
      loggers.info(`[ONNX] Đang nạp mô hình âm học từ: ${modelPath}`);
      onnxPhonemeSession = await ort.InferenceSession.create(modelPath);
      loggers.info(`[ONNX] Nạp mô hình âm học ONNX thành công!`);
    } else {
      loggers.warn(`[ONNX] Không tìm thấy file model tại: ${modelPath}`);
    }
  }
  return onnxPhonemeSession;
}

// ============================================================================
// 2. MA TRẬN ĐẶC TRƯNG NGỮ ÂM SINH HỌC (ARTICULATORY PHONETIC MATRIX)
// ============================================================================
interface PhoneticVector {
  type: "vowel" | "consonant" | "diphthong";
  rounded: boolean;
  voiced: boolean;
  place: number;
  manner: number;
  height?: number;
  backness?: number;
}

const PHONETIC_MATRIX: Record<string, PhoneticVector> = {
  "iː": { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "ɪ":  { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "e":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "ɛ":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "æ":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 3, backness: 1 },
  "ʌ":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 3, backness: 2 },
  "ə":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "uː": { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "ʊ":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "ɔː": { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "ɑː": { type: "vowel", rounded: false, voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "oʊ": { type: "diphthong", rounded: true, voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "aɪ": { type: "diphthong", rounded: false, voiced: true, place: 3, manner: 5, height: 3, backness: 1 },
  "eɪ": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "aʊ": { type: "diphthong", rounded: true,  voiced: true, place: 5, manner: 5, height: 3, backness: 3 },
  "ɔɪ": { type: "diphthong", rounded: true,  voiced: true, place: 4, manner: 5, height: 2, backness: 1 },
  "p": { type: "consonant", rounded: false, voiced: false, place: 1, manner: 1 },
  "b": { type: "consonant", rounded: false, voiced: true,  place: 1, manner: 1 },
  "t": { type: "consonant", rounded: false, voiced: false, place: 3, manner: 1 },
  "d": { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 1 },
  "k": { type: "consonant", rounded: false, voiced: false, place: 6, manner: 1 },
  "g": { type: "consonant", rounded: false, voiced: true,  place: 6, manner: 1 },
  "f": { type: "consonant", rounded: false, voiced: false, place: 2, manner: 2 },
  "v": { type: "consonant", rounded: false, voiced: true,  place: 2, manner: 2 },
  "s": { type: "consonant", rounded: false, voiced: false, place: 3, manner: 2 },
  "z": { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 2 },
  "ʃ": { type: "consonant", rounded: true,  voiced: false, place: 4, manner: 2 },
  "ʒ": { type: "consonant", rounded: true,  voiced: true,  place: 4, manner: 2 },
  "h": { type: "consonant", rounded: false, voiced: false, place: 7, manner: 2 },
  "m": { type: "consonant", rounded: false, voiced: true,  place: 1, manner: 3 },
  "n": { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 3 },
  "ŋ": { type: "consonant", rounded: false, voiced: true,  place: 6, manner: 3 },
  "l": { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 4 },
  "r": { type: "consonant", rounded: true,  voiced: true,  place: 4, manner: 4 },
  "j": { type: "consonant", rounded: false, voiced: true,  place: 5, manner: 5 },
  "w": { type: "consonant", rounded: true,  voiced: true,  place: 1, manner: 5 },
};

const SILENT_LETTER_RULES = [
  { pattern: /^kn/i, letter: "K", sound: "k", explanation: "Chữ 'K' đứng trước 'N' ở đầu từ là âm câm (như trong Knight, Knee, Knife)." },
  { pattern: /mb$|bt/i, letter: "B", sound: "b", explanation: "Chữ 'B' đứng sau 'M' hoặc trước 'T' là âm câm (như trong Climb, Doubt, Comb)." },
  { pattern: /^ps|^pn|^pt/i, letter: "P", sound: "p", explanation: "Chữ 'P' đứng trước 'S', 'N', 'T' ở đầu từ là âm câm (như trong Psychology, Pneumonia)." },
  { pattern: /^wr/i, letter: "W", sound: "w", explanation: "Chữ 'W' đứng trước 'R' là âm câm (như trong Write, Wrong, Wrist)." },
  { pattern: /gh/i, letter: "GH", sound: "g", explanation: "Tổ hợp 'GH' trong từ này là âm câm (như trong Night, Thought, Through)." },
  { pattern: /alk|alf|alm/i, letter: "L", sound: "l", explanation: "Chữ 'L' trong tổ hợp này là âm câm (như trong Talk, Walk, Half, Calm)." },
];

/**
 * Chuyển đổi âm thanh sang Float32Array 16kHz chuẩn Mono cho mô hình ONNX
 */
async function audioBufferToFloat32Array(audioBuffer: Buffer): Promise<Float32Array> {
  // Thử giải mã trực tiếp nếu là file WAV chuẩn
  try {
    const wav = new WaveFile(audioBuffer);
    wav.toSampleRate(16000);
    wav.toBitDepth("32f");
    const samples = wav.getSamples();
    if (Array.isArray(samples) && samples.length > 0) {
      return new Float32Array(samples[0]);
    }
    if (samples instanceof Float32Array) return samples;
    return new Float32Array(samples as any);
  } catch {
    // Nếu là file m4a, webm, aac, mp3 từ mobile/web, dùng ffmpeg-static convert sang 16kHz Mono WAV PCM
    const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
    const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
    try {
      fs.writeFileSync(tempInput, audioBuffer);
      const ffmpegBin = (typeof ffmpegPath === "string" ? ffmpegPath : (ffmpegPath as any)?.default) || "ffmpeg";
      await execFileAsync(ffmpegBin, [
        "-y",
        "-i", tempInput,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        tempOutput,
      ]);
      const outBuffer = fs.readFileSync(tempOutput);
      const wav = new WaveFile(outBuffer);
      wav.toSampleRate(16000);
      wav.toBitDepth("32f");
      const samples = wav.getSamples();
      if (Array.isArray(samples) && samples.length > 0) {
        return new Float32Array(samples[0]);
      }
      if (samples instanceof Float32Array) return samples;
      return new Float32Array(samples as any);
    } catch (ffmpegErr) {
      loggers.warn(`[FFMPEG] Lỗi chuyển đổi âm thanh: ${ffmpegErr}`);
      const float32 = new Float32Array(Math.floor(audioBuffer.length / 2));
      for (let i = 0; i < float32.length; i++) {
        float32[i] = audioBuffer.readInt16LE(i * 2) / 32768.0;
      }
      return float32;
    } finally {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
  }
}

/**
 * Tính hàm Softmax trên toàn bộ các frame âm thanh
 */
function computeSoftmax(logits: Float32Array, numClasses: number): Float32Array {
  const numFrames = Math.floor(logits.length / numClasses);
  const probs = new Float32Array(logits.length);

  for (let t = 0; t < numFrames; t++) {
    const offset = t * numClasses;
    let maxLogit = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      if (logits[offset + c] > maxLogit) maxLogit = logits[offset + c];
    }
    let sumExp = 0;
    for (let c = 0; c < numClasses; c++) {
      const expVal = Math.exp(logits[offset + c] - maxLogit);
      probs[offset + c] = expVal;
      sumExp += expVal;
    }
    for (let c = 0; c < numClasses; c++) {
      probs[offset + c] /= sumExp;
    }
  }
  return probs;
}

/**
 * CTC Greedy Decoder: Giải mã chuỗi âm vị IPA mà người dùng vừa phát âm
 */
function ctcDecodePhonemes(logits: Float32Array, numClasses: number): string[] {
  const numFrames = Math.floor(logits.length / numClasses);
  const decodedTokens: number[] = [];

  for (let t = 0; t < numFrames; t++) {
    const offset = t * numClasses;
    let maxVal = -Infinity;
    let bestId = 0;

    for (let c = 0; c < numClasses; c++) {
      if (logits[offset + c] > maxVal) {
        maxVal = logits[offset + c];
        bestId = c;
      }
    }

    // Bỏ qua token pad (0, 1, 2) và token trùng lặp liên tiếp theo chuẩn CTC
    if (bestId > 3 && (decodedTokens.length === 0 || bestId !== decodedTokens[decodedTokens.length - 1])) {
      decodedTokens.push(bestId);
    }
  }

  return decodedTokens.map((id) => idToPhonemeMap[id] || "").filter(Boolean);
}

function splitIpaPhonemes(ipa: string): string[] {
  const clean = ipa.replace(/[\/\[\]ˈˌ]/g, "").trim();
  const multiCharPhonemes = ["oʊ", "aɪ", "eɪ", "aʊ", "ɔɪ", "tʃ", "dʒ", "iː", "uː", "ɑː", "ɔː", "ɜː", "əl", "ər"];
  const result: string[] = [];
  let i = 0;

  while (i < clean.length) {
    let matched = false;
    for (const multi of multiCharPhonemes) {
      if (clean.startsWith(multi, i)) {
        result.push(multi);
        i += multi.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (clean[i].trim().length > 0 && clean[i] !== ".") {
        result.push(clean[i]);
      }
      i++;
    }
  }
  return result;
}

class AiService {
  @logExecution()
  async gradeEssay(input: GradeEssayInput): Promise<EssayEvaluationResponse> {
    const prompt = `Bạn là giám khảo chấm thi tiếng Anh chuẩn quốc tế theo khung CEFR (A1, A2, B1, B2, C1, C2).
Hãy chấm điểm đoạn văn sau:
${input.topic ? `Chủ đề: "${input.topic}"` : ""}
Đoạn văn: "${input.text}"`;

    const response = await ollama.chat({
      model: env.AiModel,
      messages: [{ role: "user", content: prompt }],
      format: "json",
    });

    return JSON.parse(response.message.content) as EssayEvaluationResponse;
  }

  @logExecution()
  async gradeSpeaking(_audioBuffer: Buffer, _mimeType: string, _topic?: string, _targetSentence?: string): Promise<SpeakingEvaluationResponse> {
    return {
      transcript: "(Speaking eval)",
      overallScore: 7,
      cefrLevel: "A2",
      grammarScore: 7,
      vocabularyScore: 7,
      coherenceScore: 7,
      feedback: "Nhận xét tổng quan bài nói",
      strengths: [],
      improvements: [],
      corrections: [],
      improvedVersion: "",
    };
  }

  // ============================================================================
  // THUẬT TOÁN GOP CHẠY BẰNG MÔ HÌNH ÂM HỌC ONNX & MA TRẬN NGỮ ÂM (KHÔNG DÙNG LLM)
  // ============================================================================
  @logExecution()
  async evaluatePronunciationGOP(
    audioBuffer: Buffer,
    targetWord: string,
    targetIpa: string
  ): Promise<PronunciationEvaluationResponse> {
    const session = await getOnnxPhonemeSession();
    const expectedPhonemes = splitIpaPhonemes(targetIpa);

    if (!session) {
      throw new Error("Không tìm thấy mô hình ONNX tại backend-api/models/phoneme_model.onnx");
    }

    // 1. Chuẩn hóa Audio sang Float32 PCM 16kHz
    const audioFloat32 = await audioBufferToFloat32Array(audioBuffer);
    if (audioFloat32.length < 1600) {
      // Dưới 0.1s âm thanh (rỗng / im lặng)
      return {
        targetWord,
        targetIpa,
        spokenText: "(Không có âm thanh)",
        overallScore: 0,
        cefrLevel: "A1",
        details: { vowelAccuracy: 0, consonantAccuracy: 0, stressAccuracy: 0, fluencyScore: 0 },
        phonemeScores: expectedPhonemes.map((p) => ({
          phoneme: p,
          score: 0,
          status: "poor",
          heardAs: "(im lặng)",
          feedback: "Không thu được âm thanh",
        })),
        silentLetterErrors: [],
        explanation: "Không phát hiện âm thanh từ micro của bạn.",
        improvement: {
          mouthShape: "Hãy nói to, rõ ràng hơn.",
          practiceTip: "Thử phát âm lại từ đầu.",
        },
      };
    }

    // 2. Chạy mô hình ONNX Wav2Vec2 Acoustic Model (Trích xuất ma trận Logits)
    const tensor = new ort.Tensor("float32", audioFloat32, [1, audioFloat32.length]);
    const results = await session.run({ input_values: tensor });
    const logits = results.logits.data as Float32Array;

    const numClasses = Object.keys(vocabMap).length || 392;
    const numFrames = Math.floor(logits.length / numClasses);

    // 3. CTC Decoding: Trích xuất chuỗi âm vị thực tế máy nghe được
    const actualPhonemes = ctcDecodePhonemes(logits, numClasses);
    const spokenText = actualPhonemes.join(" ") || "(không rõ âm)";
    loggers.info(`[GOP ONNX] Target: "${targetWord}" (${targetIpa}) | Máy nghe thấy: "${spokenText}"`);

    // 4. Tính toán Ma trận Xác suất Softmax
    const probs = computeSoftmax(logits, numClasses);

    // 5. THUẬT TOÁN TÍNH CHỈ SỐ GOP CHO TỪNG ÂM VỊ MỤC TIÊU
    const framesPerPhoneme = Math.floor(numFrames / Math.max(1, expectedPhonemes.length));
    const phonemeScores: PhonemeScoreDetail[] = [];
    const silentErrors: string[] = [];
    const explanations: string[] = [];
    let mouthTips = "";

    for (let i = 0; i < expectedPhonemes.length; i++) {
      const p = expectedPhonemes[i];
      const targetId = vocabMap[p] ?? 3;

      const tStart = i * framesPerPhoneme;
      const tEnd = Math.min(numFrames - 1, (i + 1) * framesPerPhoneme);
      const frameLength = Math.max(1, tEnd - tStart);

      let gopSum = 0;
      let dominantSoundId = 0;
      let maxDominantProb = -1;

      // Công thức GOP toán học: Log-Likelihood Ratio
      for (let t = tStart; t < tEnd; t++) {
        const offset = t * numClasses;
        const targetProb = Math.max(1e-6, probs[offset + targetId]);

        let maxProb = 1e-6;
        let bestId = 0;
        for (let c = 0; c < numClasses; c++) {
          if (probs[offset + c] > maxProb) {
            maxProb = probs[offset + c];
            bestId = c;
          }
        }

        if (maxProb > maxDominantProb) {
          maxDominantProb = maxProb;
          dominantSoundId = bestId;
        }

        const logRatio = Math.log(targetProb / maxProb);
        gopSum += logRatio;
      }

      const gop = gopSum / frameLength; // Giá trị log-ratio âm (-inf đến 0)
      
      // Chuyển GOP sang % điểm bằng hàm Sigmoid chuẩn hóa
      const score = Math.max(0, Math.min(100, Math.round(100 / (1 + Math.exp(-2.5 * (gop + 0.9))))));
      const recognizedAs = idToPhonemeMap[dominantSoundId] || actualPhonemes[i] || "âm khác";
      const isCorrect = score >= 60;

      let feedback = isCorrect ? "Phát âm chuẩn xác" : `Bị lệch sang âm /${recognizedAs}/`;

      // Chẩn đoán sinh học từ ma trận đặc trưng
      const vExp = PHONETIC_MATRIX[p];
      const vHeard = PHONETIC_MATRIX[recognizedAs];

      if (vExp && vHeard && !isCorrect) {
        if (vExp.rounded && !vHeard.rounded) {
          feedback = "Chưa chu tròn môi (bị đọc bẹt âm)";
          mouthTips += `Ở âm /${p}/: Hãy chu tròn môi lại như hình chữ O thay vì để môi dẹt. `;
          explanations.push(`Âm /${p}/ bị biến thành /${recognizedAs}/ do thói quen đọc dẹt môi của tiếng Việt.`);
        }
      }

      phonemeScores.push({
        phoneme: p,
        score,
        status: isCorrect ? "correct" : "poor",
        heardAs: recognizedAs,
        feedback,
      });
    }

    // 6. KIỂM TRA LỖI ÂM CÂM (SILENT LETTER RULES)
    for (const rule of SILENT_LETTER_RULES) {
      if (rule.pattern.test(targetWord)) {
        if (actualPhonemes.includes(rule.sound)) {
          silentErrors.push(`Lỗi âm câm: ${rule.explanation}`);
        }
      }
    }

    // 7. Tính tổng điểm chuẩn xác
    const validPhonemeScores = phonemeScores.map((x) => x.score);
    let overallScore = Math.round(validPhonemeScores.reduce((a, b) => a + b, 0) / Math.max(1, validPhonemeScores.length));
    if (silentErrors.length > 0) overallScore = Math.max(0, overallScore - silentErrors.length * 15);

    return {
      targetWord,
      targetIpa,
      spokenText,
      overallScore,
      cefrLevel: overallScore >= 80 ? "B2" : overallScore >= 60 ? "B1" : overallScore >= 40 ? "A2" : "A1",
      details: {
        vowelAccuracy: Math.min(100, overallScore + 5),
        consonantAccuracy: Math.min(100, overallScore),
        stressAccuracy: Math.max(0, overallScore - 10),
        fluencyScore: Math.min(100, overallScore + 10),
      },
      phonemeScores,
      silentLetterErrors: silentErrors,
      explanation:
        explanations.length > 0
          ? explanations.join(" ")
          : overallScore >= 75
          ? "Bạn phát âm rất chuẩn xác và tự nhiên."
          : `Bạn phát âm tương đối ổn nhưng cần lưu ý các âm màu đỏ.`,
      improvement: {
        mouthShape: mouthTips || "Mở khẩu hình miệng thoải mái, phát âm rõ ràng từng âm tiết.",
        practiceTip: "Luyện phát âm lại từng âm vị chưa đạt để làm chủ cơ miệng.",
      },
    };
  }

  @logExecution()
  async chatWithBot(userId: number, message: string, sessionId?: number): Promise<{ response: string, sessionId: number }> {
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await prisma.aiChatSession.create({
        data: { userId, title: message.substring(0, 30) + '...' }
      });
      currentSessionId = newSession.id;
    }
    await prisma.aiChatMessage.create({ data: { sessionId: currentSessionId!, sender: 'user', messageText: message } });
    const recentMessages = await prisma.aiChatMessage.findMany({ where: { sessionId: currentSessionId! }, orderBy: { createdAt: 'asc' }, take: -6 });
    const ollamaMessages = recentMessages.map((msg: any) => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.messageText }));
    ollamaMessages.unshift({ role: 'system', content: 'Bạn tên là Gà. Bạn là một gia sư Tiếng Anh vô cùng thân thiện, vui tính và nhiệt tình. Bạn luôn trả lời ngắn gọn, dễ hiểu và sẵn sàng sửa lỗi sai Tiếng Anh cho người dùng. Bạn có thể giao tiếp bằng cả Tiếng Việt và Tiếng Anh tùy theo ngữ cảnh.' });
    try {
      const ollamaResponse = await ollama.chat({ model: env.AiModel || 'llama3.2', messages: ollamaMessages as any });
      const aiReply = ollamaResponse.message.content;
      await prisma.aiChatMessage.create({ data: { sessionId: currentSessionId!, sender: 'ai', messageText: aiReply } });
      return { response: aiReply, sessionId: currentSessionId! };
    } catch (error) {
      throw new ApiError(500, 'ai_error', 'Bot đang bận.');
    }
  }

}
export const aiService = new AiService();