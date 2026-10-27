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
let whisperInitPromise: Promise<any> | null = null;

async function getWhisperPipeline() {
  if (whisperPipeline) return whisperPipeline;
  if (whisperInitPromise) return await whisperInitPromise;

  whisperInitPromise = (async () => {
    loggers.info("[Whisper ASR] Đang khởi tạo mô hình nhận diện âm học Whisper...");
    const model = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
    loggers.info("[Whisper ASR] Khởi tạo mô hình Whisper thành công!");
    return model;
  })();

  whisperPipeline = await whisperInitPromise;
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

/**
 * Chuẩn hóa hoặc tự động sinh phiên âm IPA cho một từ tiếng Anh
 */
export function resolveIpaForWord(word: string, existingIpa?: string | null): string {
  const clean = (existingIpa || "").replace(/[\/\[\]ˈˌ\.]/g, "").trim();
  if (clean) {
    const rawClean = (existingIpa || "").replace(/[\/\[\]]/g, "").trim();
    return `/${rawClean}/`;
  }

  const lower = word.toLowerCase().trim();
  if (COMMON_IPA_DICT[lower]) {
    const dictClean = COMMON_IPA_DICT[lower].replace(/[\/\[\]]/g, "").trim();
    return `/${dictClean}/`;
  }

  const generated = wordToIpaPhonemes(lower).join("");
  return generated ? `/${generated}/` : `/${lower}/`;
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
  "i": { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "ɪ": { type: "vowel", rounded: false, voiced: true, place: 1, manner: 5, height: 1, backness: 1 },
  "e": { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "ɛ": { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "æ": { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 3, backness: 1 },
  "a": { type: "vowel", rounded: false, voiced: true, place: 2, manner: 5, height: 3, backness: 1 },
  "ʌ": { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 3, backness: 2 },
  "ə": { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "ɜː": { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "ɝ":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "ɚ":  { type: "vowel", rounded: false, voiced: true, place: 4, manner: 5, height: 2, backness: 2 },
  "uː": { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "u":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "ʊ":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 1, backness: 3 },
  "ɔː": { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "ɔ":  { type: "vowel", rounded: true,  voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "ɑː": { type: "vowel", rounded: false, voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "ɑ": { type: "vowel", rounded: false, voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "ɒ": { type: "vowel", rounded: true, voiced: true, place: 6, manner: 5, height: 3, backness: 3 },
  "o": { type: "vowel", rounded: true, voiced: true, place: 6, manner: 5, height: 2, backness: 3 },

  // Nguyên âm đôi
  "oʊ": { type: "diphthong", rounded: true, voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "əʊ": { type: "diphthong", rounded: true, voiced: true, place: 6, manner: 5, height: 2, backness: 3 },
  "aɪ": { type: "diphthong", rounded: false, voiced: true, place: 3, manner: 5, height: 3, backness: 1 },
  "eɪ": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "aʊ": { type: "diphthong", rounded: true, voiced: true, place: 5, manner: 5, height: 3, backness: 3 },
  "ɔɪ": { type: "diphthong", rounded: true, voiced: true, place: 4, manner: 5, height: 2, backness: 1 },
  "ɪə": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 1, backness: 1 },
  "eə": { type: "diphthong", rounded: false, voiced: true, place: 2, manner: 5, height: 2, backness: 1 },
  "ʊə": { type: "diphthong", rounded: true, voiced: true, place: 5, manner: 5, height: 1, backness: 3 },

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


async function convertAnyAudioToWavBuffer(audioBuffer: Buffer): Promise<Buffer> {
  const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).slice(2)}`);
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
    return fs.readFileSync(tempOutput);
  } catch(e) {
    console.error('FFMPEG ERROR IN convertAnyAudioToWavBuffer:', e);
    return audioBuffer;
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}


// ============================================================================
// HÀM XỬ LÝ AN TOÀN JSON & DỰ PHÒNG CHO OLLAMA AI
// ============================================================================
function safeParseAiJson(rawContent: string): any {
  if (!rawContent || typeof rawContent !== 'string') return null;

  try {
    return JSON.parse(rawContent.trim());
  } catch (_) {}

  let cleaned = rawContent.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSub);
    } catch (_) {}

    const withoutTrailingCommas = jsonSub.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(withoutTrailingCommas);
    } catch (_) {}
  }

  return null;
}

function buildFallbackEssayEvaluation(text: string, topic?: string): EssayEvaluationResponse {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" = "A1";
  let baseScore = 6.0;

  if (wordCount < 15) {
    cefrLevel = "A1";
    baseScore = 6.0;
  } else if (wordCount < 30) {
    cefrLevel = "A2";
    baseScore = 7.0;
  } else if (wordCount < 60) {
    cefrLevel = "B1";
    baseScore = 8.0;
  } else if (wordCount < 100) {
    cefrLevel = "B2";
    baseScore = 8.5;
  } else {
    cefrLevel = "C1";
    baseScore = 9.0;
  }

  const grammarScore = Math.min(10, Math.max(5, baseScore));
  const vocabularyScore = Math.min(10, Math.max(5, baseScore));
  const overallScore = Number(((grammarScore + vocabularyScore) / 2).toFixed(1));

  return {
    overallScore,
    cefrLevel,
    grammarScore,
    vocabularyScore,
    feedback: `Bài viết ${topic ? `về chủ đề "${topic}" ` : ""}đạt ${wordCount} từ. Ý tưởng tương đối rõ ràng, câu cú cơ bản hoàn chỉnh và phù hợp với tiêu chuẩn trình độ ${cefrLevel}.`,
    strengths: [
      "Bố cục câu tương đối rõ ràng, truyền đạt được ý tưởng cốt lõi",
      "Sử dụng từ vựng phù hợp với ngữ cảnh yêu cầu"
    ],
    improvements: [
      "Có thể mở rộng thêm câu ghép và trạng từ liên kết để bài viết tự nhiên hơn",
      "Chú ý thêm thì của động từ và mạo từ (a/an/the)"
    ],
    corrections: [],
    improvedVersion: text.trim()
  };
}

class AiService {
  @logExecution()
  async gradeEssay(input: GradeEssayInput): Promise<EssayEvaluationResponse> {
    const prompt = `Bạn là giám khảo chấm thi tiếng Anh chuẩn quốc tế theo khung CEFR (A1, A2, B1, B2, C1, C2).
Hãy chấm điểm và đánh giá đoạn văn sau đây của người học một cách công bằng:
${input.topic ? `Chủ đề: "${input.topic}"` : ""}
Đoạn văn:
"""
${input.text}
"""
Yêu cầu trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc sau (toàn bộ giải thích, nhận xét bằng TIẾNG VIỆT, tuyệt đối không dùng dấu ngoặc kép đôi " bên trong các chuỗi giá trị mà hãy dùng nháy đơn '):
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
      "issue": "giải thích chi tiết vì sao sai (dùng nháy đơn ' để trích dẫn)",
      "suggestion": "câu viết lại chính xác"
    }
  ],
  "improvedVersion": "Đoạn văn viết lại hoàn chỉnh tự nhiên và mượt mà hơn bằng tiếng anh"
}`;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Ollama timeout")), 15000)
      );

      const chatPromise = ollama.chat({
        model: env.AiModel,
        messages: [{ role: "user", content: prompt }],
        format: "json",
      });

      const response = await Promise.race([chatPromise, timeoutPromise]);
      const parsed = safeParseAiJson(response.message.content);

      if (parsed && typeof parsed.overallScore === "number") {
        return {
          overallScore: Number(parsed.overallScore) || 7.0,
          cefrLevel: parsed.cefrLevel || "A2",
          grammarScore: Number(parsed.grammarScore) || 7.0,
          vocabularyScore: Number(parsed.vocabularyScore) || 7.0,
          feedback: parsed.feedback || "Bài viết tương đối tốt.",
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Diễn đạt khá tự nhiên"],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Cần trau chuốt ngữ pháp"],
          corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
          improvedVersion: parsed.improvedVersion || input.text,
        };
      }
      loggers.warn("[gradeEssay] Ollama trả về JSON không chuẩn, chuyển sang fallback.");
    } catch (err: any) {
      loggers.warn(`[gradeEssay] Lỗi khi chấm điểm qua Ollama (${err.message}), kích hoạt thuật toán fallback dự phòng.`);
    }

    return buildFallbackEssayEvaluation(input.text, input.topic);
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
    const normalizedBuffer = await convertAnyAudioToWavBuffer(audioBuffer);
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
    const contextPrompt = [targetSentence].filter(Boolean).join(". ");

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
    const prompt = `Bạn là chuyên gia chấm điểm phát âm tiếng Anh.
  Dưới đây là văn bản được bóc băng từ giọng nói của học viên (transcript):
  ${topic ? `Chủ đề: "${topic}"` : ""}
  ${targetSentence ? `Câu gốc cần đọc: "${targetSentence}"` : ""}
  
  Văn bản học viên thực tế đã nói:
  """
  ${transcript}
  """
  
  LƯU Ý CHẤM ĐIỂM (BÀI TẬP ĐỌC THEO MẪU - READ ALOUD):
  1. Hãy đối chiếu từng từ của "Văn bản học viên thực tế đã nói" với "Câu gốc cần đọc".
  2. Nếu học viên đọc khớp hoàn toàn, hãy cho điểm từ 8.5 đến 9.5 (Tuyệt đối không cho 10/10).
  3. Nếu có TỪ BỊ LỆCH, THIẾU TỪ, HOẶC TỪ LẠ (do phát âm sai nên hệ thống nghe nhầm), hãy TRỪ ĐIỂM NẶNG TAY (sai 1 từ trừ 1.5 - 2 điểm). Nếu sai quá nhiều, hãy cho dưới 5.0.
  4. Liệt kê rõ những từ phát âm sai vào phần 'corrections' để học viên sửa.
  
  Hãy đánh giá và trả về kết quả ĐÚNG định dạng JSON sau (toàn bộ nhận xét bằng TIẾNG VIỆT):
  {
    "overallScore": number (thang 10.0, ví dụ 7.5),
    "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "grammarScore": number (thang 10),
    "vocabularyScore": number (thang 10),
    "coherenceScore": number (thang 10),
    "feedback": "Nhận xét tổng quan về độ chính xác khi phát âm so với câu gốc",
    "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
    "improvements": ["Điểm cần khắc phục 1", "Điểm cần khắc phục 2"],
    "corrections": [
      {
        "original": "Từ học viên phát âm sai (hoặc thiếu)",
        "issue": "Giải thích vì sao sai hoặc khác biệt so với câu gốc",
        "suggestion": "Cách đọc đúng của từ đó"
      }
    ],
    "improvedVersion": "Câu gốc hoàn chỉnh (để học viên luyện lại)"
  }`;
  
      const response = await ollama.chat({
      model: env.AiModel,
      messages: [{ role: "user", content: prompt }],
      format: "json",
    });

    const evaluation = safeParseAiJson(response.message.content) || {
      overallScore: 8.0,
      cefrLevel: "A2",
      grammarScore: 8.0,
      vocabularyScore: 8.0,
      coherenceScore: 8.0,
      feedback: "Bạn đã hoàn thành bài nói khá tốt, phát âm tương đối rõ ràng.",
      strengths: ["Phát âm rõ ràng", "Tốc độ nói ổn định"],
      improvements: ["Chú ý ngữ điệu tự nhiên hơn"],
      corrections: [],
      improvedVersion: targetSentence || transcript,
    };
    return {
      transcript,
      ...evaluation,
    } as SpeakingEvaluationResponse;
  }
  // ============================================================================
  // THUẬT TOÁN CHẤM ĐIỂM PHÁT ÂM PHÂN TẦNG (MULTI-LEVEL & ACCENT-TOLERANT ASSESSMENT)
  // ============================================================================
  @logExecution()
  async evaluatePronunciationGOP(
    audioBuffer: Buffer,
    targetWord: string,
    targetIpa?: string
  ): Promise<PronunciationEvaluationResponse> {
    const transcriber = await getWhisperPipeline();

    // Tự động phân giải hoặc dự đoán IPA nếu client không truyền hoặc truyền rỗng / chỉ có dấu gạch
    let resolvedIpa = (targetIpa || "").replace(/[\/\[\]]/g, "").trim();
    if (!resolvedIpa) {
      const lower = targetWord.toLowerCase().trim();
      if (COMMON_IPA_DICT[lower]) {
        resolvedIpa = COMMON_IPA_DICT[lower].replace(/[\/\[\]]/g, "").trim();
      } else {
        try {
          const dbWord = await prisma.word.findFirst({
            where: { headword: targetWord.trim() },
            select: { phonetic: true },
          });
          if (dbWord?.phonetic) {
            resolvedIpa = dbWord.phonetic.replace(/[\/\[\]]/g, "").trim();
          }
        } catch (err: any) {
          loggers.warn(`[Whisper ASR] Lỗi tra cứu IPA từ DB cho từ "${targetWord}": ${err?.message || err}`);
        }
      }

      // Nếu DB cũng không có hoặc không tìm thấy, dùng bộ sinh âm vị theo luật (Rule-based G2P)
      if (!resolvedIpa) {
        resolvedIpa = wordToIpaPhonemes(targetWord).join("");
      }
    }

    const formattedTargetIpa = resolvedIpa ? (resolvedIpa.startsWith("/") ? resolvedIpa : `/${resolvedIpa}/`) : `/${targetWord.toLowerCase().trim()}/`;
    let expectedPhonemes = splitIpaPhonemes(resolvedIpa);
    if (expectedPhonemes.length === 0) {
      expectedPhonemes = wordToIpaPhonemes(targetWord);
    }

    // 1. Chuẩn hóa Audio sang Float32 PCM 16kHz
    const audioFloat32 = await audioBufferToFloat32Array(audioBuffer);
    if (audioFloat32.length < 1600) {
      return {
        targetWord,
        targetIpa: formattedTargetIpa,
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

    loggers.info(`[Whisper ASR] Target: "${targetWord}" (${formattedTargetIpa}) | Whisper nghe thấy: "${rawTranscript}" (clean: "${cleanSpoken}")`);

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
      targetIpa: formattedTargetIpa,
      spokenText,
      overallScore,
      cefrLevel: overallScore >= 95 ? "C2" : overallScore >= 85 ? "C1" : overallScore >= 75 ? "B2" : overallScore >= 60 ? "B1" : overallScore >= 45 ? "A2" : "A1",
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