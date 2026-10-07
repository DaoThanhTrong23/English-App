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

import { pipeline, env as transformersEnv } from "@xenova/transformers";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const { WaveFile } = pkg;
const execFileAsync = promisify(execFile);

// Cấu hình môi trường cho HuggingFace Transformers
transformersEnv.allowLocalModels = false;

// ============================================================================
// 1. NẠP MÔ HÌNH WHISPER ASR (XENOVA/WHISPER-TINY.EN)
// ============================================================================
let whisperPipeline: any = null;

async function getWhisperPipeline() {
  if (!whisperPipeline) {
    loggers.info("[Whisper ASR] Đang khởi tạo mô hình nhận diện âm học Whisper...");
    whisperPipeline = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
    loggers.info("[Whisper ASR] Khởi tạo mô hình Whisper thành công!");
  }
  return whisperPipeline;
}

// ============================================================================
// 2. TỪ ĐIỂN ÂM VỊ IPA & G2P ENGINE (GRAPHEME-TO-PHONEME)
// ============================================================================
const COMMON_IPA_DICT: Record<string, string> = {
  hello: "həˈloʊ",
  knight: "naɪt",
  doubt: "daʊt",
  comfortable: "ˈkʌm.fər.tə.bəl",
  psychology: "saɪˈkɒl.ə.dʒi",
  schedule: "ˈskedʒ.uːl",
  apple: "ˈæp.əl",
  banana: "bəˈnæn.ə",
  orange: "ˈɒr.ɪndʒ",
  water: "ˈwɔː.tər",
  world: "wɜːld",
  english: "ˈɪŋ.ɡlɪʃ",
  people: "ˈpiː.pəl",
  school: "skuːl",
  teacher: "ˈtiː.tʃər",
  student: "ˈstjuː.dənt",
  book: "bʊk",
  computer: "kəmˈpjuː.tər",
  music: "ˈmjuː.zɪk",
  friend: "frend",
  family: "ˈfæm.əl.i",
  thank: "θæŋk",
  think: "θɪŋk",
  this: "ðɪs",
  that: "ðæt",
  with: "wɪð",
  good: "ɡʊd",
  great: "ɡreɪt",
  morning: "ˈmɔː.nɪŋ",
  night: "naɪt",
  love: "lʌv",
  life: "laɪf",
  time: "taɪm",
  house: "haʊs",
  city: "ˈsɪt.i",
  country: "ˈkʌn.tri",
};

/**
 * Phân tách chuỗi phiên âm IPA thành danh sách các âm vị riêng lẻ
 */
function splitIpaPhonemes(ipa: string): string[] {
  const clean = ipa.replace(/[\/\[\]ˈˌ\.]/g, "").trim();
  const multiCharPhonemes = [
    "oʊ", "əʊ", "aɪ", "eɪ", "aʊ", "ɔɪ",
    "tʃ", "dʒ",
    "iː", "uː", "ɑː", "ɔː", "ɜː",
    "ɪə", "eə", "ʊə"
  ];
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
      if (clean[i].trim().length > 0) {
        result.push(clean[i]);
      }
      i++;
    }
  }
  return result;
}

/**
 * Chuyển một từ tiếng Anh sang chuỗi âm vị IPA (Rule-based G2P Fallback)
 */
function wordToIpaPhonemes(word: string): string[] {
  const lower = word.toLowerCase().trim();
  if (COMMON_IPA_DICT[lower]) {
    return splitIpaPhonemes(COMMON_IPA_DICT[lower]);
  }

  // Chuyển đổi ngữ âm gần đúng theo luật phát âm tiếng Anh
  const phonemes: string[] = [];
  let i = 0;

  while (i < lower.length) {
    const two = lower.substring(i, i + 2);
    if (two === "th") { phonemes.push("θ"); i += 2; }
    else if (two === "sh") { phonemes.push("ʃ"); i += 2; }
    else if (two === "ch") { phonemes.push("tʃ"); i += 2; }
    else if (two === "ph") { phonemes.push("f"); i += 2; }
    else if (two === "ng") { phonemes.push("ŋ"); i += 2; }
    else if (two === "ck") { phonemes.push("k"); i += 2; }
    else if (two === "ee" || two === "ea") { phonemes.push("iː"); i += 2; }
    else if (two === "oo") { phonemes.push("uː"); i += 2; }
    else if (two === "ou" || two === "ow") { phonemes.push("aʊ"); i += 2; }
    else if (two === "ai" || two === "ay") { phonemes.push("eɪ"); i += 2; }
    else if (two === "oi" || two === "oy") { phonemes.push("ɔɪ"); i += 2; }
    else {
      const c = lower[i];
      if (c === "a") phonemes.push("æ");
      else if (c === "e") phonemes.push("e");
      else if (c === "i") phonemes.push("ɪ");
      else if (c === "o") phonemes.push("ɒ");
      else if (c === "u") phonemes.push("ʌ");
      else if (/[b-df-hj-np-tv-z]/.test(c)) phonemes.push(c);
      i++;
    }
  }

  return phonemes.length > 0 ? phonemes : [lower];
}

// ============================================================================
// 3. MA TRẬN ĐẶC TRƯNG NGỮ ÂM SINH HỌC & ĐO ĐỘ TƯƠNG ĐỒNG (PHONETIC MATRIX & ALLOPHONES)
// ============================================================================
interface PhoneticVector {
  type: "vowel" | "consonant" | "diphthong";
  rounded: boolean;
  voiced: boolean;
  place: number;   // 1: Môi, 2: Răng-môi, 3: Nướu răng, 4: Sau nướu răng, 5: Vòm họng cứng, 6: Ngạc mềm, 7: Thanh môn
  manner: number;  // 1: Âm bật (Plosive), 2: Âm xát (Fricative), 3: Âm mũi (Nasal), 4: Âm tiếp cận/lỏng (Liquid), 5: Nguyên âm/Lướt (Glide)
  height?: number; // 1: Đóng/Cao, 2: Vừa, 3: Mở/Thấp
  backness?: number; // 1: Trước, 2: Giữa, 3: Sau
}

const PHONETIC_MATRIX: Record<string, PhoneticVector> = {
  // Nguyên âm đơn
  "iː": { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "i":  { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "ɪ":  { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "e":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "ɛ":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "æ":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 3, backness: 1 },
  "a":  { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 3, backness: 1 },
  "ʌ":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 3, backness: 2 },
  "ə":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "ɜː": { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "ɝ":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "ɚ":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "uː": { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "u":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "ʊ":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "ɔː": { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "ɔ":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "ɑː": { type: "vowel", rounded: false, voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "ɑ":  { type: "vowel", rounded: false, voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "ɒ":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "o":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },

  // Nguyên âm đôi
  "oʊ": { type: "diphthong", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "əʊ": { type: "diphthong", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "aɪ": { type: "diphthong", rounded: false, voiced: true, place: 3, manner: 5, height: 3, backness: 1 },
  "eɪ": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "aʊ": { type: "diphthong", rounded: true,  voiced: true, place: 5, manner: 5, height: 3, backness: 3 },
  "ɔɪ": { type: "diphthong", rounded: true,  voiced: true, place: 4, manner: 5, height: 2, backness: 1 },
  "ɪə": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 1, backness: 1 },
  "eə": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "ʊə": { type: "diphthong", rounded: true,  voiced: true, place: 5, manner: 5, height: 1, backness: 3 },

  // Phụ âm
  "p":  { type: "consonant", rounded: false, voiced: false, place: 1, manner: 1 },
  "b":  { type: "consonant", rounded: false, voiced: true,  place: 1, manner: 1 },
  "t":  { type: "consonant", rounded: false, voiced: false, place: 3, manner: 1 },
  "d":  { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 1 },
  "ɾ":  { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 1 }, // Flap T/D (Mỹ)
  "k":  { type: "consonant", rounded: false, voiced: false, place: 6, manner: 1 },
  "ɡ":  { type: "consonant", rounded: false, voiced: true,  place: 6, manner: 1 },
  "g":  { type: "consonant", rounded: false, voiced: true,  place: 6, manner: 1 },
  "f":  { type: "consonant", rounded: false, voiced: false, place: 2, manner: 2 },
  "v":  { type: "consonant", rounded: false, voiced: true,  place: 2, manner: 2 },
  "θ":  { type: "consonant", rounded: false, voiced: false, place: 3, manner: 2 },
  "ð":  { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 2 },
  "s":  { type: "consonant", rounded: false, voiced: false, place: 3, manner: 2 },
  "z":  { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 2 },
  "ʃ":  { type: "consonant", rounded: true,  voiced: false, place: 4, manner: 2 },
  "ʒ":  { type: "consonant", rounded: true,  voiced: true,  place: 4, manner: 2 },
  "tʃ": { type: "consonant", rounded: true,  voiced: false, place: 4, manner: 1 },
  "dʒ": { type: "consonant", rounded: true,  voiced: true,  place: 4, manner: 1 },
  "h":  { type: "consonant", rounded: false, voiced: false, place: 7, manner: 2 },
  "m":  { type: "consonant", rounded: false, voiced: true,  place: 1, manner: 3 },
  "n":  { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 3 },
  "ŋ":  { type: "consonant", rounded: false, voiced: true,  place: 6, manner: 3 },
  "l":  { type: "consonant", rounded: false, voiced: true,  place: 3, manner: 4 },
  "r":  { type: "consonant", rounded: true,  voiced: true,  place: 4, manner: 4 },
  "ɹ":  { type: "consonant", rounded: true,  voiced: true,  place: 4, manner: 4 },
  "j":  { type: "consonant", rounded: false, voiced: true,  place: 5, manner: 5 },
  "w":  { type: "consonant", rounded: true,  voiced: true,  place: 1, manner: 5 },
};

// Danh sách các nhóm biến thể phát âm tự nhiên (Allophones & Accent Variations: US vs UK, Connected Speech)
const ALLOPHONE_SETS: string[][] = [
  ["t", "d", "ɾ"],                     // Flap T trong tiếng Mỹ (water, better, city)
  ["r", "ɹ", "ɚ", "ɝ"],                // Biến thể âm R (Rhoticity)
  ["ə", "ʌ", "ɪ", "i"],                // Giảm nguyên âm / Neutral schwa in natural speech
  ["iː", "i", "ɪ"],                    // Long/short high front vowels
  ["uː", "u", "ʊ"],                    // Long/short high back vowels
  ["eɪ", "e", "ɛ"],                    // Front mid vowels / diphthongs
  ["oʊ", "əʊ", "o", "ɔː", "ɒ"],        // Diphthong variations (US /oʊ/ vs UK /əʊ/) & Cot-caught merger
  ["ɑː", "ɑ", "ɒ", "ɔː", "ʌ"],         // Low back vowels merger (father-bother, water)
  ["æ", "a", "ɑː", "e"],               // Low front vowels (bath-trap split)
  ["s", "z"],                          // Sibilant voicing lenition in connected speech
  ["θ", "ð", "t", "d", "f", "v"],      // Dental fricative natural approximations
  ["ʃ", "ʒ", "tʃ", "dʒ"],              // Post-alveolar fricatives/affricates
  ["ɡ", "g", "k"],                     // Velar stops
];

/**
 * Đo độ tương đồng ngữ âm sinh học và biến thể âm (Allophone & Accent Aware)
 */
function computePhoneticSimilarity(p1: string, p2: string): number {
  if (!p1 || !p2) return 0.0;
  if (p1 === p2) return 1.0;

  const norm1 = p1.replace("ɡ", "g").replace("ɹ", "r").replace("ɝ", "ɜː").replace("ɚ", "ə");
  const norm2 = p2.replace("ɡ", "g").replace("ɹ", "r").replace("ɝ", "ɜː").replace("ɚ", "ə");
  if (norm1 === norm2) return 1.0;

  // Kiểm tra nếu 2 âm thuộc cùng nhóm Allophone / Accent tự nhiên
  for (const set of ALLOPHONE_SETS) {
    if (set.includes(p1) && set.includes(p2)) {
      return 0.92; // Điểm tương đương cực cao cho biến thể chuẩn của người bản xứ
    }
  }

  const v1 = PHONETIC_MATRIX[p1] || PHONETIC_MATRIX[norm1];
  const v2 = PHONETIC_MATRIX[p2] || PHONETIC_MATRIX[norm2];
  if (!v1 || !v2) return 0.25;

  const isVowel1 = v1.type === "vowel" || v1.type === "diphthong";
  const isVowel2 = v2.type === "vowel" || v2.type === "diphthong";
  if (isVowel1 !== isVowel2) return 0.10;

  let matchScore = 0;
  let totalWeights = 0;

  // 1. Dây thanh (Voicing) - Dung sai cao hơn trong văn nói
  totalWeights += 1;
  if (v1.voiced === v2.voiced) matchScore += 1;
  else matchScore += 0.5; // Cùng vị trí nhưng khác thanh tính vẫn tính điểm khá

  // 2. Vị trí cấu âm (Place)
  totalWeights += 3;
  const placeDiff = Math.abs(v1.place - v2.place);
  matchScore += Math.max(0, 3 - placeDiff);

  // 3. Phương thức cấu âm (Manner)
  totalWeights += 3;
  const mannerDiff = Math.abs(v1.manner - v2.manner);
  matchScore += Math.max(0, 3 - mannerDiff);

  // 4. Nguyên âm: Độ mở & độ lùi của lưỡi
  if (isVowel1 && isVowel2) {
    totalWeights += 3;
    if (v1.rounded === v2.rounded) matchScore += 1;
    if (v1.height && v2.height) matchScore += Math.max(0, 1 - Math.abs(v1.height - v2.height) * 0.4);
    if (v1.backness && v2.backness) matchScore += Math.max(0, 1 - Math.abs(v1.backness - v2.backness) * 0.4);
  }

  const baseSim = matchScore / totalWeights;
  // Làm mượt đường cong tương đồng (Curve smoothing) để thân thiện hơn với người bản xứ
  return Math.min(1.0, Math.max(0.1, Math.pow(baseSim, 0.75)));
}

/**
 * Thuật toán Căn chỉnh chuỗi âm vị tối ưu động (Needleman-Wunsch Dynamic Alignment)
 */
function alignPhonemeSequences(
  expected: string[],
  spoken: string[]
): Array<{ expected: string; spoken: string | null; similarity: number }> {
  const n = expected.length;
  const m = spoken.length;
  const GAP_PENALTY = -0.25;

  if (n === 0) return [];
  if (m === 0) {
    return expected.map((p) => ({ expected: p, spoken: null, similarity: 0.1 }));
  }

  // Khởi tạo bảng DP
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i * GAP_PENALTY;
  for (let j = 0; j <= m; j++) dp[0][j] = j * GAP_PENALTY;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchScore = computePhoneticSimilarity(expected[i - 1], spoken[j - 1]);
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + matchScore, // Match / Mismatch
        dp[i - 1][j] + GAP_PENALTY,     // Deletion / Omission
        dp[i][j - 1] + GAP_PENALTY      // Insertion
      );
    }
  }

  // Truy vết (Backtracking)
  let i = n;
  let j = m;
  const alignment: Array<{ expected: string; spoken: string | null; similarity: number }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const matchSim = computePhoneticSimilarity(expected[i - 1], spoken[j - 1]);
      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchSim)) < 1e-4) {
        alignment.unshift({ expected: expected[i - 1], spoken: spoken[j - 1], similarity: matchSim });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + GAP_PENALTY)) < 1e-4) {
      alignment.unshift({ expected: expected[i - 1], spoken: null, similarity: 0.2 });
      i--;
    } else if (j > 0) {
      j--;
    } else {
      i--;
    }
  }

  return alignment;
}

/**
 * Tính khoảng cách Levenshtein và độ tương đồng văn bản giữa chuỗi người nói và từ mục tiêu
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, (maxLen - distance) / maxLen);
}

const SILENT_LETTER_RULES = [
  { pattern: /^kn/i, letter: "K", sound: "k", explanation: "Chữ 'K' đứng trước 'N' ở đầu từ là âm câm (như trong Knight, Knee, Knife)." },
  { pattern: /mb$|bt/i, letter: "B", sound: "b", explanation: "Chữ 'B' đứng sau 'M' hoặc trước 'T' là âm câm (như trong Climb, Doubt, Comb)." },
  { pattern: /^ps|^pn|^pt/i, letter: "P", sound: "p", explanation: "Chữ 'P' đứng trước 'S', 'N', 'T' ở đầu từ là âm câm (như trong Psychology, Pneumonia)." },
  { pattern: /^wr/i, letter: "W", sound: "w", explanation: "Chữ 'W' đứng trước 'R' là âm câm (như trong Write, Wrong, Wrist)." },
  { pattern: /gh/i, letter: "GH", sound: "g", explanation: "Tổ hợp 'GH' trong từ này là âm câm (như trong Night, Thought, Through)." },
  { pattern: /alk|alf|alm/i, letter: "L", sound: "l", explanation: "Chữ 'L' trong tổ hợp này là âm câm (như trong Talk, Walk, Half, Calm)." },
];

/**
 * Chuyển đổi audio sang Float32Array 16kHz chuẩn Mono
 */
async function audioBufferToFloat32Array(audioBuffer: Buffer): Promise<Float32Array> {
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
  // THUẬT TOÁN CHẤM ĐIỂM PHÁT ÂM PHÂN TẦNG (MULTI-LEVEL & ACCENT-TOLERANT ASSESSMENT)
  // ============================================================================
  @logExecution()
  async evaluatePronunciationGOP(
    audioBuffer: Buffer,
    targetWord: string,
    targetIpa: string
  ): Promise<PronunciationEvaluationResponse> {
    const transcriber = await getWhisperPipeline();
    const expectedPhonemes = splitIpaPhonemes(targetIpa);

    // 1. Chuẩn hóa Audio sang Float32 PCM 16kHz
    const audioFloat32 = await audioBufferToFloat32Array(audioBuffer);
    if (audioFloat32.length < 1600) {
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

    // 2. Chạy Whisper ASR trích xuất văn bản nghe được
    const asrResult = await transcriber(audioFloat32);
    const rawTranscript = (asrResult?.text || "").trim();
    const cleanSpoken = rawTranscript.replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase().trim();
    const targetClean = targetWord.toLowerCase().trim();

    loggers.info(`[Whisper ASR] Target: "${targetWord}" (${targetIpa}) | Whisper nghe thấy: "${rawTranscript}" (clean: "${cleanSpoken}")`);

    // 3. Chuyển chuỗi nghe được sang âm vị IPA thực tế
    const spokenPhonemes = wordToIpaPhonemes(cleanSpoken || rawTranscript);
    const spokenText = rawTranscript || "(không rõ âm)";

    // 4. ĐÁNH GIÁ TẦNG 1: Intelligibility Score (~55% trọng số)
    const wordSim = calculateStringSimilarity(cleanSpoken, targetClean);
    const isExactWordMatch = cleanSpoken === targetClean || cleanSpoken.includes(targetClean) || targetClean.includes(cleanSpoken);

    let intelligibilityScore = 0;
    if (isExactWordMatch) {
      intelligibilityScore = 100;
    } else if (wordSim >= 0.8) {
      intelligibilityScore = Math.round(88 + wordSim * 12);
    } else if (wordSim >= 0.6) {
      intelligibilityScore = Math.round(70 + wordSim * 20);
    } else if (wordSim >= 0.3) {
      intelligibilityScore = Math.round(40 + wordSim * 30);
    } else {
      intelligibilityScore = Math.round(Math.max(15, wordSim * 40));
    }

    // 5. ĐÁNH GIÁ TẦNG 2: Căn chỉnh động (Dynamic Alignment) & Phoneme-level Accuracy (~30% trọng số)
    const alignedResults = alignPhonemeSequences(expectedPhonemes, spokenPhonemes);
    const phonemeScores: PhonemeScoreDetail[] = [];
    const silentErrors: string[] = [];
    const explanations: string[] = [];
    let mouthTips = "";

    for (let i = 0; i < alignedResults.length; i++) {
      const { expected: p, spoken: matchedSpoken, similarity } = alignedResults[i];

      let score = 0;
      if (isExactWordMatch) {
        // Khi từ đã được người bản xứ phát âm trọn vẹn và nhận diện chính xác
        score = similarity >= 0.7 ? 95 : Math.round(85 + similarity * 10);
      } else if (similarity >= 0.85) {
        score = Math.round(90 + similarity * 10);
      } else if (similarity >= 0.65) {
        score = Math.round(75 + similarity * 15);
      } else if (similarity >= 0.45) {
        score = Math.round(58 + similarity * 20);
      } else if (similarity >= 0.25) {
        score = Math.round(38 + similarity * 20);
      } else {
        score = Math.round(Math.max(15, similarity * 35));
      }

      score = Math.max(10, Math.min(100, score));
      // Ngưỡng đạt: >= 50% được xem là đúng hoặc biến thể chấp nhận được (nới lỏng cho văn nói tự nhiên)
      const isCorrect = score >= 50;
      const heardAs = matchedSpoken || "bỏ qua (nuốt âm)";

      let feedback = isCorrect ? "Phát âm chuẩn xác" : `Bị lệch sang âm /${heardAs}/`;

      // Phân tích sư phạm
      const vExp = PHONETIC_MATRIX[p];
      const vHeard = matchedSpoken ? PHONETIC_MATRIX[matchedSpoken] : null;

      if (vExp && vHeard && !isCorrect) {
        if (vExp.rounded && !vHeard.rounded) {
          feedback = "Chưa chu tròn môi (bị dẹt miệng)";
          mouthTips += `Ở âm /${p}/: Hãy chu tròn môi lại thay vì dẹt miệng. `;
          explanations.push(`Âm /${p}/ bị dẹt môi thành /${heardAs}/.`);
        } else if (vExp.type === "diphthong" && vHeard.type === "vowel") {
          feedback = "Bị đọc thành nguyên âm đơn (thiếu âm lướt đuôi)";
          mouthTips += `Ở nguyên âm đôi /${p}/: Kéo dài và lướt nhẹ sang âm đuôi. `;
          explanations.push(`Bạn đọc /${p}/ thành nguyên âm đơn ngắn /${heardAs}/.`);
        } else if (vExp.manner === 1 && score < 45 && i === alignedResults.length - 1) {
          feedback = "Bị nuốt âm đuôi (ending sound)";
          mouthTips += `Chú ý bật nhẹ âm đuôi /${p}/ ở cuối từ. `;
        }
      }

      phonemeScores.push({
        phoneme: p,
        score,
        status: isCorrect ? "correct" : "poor",
        heardAs,
        feedback,
      });
    }

    // 6. Kiểm tra lỗi âm câm (Silent Letter Rules) - Chỉ cảnh báo nếu từ bị đọc sai rõ rệt
    if (!isExactWordMatch) {
      for (const rule of SILENT_LETTER_RULES) {
        if (rule.pattern.test(targetWord)) {
          if (spokenPhonemes.includes(rule.sound) || spokenPhonemes.includes(rule.sound.toLowerCase())) {
            silentErrors.push(`Lỗi âm câm: ${rule.explanation}`);
          }
        }
      }
    }

    // 7. ĐÁNH GIÁ TẦNG 3: Fluency & Prosody (~15% trọng số)
    const validScores = phonemeScores.map((x) => x.score);
    const phonemeAccuracy = Math.round(validScores.reduce((a, b) => a + b, 0) / Math.max(1, validScores.length));
    const fluencyScore = Math.min(100, Math.max(35, Math.round(intelligibilityScore * 0.7 + phonemeAccuracy * 0.3)));

    // 8. TỔNG HỢP ĐIỂM SỐ PHÂN TẦNG:
    // 55% Intelligibility (ASR Recognition) + 30% Phoneme Accuracy + 15% Fluency
    let overallScore = Math.round(
      intelligibilityScore * 0.55 + phonemeAccuracy * 0.30 + fluencyScore * 0.15
    );

    if (isExactWordMatch) {
      overallScore = Math.max(88, overallScore);
    }
    if (silentErrors.length > 0) {
      overallScore = Math.max(20, overallScore - silentErrors.length * 8);
    }
    overallScore = Math.min(100, Math.max(5, overallScore));

    const vowelScores = phonemeScores.filter((p) => PHONETIC_MATRIX[p.phoneme]?.type.includes("vowel") || PHONETIC_MATRIX[p.phoneme]?.type === "diphthong");
    const consonantScores = phonemeScores.filter((p) => PHONETIC_MATRIX[p.phoneme]?.type === "consonant");

    const vowelAccuracy = vowelScores.length > 0
      ? Math.round(vowelScores.reduce((a, b) => a + b.score, 0) / vowelScores.length)
      : overallScore;

    const consonantAccuracy = consonantScores.length > 0
      ? Math.round(consonantScores.reduce((a, b) => a + b.score, 0) / consonantScores.length)
      : overallScore;

    const stressAccuracy = Math.max(40, Math.min(100, Math.round(intelligibilityScore * 0.6 + phonemeAccuracy * 0.4)));

    return {
      targetWord,
      targetIpa,
      spokenText,
      overallScore,
      cefrLevel: overallScore >= 85 ? "B2" : overallScore >= 70 ? "B1" : overallScore >= 50 ? "A2" : "A1",
      details: {
        vowelAccuracy,
        consonantAccuracy,
        stressAccuracy,
        fluencyScore,
      },
      phonemeScores,
      silentLetterErrors: silentErrors,
      explanation: explanations.length > 0
        ? explanations.join(" ")
        : overallScore >= 75
        ? "Bạn phát âm rất tự nhiên, rõ ràng và dễ hiểu đối với người bản xứ."
        : "Âm phát ra cơ bản đã hiểu được, hãy tiếp tục duy trì và chỉnh nhẹ các âm vị chưa chuẩn.",
      improvement: {
        mouthShape: mouthTips || (overallScore >= 75 ? "Khẩu hình tự nhiên, độ mở miệng và thả lỏng cơ mặt rất tốt." : "Mở rộng khẩu hình miệng và giữ luồng hơi đều."),
        practiceTip: overallScore >= 75 ? "Hãy tiếp tục phát huy ở các mẫu câu dài và ngữ điệu tự nhiên." : "Hãy nghe lại âm mẫu và đọc thong thả từng âm tiết trước khi ghép từ.",
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