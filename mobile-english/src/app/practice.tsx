import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../api/axiosClient';

import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { API_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../context/ThemeContext';

export default function PracticeScreen() {
  const { type, lessonId, courseId } = useLocalSearchParams();
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
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

            const topicId = lesson.topicId || lesson.topic?.id;
            if (topicId) {
              await axiosClient.post(`/student/courses/${topicId}/enroll`).catch(() => {});
            }

            setTestId(targetTest.id);
            const testRes = await axiosClient.get(`/student/tests/${targetTest.id}`);
            if (testRes.data?.success) {
              setTestQuestions(testRes.data.data.questions || []);
            }
          }
        }
      } catch (error: any) {
        console.error(error);
        const errMsg = error.response?.data?.message || error.response?.data?.error?.message || "Không thể tải dữ liệu bài học";
        Alert.alert("Thông báo", errMsg);
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

  const handlePlayAudio = async () => {
    if (audioSource && player) {
      try {
        player.play();
        return;
      } catch(e: any) {
        console.log('Error playing audioSource:', e);
      }
    }
    // Fallback: Nếu không có file audio hoặc player gặp lỗi, phát âm thanh bằng Text-to-Speech
    if (currentItem?.quesionText) {
      Speech.speak(currentItem.quesionText, { language: 'en-US', rate: 0.85 });
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy file âm thanh cho câu hỏi này!');
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
          <View style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {(type === 'listening' || q.audioUrl || q.questionType === 'listening') && (
               <TouchableOpacity onPress={handlePlayAudio} style={{width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15}}>
                 <Ionicons name="volume-medium" size={30} color="#fff" />
               </TouchableOpacity>
            )}
            <Text style={[styles.questionSubtitle, { color: theme.text }]}>{q.quesionText}</Text>
          </View>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Chọn đáp án đúng:</Text>
          {q.answers?.map((ans: any) => {
            const isSelected = selectedOptionId === ans.id;
            return (
              <TouchableOpacity 
                key={ans.id} 
                style={[
                  styles.radioCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && [styles.radioCardSelected, { backgroundColor: isDark ? '#1c2438' : '#eff6ff', borderColor: theme.primary }]
                ]} 
                onPress={() => setSelectedOptionId(ans.id)}
              >
                <View style={[styles.radioOuter, { borderColor: theme.border }, isSelected && [styles.radioOuterSelected, { borderColor: theme.primary }]]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
                <Text style={[styles.radioText, { color: theme.text }, isSelected && [styles.radioTextSelected, { color: isDark ? '#93c5fd' : '#1d4ed8' }]]}>{ans.answerText}</Text>
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
          <View style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.questionTitle, { color: theme.subtext }]}>Phát âm câu sau:</Text>
             <Text style={[styles.questionSubtitle, { color: theme.text }]}>{q.quesionText}</Text>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 20}}>
            <TouchableOpacity onPress={toggleRecord} style={[styles.recordBtn, { backgroundColor: theme.primary }, isRecording && {backgroundColor: '#ef4444'}]}>
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
          <View style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <View style={[styles.iconBoxPrimary, { backgroundColor: theme.primary }]}>
               <Ionicons name="pencil" size={20} color="#ffffff" />
             </View>
             <Text style={[styles.questionTitle, { color: theme.subtext }]}>Viết đoạn văn / Sắp xếp câu</Text>
             <Text style={[styles.questionSubtitle, { color: theme.text }]}>{q.quesionText}</Text>
          </View>
          <View style={[styles.inputArea, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput 
              style={[styles.textInput, { color: theme.inputText }]} 
              multiline 
              placeholder="Viết câu trả lời của bạn..." 
              placeholderTextColor={theme.subtext}
              value={textAnswer} 
              onChangeText={setTextAnswer} 
            />
          </View>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{marginTop: 15, color: theme.subtext}}>Đang tải bài tập...</Text>
      </SafeAreaView>
    );
  }

  if (resultData) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? '#052e16' : '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20}}>
          <Ionicons name="checkmark" size={40} color="#16a34a" />
        </View>
        <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 10}}>
          {resultData.isRetake ? 'Luyện tập lại hoàn thành!' : 'Chúc mừng!'}
        </Text>
        <Text style={{fontSize: 16, color: theme.subtext, marginBottom: 6}}>
          Điểm số: {resultData.totalScore || 0} / {(resultData.totalQuestions || 0) * 10} ({resultData.correctCount || 0} câu đúng)
        </Text>
        <Text style={{fontSize: 15, fontWeight: '600', color: theme.primary, marginBottom: 15}}>
          {resultData.isRetake ? 'Bài thi đã làm trước đó (Không cộng dồn XP)' : `+${resultData.xpGained || 0} XP kinh nghiệm`}
        </Text>

        {resultData.newElo && (
          <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '90%', backgroundColor: theme.card, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 11, color: theme.subtext}}>Từ vựng</Text>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: theme.text}}>{resultData.newElo.vocab}</Text>
            </View>
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 11, color: theme.subtext}}>Ngữ pháp</Text>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: theme.text}}>{resultData.newElo.grammar}</Text>
            </View>
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 11, color: theme.subtext}}>Đọc hiểu</Text>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: theme.text}}>{resultData.newElo.reading}</Text>
            </View>
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 11, color: theme.subtext}}>Nghe hiểu</Text>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: theme.text}}>{resultData.newElo.listening || 1200}</Text>
            </View>
          </View>
        )}

        {aiResults.length > 0 && (
          <ScrollView style={{width: '100%', paddingHorizontal: 20, marginBottom: 20}}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: theme.text}}>Đánh giá từ AI:</Text>
            {aiResults.map((r, i) => (
              <View key={i} style={{backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border}}>
                <Text style={{fontWeight: 'bold', color: theme.primary, fontSize: 16}}>Kỹ năng {r.type}: {r.score} / 10 điểm</Text>
                {r.transcript && <Text style={{fontStyle: 'italic', marginTop: 5, color: theme.subtext}}>AI nghe được: "{r.transcript}"</Text>}
                <Text style={{marginTop: 10, color: theme.text, lineHeight: 22}}>{r.feedback}</Text>
                {r.improved && (
                  <View style={{marginTop: 10, backgroundColor: theme.cardSecondary, padding: 10, borderRadius: 8}}>
                    <Text style={{fontWeight: 'bold', fontSize: 12, color: theme.subtext}}>GỢI Ý NÂNG CẤP:</Text>
                    <Text style={{color: theme.text, marginTop: 5}}>{r.improved}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: theme.primary }]} 
          onPress={() => {
            if (lessonId) {
              router.replace({ pathname: `/lesson/${lessonId}`, params: { courseId: courseId ? String(courseId) : undefined } } as any);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
        >
          <Text style={styles.submitBtnText}>QUAY LẠI BÀI HỌC</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (totalItems === 0) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={theme.subtext} />
        <Text style={{fontSize: 18, color: theme.subtext, marginTop: 15}}>Không có bài tập nào!</Text>
        <TouchableOpacity style={[styles.submitBtn, {marginTop: 20, backgroundColor: theme.primary}]} onPress={() => router.back()}>
          <Text style={styles.submitBtnText}>QUAY LẠI</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerBar, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{getTitle()}</Text>
      </View>

      <View style={[styles.progressSection, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: theme.subtext }]}>Tiến độ</Text>
          <Text style={[styles.progressValue, { color: theme.primary }]}>{currentIndex + 1} / {totalItems}</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.cardSecondary }]}>
          <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / totalItems) * 100}%`, backgroundColor: theme.primary }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderQuestionByType()}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }, submitting && {opacity: 0.7}]} onPress={handleNext} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{currentIndex === totalItems - 1 ? "HOÀN THÀNH" : "TIẾP TỤC"}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  progressSection: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '500' },
  progressValue: { fontSize: 13, fontWeight: 'bold' },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },

  scrollContent: { padding: 20 },
  contentContainer: { paddingBottom: 40 },
  
  questionCard: { borderWidth: 1, borderRadius: 12, padding: 20, marginBottom: 25, alignItems: 'center' },
  iconBoxPrimary: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  questionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  questionSubtitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', lineHeight: 28 },

  inputLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  inputArea: { borderWidth: 1, borderRadius: 12, padding: 15, minHeight: 120 },
  textInput: { fontSize: 16 },

  radioCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 12 },
  radioCardSelected: { borderWidth: 1 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  radioOuterSelected: {},
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  radioText: { fontSize: 15, flex: 1 },
  radioTextSelected: { fontWeight: 'bold' },

  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 25, paddingVertical: 15, alignItems: 'center', elevation: 2, paddingHorizontal: 30 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  recordBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 3 },
});
