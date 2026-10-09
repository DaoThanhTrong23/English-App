const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../../api/axiosClient';
import { Audio } from 'expo-av';
import { useAudioRecorder, AudioModule } from 'expo-audio';

export default function PracticeScreen() {
  const { type, lessonId } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testId, setTestId] = useState<number | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Answers
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [resultData, setResultData] = useState<any>(null);

  const audioRecorder = useAudioRecorder({
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  } as any);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(\`/student/lessons/\${lessonId}\`);
        if (res.data?.success) {
          const lesson = res.data.data;
          if (lesson.tests && lesson.tests.length > 0) {
            
            const TITLE_MAP: any = {
              listening: 'Luyện Nghe',
              speaking: 'Luyện Nói',
              reading: 'Luyện Đọc',
              writing: 'Luyện Viết',
              test: 'Luyện Đọc'
            };
            const targetTitle = TITLE_MAP[type as string] || 'Luyện Đọc';
            let targetTest = lesson.tests.find((t: any) => t.title.includes(targetTitle));
            if (!targetTest) targetTest = lesson.tests[0];

            setTestId(targetTest.id);
            const testRes = await axiosClient.get(\`/student/tests/\${targetTest.id}\`);
            if (testRes.data?.success) {
              setTestQuestions(testRes.data.data.questions || []);
            }
          }
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu bài học");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId, type]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const totalItems = testQuestions.length;
  const currentItem = testQuestions[currentIndex];

  const handleNext = async () => {
    const sub = {
      questionId: currentItem.id,
      selectedAnswerId: selectedOptionId,
      textAnswer: textAnswer || recordedUri || ''
    };
    const newSubmissions = [...submissions, sub];
    
    if (currentIndex < totalItems - 1) {
      setSubmissions(newSubmissions);
      setCurrentIndex(currentIndex + 1);
      // Reset state for next question
      setSelectedOptionId(null);
      setTextAnswer('');
      setRecordedUri(null);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
    } else {
      submitTestResult(newSubmissions);
    }
  };

  const submitTestResult = async (finalSubmissions: any[]) => {
    try {
      setSubmitting(true);
      const res = await axiosClient.post(\`/student/tests/\${testId}/submit\`, { submissions: finalSubmissions });
      if (res.data?.success) {
        setResultData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  const playDummyAudio = async () => {
    Alert.alert("Thông báo", "Đây là âm thanh mô phỏng (URL giả lập). Trong thực tế sẽ phát file audioUrl.");
  };

  const toggleRecord = async () => {
    if (audioRecorder.isRecording) {
      await audioRecorder.stop();
      await new Promise(r => setTimeout(r, 300));
      setRecordedUri(audioRecorder.uri);
    } else {
      await Audio.requestPermissionsAsync();
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      try {
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } catch(e) {
        console.log("Record err", e);
      }
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedUri) return;
    try {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error(error);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'writing': return 'Luyện Viết';
      case 'reading': return 'Luyện Đọc';
      case 'listening': return 'Luyện Nghe';
      case 'speaking': return 'Luyện Nói';
      default: return 'Bài Tập';
    }
  };

  const renderQuestionByType = () => {
    if (!currentItem) return null;
    const q = currentItem;

    // 1. Luyện Đọc (Trắc nghiệm)
    if (q.questionType === 'multiple_choice') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          <Text style={styles.inputLabel}>Chọn đáp án đúng:</Text>
          {q.answers?.map((ans: any) => {
            const isSelected = selectedOptionId === ans.id;
            return (
              <TouchableOpacity key={ans.id} style={[styles.radioCard, isSelected && styles.radioCardSelected]} onPress={() => setSelectedOptionId(ans.id)}>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioText, isSelected && styles.radioTextSelected]}>{ans.answerText}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // 2. Luyện Nghe
    if (q.questionType === 'listening') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
             <TouchableOpacity onPress={playDummyAudio} style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15}}>
               <Ionicons name="volume-medium" size={30} color="#fff" />
             </TouchableOpacity>
             <Text style={styles.questionTitle}>Nghe đoạn băng và điền câu</Text>
             <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          <Text style={styles.inputLabel}>Nhập câu bạn nghe được:</Text>
          <View style={styles.inputArea}>
            <TextInput style={styles.textInput} multiline placeholder="Gõ câu trả lời..." value={textAnswer} onChangeText={setTextAnswer} />
          </View>
        </View>
      );
    }

    // 3. Luyện Nói
    if (q.questionType === 'speaking') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
             <Text style={styles.questionTitle}>Phát âm câu sau:</Text>
             <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 20}}>
            <TouchableOpacity onPress={toggleRecord} style={[styles.recordBtn, audioRecorder.isRecording && {backgroundColor: '#ef4444'}]}>
              <Ionicons name={audioRecorder.isRecording ? "stop" : "mic"} size={32} color="#fff" />
              <Text style={{color: '#fff', marginTop: 5, fontSize: 12}}>{audioRecorder.isRecording ? "Dừng" : "Ghi âm"}</Text>
            </TouchableOpacity>

            {recordedUri && (
              <TouchableOpacity onPress={playRecordedAudio} style={[styles.recordBtn, {backgroundColor: '#10b981'}]}>
                <Ionicons name="play" size={32} color="#fff" />
                <Text style={{color: '#fff', marginTop: 5, fontSize: 12}}>Nghe lại</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // 4. Luyện Viết
    if (q.questionType === 'writing') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
             <View style={styles.iconBoxPrimary}>
               <Ionicons name="pencil" size={20} color="#ffffff" />
             </View>
             <Text style={styles.questionTitle}>Viết đoạn văn / Sắp xếp câu</Text>
             <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          <View style={styles.inputArea}>
            <TextInput style={styles.textInput} multiline placeholder="Viết câu trả lời của bạn..." value={textAnswer} onChangeText={setTextAnswer} />
          </View>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{marginTop: 15, color: '#6b7280'}}>Đang tải bài tập...</Text>
      </SafeAreaView>
    );
  }

  if (resultData) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20}}>
          <Ionicons name="checkmark" size={40} color="#16a34a" />
        </View>
        <Text style={{fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 10}}>Hoàn thành xuất sắc!</Text>
        <Text style={{fontSize: 16, color: '#6b7280', marginBottom: 30}}>Bạn đã làm được {resultData.score || 0} điểm.</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={() => router.back()}>
          <Text style={styles.submitBtnText}>QUAY LẠI TRANG CHỦ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (totalItems === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#9ca3af" />
        <Text style={{fontSize: 18, color: '#6b7280', marginTop: 15}}>Không có bài tập nào!</Text>
        <TouchableOpacity style={[styles.submitBtn, {marginTop: 20}]} onPress={() => router.back()}>
          <Text style={styles.submitBtnText}>QUAY LẠI</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Tiến độ</Text>
          <Text style={styles.progressValue}>{currentIndex + 1} / {totalItems}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: \`\${((currentIndex + 1) / totalItems) * 100}%\` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderQuestionByType()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitBtn, submitting && {opacity: 0.7}]} onPress={handleNext} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{currentIndex === totalItems - 1 ? "HOÀN THÀNH" : "TIẾP TỤC"}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10, backgroundColor: '#ffffff' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  progressSection: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  progressValue: { fontSize: 13, color: '#3b82f6', fontWeight: 'bold' },
  progressBarBg: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 5 },

  scrollContent: { padding: 20 },
  contentContainer: { paddingBottom: 40 },
  
  questionCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 20, marginBottom: 25, alignItems: 'center' },
  iconBoxPrimary: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  questionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', marginBottom: 8 },
  questionSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center', lineHeight: 28 },

  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  inputArea: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 15, minHeight: 120 },
  textInput: { fontSize: 16, color: '#111827' },

  radioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 15, marginBottom: 12 },
  radioCardSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  radioOuterSelected: { borderColor: '#3b82f6' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' },
  radioText: { fontSize: 15, color: '#4b5563', flex: 1 },
  radioTextSelected: { color: '#1d4ed8', fontWeight: 'bold' },

  footer: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 25, paddingVertical: 15, alignItems: 'center', elevation: 2, paddingHorizontal: 30 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  recordBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 3 },
});
`;
fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
