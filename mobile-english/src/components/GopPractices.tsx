import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { evaluatePronunciationAPI, GOPResult } from "../service/gopNativeService";

interface Props {
  word: string;
  ipa: string;
}

export default function GopPractice({ word, ipa }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GOPResult | null>(null);

  // Hook thu âm chuẩn của expo-audio (Dành cho Mobile)
  const mobileRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Thu âm trên Web
  const webRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);

  // Bắt đầu thu âm
  const startRecording = async () => {
    try {
      setResult(null);

      // 1. Trình duyệt Web
      if (Platform.OS === "web") {
        if (!navigator?.mediaDevices?.getUserMedia) {
          Alert.alert("Lỗi Micro", "Trình duyệt không hỗ trợ Web Audio.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        webRecorderRef.current = recorder;
        webChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) webChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(webChunksRef.current, { type: "audio/wav" });
          await sendAudioToBackend(blob);
        };

        recorder.start();
        setIsRecording(true);
        return;
      }

      // 2. Điện thoại Mobile (Dùng expo-audio chính thức)
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Quyền Micro", "Vui lòng cho phép ứng dụng sử dụng micro để luyện nói.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await mobileRecorder.prepareToRecordAsync();
      mobileRecorder.record();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Lỗi mở micro:", err);
      Alert.alert("Lỗi Micro", err.message || "Không thể bật micro thu âm.");
    }
  };

  // Dừng thu âm và gửi thẳng lên Backend
  const stopRecording = async () => {
    setIsRecording(false);
    setLoading(true);

    try {
      if (Platform.OS === "web") {
        if (webRecorderRef.current && webRecorderRef.current.state !== "inactive") {
          webRecorderRef.current.stop();
          webRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
      } else {
        await mobileRecorder.stop();
        const recordedUri = mobileRecorder.uri;
        if (recordedUri) {
          await sendAudioToBackend(recordedUri);
        } else {
          Alert.alert("Lỗi Thu Âm", "Không lấy được file ghi âm.");
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Lỗi dừng thu âm:", err);
      setLoading(false);
    }
  };

  // Gửi file âm thanh lên Backend AI chấm điểm
  const sendAudioToBackend = async (audioData: Blob | string) => {
    try {
      const data = await evaluatePronunciationAPI(audioData, word, ipa);
      setResult(data);
    } catch (err: any) {
      Alert.alert("Lỗi Chấm Điểm", err.message || "Không thể kết nối đến Backend AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.word}>{word}</Text>
      <Text style={styles.ipa}>{ipa}</Text>

      {/* Nút bấm Micro */}
      <TouchableOpacity
        style={[styles.btn, isRecording ? styles.btnRecording : styles.btnNormal]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {isRecording ? "⏹️ Dừng đọc" : "🎙️ Bấm để đọc"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Hiển thị kết quả JSON từ Backend */}
      {result && (
        <View style={styles.resultBox}>
          {/* Điểm tổng */}
          <Text style={styles.scoreText}>
            Điểm chuẩn:{" "}
            <Text
              style={{
                color:
                  result.overallScore >= 75
                    ? "#16a34a"
                    : result.overallScore >= 40
                    ? "#ca8a04"
                    : "#dc2626",
              }}
            >
              {result.overallScore}%
            </Text>
          </Text>

          {/* Âm máy nghe thấy */}
          <Text style={styles.spokenLabel}>
            AI nghe thấy: <Text style={styles.spokenBold}>"{result.spokenText}"</Text>
          </Text>

          {/* Chi tiết từng âm vị */}
          <View style={styles.phonemeRow}>
            {result.phonemeScores?.map((p, idx) => (
              <View
                key={idx}
                style={[
                  styles.badge,
                  p.status === "correct" ? styles.badgeGreen : styles.badgeRed,
                ]}
              >
                <Text style={styles.badgeText}>/{p.phoneme}/</Text>
                <Text style={styles.subScore}>{p.score}%</Text>
              </View>
            ))}
          </View>

          {/* Cảnh báo âm câm */}
          {result.silentLetterErrors?.length > 0 && (
            <View style={styles.silentCard}>
              {result.silentLetterErrors.map((err, i) => (
                <Text key={i} style={styles.silentText}>
                  ⚠️ {err}
                </Text>
              ))}
            </View>
          )}

          {/* Giải thích & Hướng dẫn khẩu hình */}
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>🔍 Phân tích ngữ âm:</Text>
            <Text style={styles.feedbackDesc}>{result.explanation}</Text>

            {result.improvement?.mouthShape ? (
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>👄 Khẩu hình & Vị trí lưỡi:</Text>
                <Text style={styles.tipDesc}>{result.improvement.mouthShape}</Text>
                {result.improvement.practiceTip ? (
                  <Text style={styles.practiceDesc}>💡 {result.improvement.practiceTip}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  word: { fontSize: 32, fontWeight: "bold", color: "#0f172a" },
  ipa: {
    fontSize: 18,
    color: "#2563eb",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  btn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, elevation: 3 },
  btnNormal: { backgroundColor: "#2563eb" },
  btnRecording: { backgroundColor: "#ef4444" },
  btnText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  resultBox: { marginTop: 24, width: "100%", alignItems: "center" },
  scoreText: { fontSize: 22, fontWeight: "bold", marginBottom: 6, color: "#1e293b" },
  spokenLabel: { fontSize: 14, color: "#64748b", marginBottom: 14 },
  spokenBold: { fontWeight: "bold", color: "#0f172a" },
  phonemeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: "center", minWidth: 55 },
  badgeGreen: { backgroundColor: "#dcfce7", borderColor: "#86efac", borderWidth: 1 },
  badgeRed: { backgroundColor: "#fee2e2", borderColor: "#fca5a5", borderWidth: 1 },
  badgeText: { fontWeight: "bold", fontSize: 16, color: "#0f172a" },
  subScore: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: "600" },
  silentCard: {
    padding: 10,
    backgroundColor: "#fff1f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecdd3",
    width: "100%",
    marginBottom: 12,
  },
  silentText: { color: "#e11d48", fontSize: 13, fontWeight: "600" },
  feedbackCard: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  feedbackTitle: { fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  feedbackDesc: { fontSize: 13, color: "#475569", lineHeight: 20 },
  tipBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  tipTitle: { fontSize: 13, fontWeight: "bold", color: "#0284c7", marginBottom: 4 },
  tipDesc: { fontSize: 13, color: "#334155", lineHeight: 19 },
  practiceDesc: { fontSize: 12, color: "#b45309", marginTop: 6, fontStyle: "italic" },
});