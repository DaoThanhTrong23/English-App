import { Platform } from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";

// Tự động lấy IP của máy tính đang chạy Expo server để điện thoại kết nối được
function getAutoBackendUrl(): string {
  if (Platform.OS === "web") {
    return "http://localhost:3000";
  }

  // Lấy IP máy tính qua hostUri của Expo
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost") {
      return `http://${ip}:3000`;
    }
  }

  return Platform.OS === "android" ? "http://192.168.100.5:3000" : "http://localhost:3000";
}

export const BACKEND_URL = getAutoBackendUrl();

export interface PhonemeScoreDetail {
  phoneme: string;
  score: number;
  status: "correct" | "poor" | "silent_insertion";
  heardAs: string;
  feedback: string;
}

export interface GOPResult {
  targetWord: string;
  targetIpa: string;
  spokenText: string;
  overallScore: number;
  cefrLevel: string;
  details: {
    vowelAccuracy: number;
    consonantAccuracy: number;
    stressAccuracy: number;
    fluencyScore: number;
  };
  phonemeScores: PhonemeScoreDetail[];
  silentLetterErrors: string[];
  explanation: string;
  improvement: {
    mouthShape: string;
    practiceTip: string;
  };
}

/**
 * Gửi file ghi âm lên Backend AI để chấm điểm phát âm (Duy nhất 1 API này)
 */
export async function evaluatePronunciationAPI(
  audioInput: Blob | string,
  targetWord: string,
  targetIpa: string
): Promise<GOPResult> {
  const apiUrl = `${BACKEND_URL}/api/ai/evaluate-pronunciation`;

  // 1. Mobile Native (Android / iOS): Dùng FileSystem.uploadAsync để không bị lỗi FormData của React Native
  if (Platform.OS !== "web" && typeof audioInput === "string") {
    const uploadResult = await FileSystem.uploadAsync(apiUrl, audioInput, {
      fieldName: "audio",
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters: {
        targetWord,
        targetIpa,
      },
    });

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      let errMsg = `Lỗi máy chủ (${uploadResult.status})`;
      try {
        const errJson = JSON.parse(uploadResult.body);
        if (errJson.message) errMsg = errJson.message;
      } catch {}
      throw new Error(errMsg);
    }

    const json = JSON.parse(uploadResult.body);
    if (!json.success || !json.data) {
      throw new Error(json.message || "Không thể chấm điểm");
    }

    return json.data as GOPResult;
  }

  // 2. Web Browser: Dùng FormData và fetch chuẩn trình duyệt
  const formData = new FormData();

  if (typeof audioInput === "string") {
    const res = await fetch(audioInput);
    const blob = await res.blob();
    formData.append("audio", blob, "recording.wav");
  } else {
    formData.append("audio", audioInput, "recording.wav");
  }

  formData.append("targetWord", targetWord);
  formData.append("targetIpa", targetIpa);

  const response = await fetch(apiUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `Lỗi máy chủ (${response.status})`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || "Không thể chấm điểm");
  }

  return json.data as GOPResult;
}