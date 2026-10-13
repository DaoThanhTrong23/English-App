import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../api/axiosClient';

import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';

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
  const [sound, setSound] = useState<any>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [resultData, setResultData] = useState<any>(null);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  const currentQ = testQuestions[currentIndex];
  const audioSource = currentQ?.audioUrl ? (currentQ.audioUrl.startsWith('http') ? currentQ.audioUrl : `${API_URL.replace('/api', '')}${currentQ.audioUrl}`) : null;
  const player = useAudioPlayer(audioSource);
  const recordedPlayer = useAudioPlayer(recordedUri);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/student/lessons/${lessonId}`);
        if (res.data?.success) {
          const lesson = res.data.data;
          if (lesson.tests && lesson.tests.length > 0) {
            
            const map: any = { 
              listening: 'Luyện Nghe', 
              speaking: 'Luyện Nói', 
              reading: 'Luyện Đọc', 
              writing: 'Luyện Viết',
              test: 'Kiểm Tra'
            };

            let targetTest = lesson.tests.find((t: any) => t.skillCategory === type);
            if (!targetTest && map[type as string]) {
              const keyword = map[type as string].toLowerCase();
              targetTest = lesson.tests.find((t: any) => t.title && t.title.toLowerCase().includes(keyword));
            }
            if (!targetTest && type === 'test') {
              targetTest = lesson.tests.find((t: any) => {
                const title = (t.title || '').toLowerCase();
                return title.includes('kiểm tra') || title.includes('test') || title.includes('tổng hợp');
              });
            }
            if (!targetTest) targetTest = lesson.tests[0];

            setTestId(targetTest.id);
            const testRes = await axiosClient.get(`/student/tests/${targetTest.id}`);
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
    let finalAnswer = textAnswer;
    
    // Auto-evaluate speaking tests using AI
      if (currentItem?.questionType === 'speaking' && recordedUri) {
        setSubmitting(true);
        try {
          const token = await SecureStore.getItemAsync('accessToken');
          
          let targetSentence = currentItem.quesionText;
          const quoteMatch = currentItem.quesionText.match(/["'](.*?)["']/);
          if (quoteMatch && quoteMatch[1]) {
            targetSentence = quoteMatch[1];
          }

          const res = await FileSystem.uploadAsync(`${API_URL}/ai/grade-speaking`, recordedUri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'audio',
            mimeType: 'audio/m4a',
            headers: { Authorization: `Bearer ${token}` },
            parameters: { topic: currentItem.quesionText, targetSentence: targetSentence }
          });
          
          const data = JSON.parse(res.body);
          if (data.success) {
            const score = Math.round((data.data.overallScore || 0) * 10);
            finalAnswer = `[Điểm AI: ${score}%] (Nói: ${data.data.transcript})`;
            setAiResults(prev => [...prev, { type: 'Nói', score: data.data.overallScore, feedback: data.data.feedback, transcript: data.data.transcript }]);
          } else {
            finalAnswer = `[AI Lỗi: ${data.message}]`;
          }
        } catch (err: any) {
          finalAnswer = `[AI Error]`;
        }
        setSubmitting(false);
      }

      // Auto-evaluate writing tests using AI
      if (currentItem?.questionType === 'writing' && textAnswer) {
        setSubmitting(true);
        try {
          const res = await axiosClient.post('/ai/grade-essay', {
            text: textAnswer,
            topic: currentItem.quesionText
          });
          if (res.data?.success) {
            const score = res.data.data.overallScore || 0;
            finalAnswer = `[Điểm AI: ${Math.round(score * 10)}%] ${textAnswer}`;
            setAiResults(prev => [...prev, { type: 'Viết', score: res.data.data.overallScore, feedback: res.data.data.feedback, improved: res.data.data.improvedVersion }]);
          } else {
            finalAnswer = `[AI Lỗi: ${res.data.message}] ${textAnswer}`;
          }
        } catch (err: any) {
          finalAnswer = `[AI Error] ${textAnswer}`;
        }
        setSubmitting(false);
      }

    const sub = {
      questionId: currentItem.id,
      selectedAnswerId: selectedOptionId,
      textAnswer: finalAnswer,
      timeTakenMs: Math.max(1000, Date.now() - startTime)
    };
    const newSubmissions = [...submissions, sub];
    
    if (currentIndex < totalItems - 1) {
      setSubmissions(newSubmissions);
      setCurrentIndex(currentIndex + 1);
      // Reset state for next question
      setSelectedOptionId(null);
      setTextAnswer('');
      setRecordedUri(null);
        setIsRecording(false);
        setStartTime(Date.now());
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
      const res = await axiosClient.post(`/student/tests/${testId}/submit`, { submissions: finalSubmissions });
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
    // console.log removed
    if (audioSource) {
      if (!player) {
        Alert.alert('Lỗi', 'Player chưa sẵn sàng');
        return;
      }
      try {
        player.play();
      } catch(e: any) {
        Alert.alert('Lỗi phát âm thanh', e.message || 'Không thể phát file này: ' + audioSource);
      }
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy file audio!');
    }
    if (audioSource) {
      try {
        player.play();
      } catch(e: any) {
        Alert.alert('Lỗi phát âm thanh', e.message || 'Không thể phát file này: ' + audioSource);
      }
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy file audio!');
    }
  };

  
    const toggleRecord = async () => {
      if (isRecording) {
        setIsRecording(false);
        try { await audioRecorder.stop(); } catch(e) {}
        await new Promise(r => setTimeout(r, 300));
        setRecordedUri(audioRecorder.uri);
      } else {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Lỗi", "Cần cấp quyền Microphone để ghi âm.");
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        try {
          await audioRecorder.prepareToRecordAsync();
          audioRecorder.record();
          setIsRecording(true);
        } catch(e: any) {
          Alert.alert("Lỗi Ghi Âm", String(e));
        }
      }
    };


    const playRecordedAudio = async () => {
      if (!recordedUri || !recordedPlayer) return;
      try {
        recordedPlayer.play();
      } catch(e) {
        Alert.alert("Lỗi", "Không thể phát lại audio vừa ghi.");
      }
    };

    const getTitle = () => {
    switch (type) {
      case 'writing': return 'Luyện Viết';
      case 'reading': return 'Luyện Đọc';
      case 'listening': return 'Luyện Nghe';
      case 'speaking': return 'Luyện Nói';
      case 'test': return 'Kiểm Tra Tổng Hợp';
      default: return 'Bài Tập';
    }
  };

  const renderQuestionByType = () => {
    if (!currentItem) return null;
    const q = currentItem;

    // 1. Luyện Đọc (Trắc nghiệm)
    if (q.questionType === 'multiple_choice' || q.questionType === 'listening') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
            {(type === 'listening' || q.audioUrl || q.questionType === 'listening') && (
               <TouchableOpacity onPress={playDummyAudio} style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15}}>
                 <Ionicons name="volume-medium" size={30} color="#fff" />
               </TouchableOpacity>
            )}
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

    // 3. Luyện Nói
    if (q.questionType === 'speaking') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
             <Text style={styles.questionTitle}>Phát âm câu sau:</Text>
             <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 20}}>
            <TouchableOpacity onPress={toggleRecord} style={[styles.recordBtn, isRecording && {backgroundColor: '#ef4444'}]}>
              <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#fff" />
              <Text style={{color: '#fff', marginTop: 5, fontSize: 12}}>{isRecording ? "Dừng" : "Ghi âm"}</Text>
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
    if (q.questionType === 'writing' || q.questionType === 'fill_in_blank') {
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
        <Text style={{fontSize: 16, color: '#6b7280', marginBottom: 20}}>XP nhận được: {resultData.totalScore || 0} / {(resultData.totalQuestions || 0) * 10} điểm.</Text>

        {aiResults.length > 0 && (
          <ScrollView style={{width: '100%', paddingHorizontal: 20, marginBottom: 20}}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#111827'}}>Đánh giá từ AI:</Text>
            {aiResults.map((r, i) => (
              <View key={i} style={{backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb'}}>
                <Text style={{fontWeight: 'bold', color: '#3b82f6', fontSize: 16}}>Kỹ năng {r.type}: {r.score} / 10 điểm</Text>
                {r.transcript && <Text style={{fontStyle: 'italic', marginTop: 5, color: '#4b5563'}}>AI nghe được: "{r.transcript}"</Text>}
                <Text style={{marginTop: 10, color: '#374151', lineHeight: 22}}>{r.feedback}</Text>
                {r.improved && (
                  <View style={{marginTop: 10, backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8}}>
                    <Text style={{fontWeight: 'bold', fontSize: 12, color: '#6b7280'}}>GỢI Ý NÂNG CẤP:</Text>
                    <Text style={{color: '#111827', marginTop: 5}}>{r.improved}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={() => router.back()}>
          <Text style={styles.submitBtnText}>QUAY LẠI</Text>
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
          <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / totalItems) * 100}%` }]} />
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
