import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { axiosClient } from '../api/axiosClient';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../context/ThemeContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  const DEFAULT_JOB_OPTIONS = ['Học sinh / Sinh viên', 'Người đi làm', 'Giáo viên', 'Khác'];
  const DEFAULT_INTEREST_OPTIONS = [
    'Công nghệ (IT)', 'Du lịch', 'Kinh doanh', 'Giải trí / Game',
    'Văn hóa nghệ thuật', 'Giao tiếp hàng ngày', 'Kỹ năng mềm', 'Học thuật'
  ];

  const [jobOptions, setJobOptions] = useState<string[]>(DEFAULT_JOB_OPTIONS);
  const [interestOptions, setInterestOptions] = useState<string[]>(DEFAULT_INTEREST_OPTIONS);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const res = await axiosClient.get('/onboarding/options');
        if (isMounted && res.data?.data) {
          if (Array.isArray(res.data.data.interests) && res.data.data.interests.length > 0) {
            setInterestOptions(res.data.data.interests);
          }
          if (Array.isArray(res.data.data.jobs) && res.data.data.jobs.length > 0) {
            setJobOptions(res.data.data.jobs);
          }
        }
      } catch (e) {
        // Giữ các tùy chọn mặc định nếu mạng chưa sẵn sàng
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleInterest = (val: string) => {
    if (interests.includes(val)) {
      setInterests(interests.filter(i => i !== val));
    } else {
      setInterests([...interests, val]);
    }
  };

  const [step, setStep] = useState(1);
  const [job, setJob] = useState('Học sinh / Sinh viên');
  const [interests, setInterests] = useState<string[]>([]);
  
  // Test Data
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{id: string, answer: string, timeTakenMs?: number}[]>([]);
  const questionStartTime = useRef<number>(Date.now());
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Dừng phát âm thanh khi chuyển câu hoặc component unmount
  useEffect(() => {
    if (step === 2 && questions.length > 0 && questions[currentQIndex]) {
      questionStartTime.current = Date.now();
      Speech.stop();
      const q = questions[currentQIndex];
      if (q.skillCategory === 'Listening' && q.audioText) {
        setTimeout(() => {
          Speech.speak(q.audioText, { language: 'en-US', rate: 0.85 });
        }, 350);
      }
    }
    return () => {
      Speech.stop();
    };
  }, [currentQIndex, step]);

  const playAudio = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.85 });
  };

  const startTest = async () => {
    if (!job || interests.length === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn nghề nghiệp và ít nhất một sở thích để chúng tôi gợi ý lộ trình phù hợp!');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.get('/onboarding/placement-test');
      setQuestions(res.data.data || []);
      setCurrentQIndex(0);
      setAnswers([]);
      questionStartTime.current = Date.now();
      setStep(2);
    } catch (e) {
      Alert.alert('Lỗi', 'Không tải được bài test');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = async (answer: string) => {
    Speech.stop();
    const q = questions[currentQIndex];
    const timeTakenMs = Math.max(500, Date.now() - questionStartTime.current);
    const newAnswers = [...answers, { id: q.id, answer, timeTakenMs }];
    setAnswers(newAnswers);

    // Kích hoạt Tự động dừng (Auto-stop) với Backend
    // Gọi API check progress sau khi trả lời đủ 6 câu trở lên
    if (newAnswers.length >= 6) {
      try {
        const res = await axiosClient.post('/onboarding/check-progress', { answers: newAnswers });
        if (res.data?.data?.stoppedEarly) {
          // Năng lực đã hội tụ, submit luôn bài test!
          submitTest(newAnswers);
          return;
        }
      } catch (err) {
        console.warn('Lỗi khi check auto-stop', err);
      }
    }

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      submitTest(newAnswers);
    }
  };

  const submitTest = async (finalAnswers: any) => {
    Speech.stop();
    setLoading(true);
    try {
      const res = await axiosClient.post('/onboarding/submit', {
        job,
        interests: interests.join(', '),
        answers: finalAnswers
      });
      
      // Update local storage to avoid showing onboarding again
      const userInfoStr = await SecureStore.getItemAsync('userInfo');
      if (userInfoStr) {
        const user = JSON.parse(userInfoStr);
        user.onboardingCompleted = true;
        user.cefrLevel = res.data.data.cefrLevel;
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
      }

      setResult(res.data.data);
      setStep(3);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể nộp bài test');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{marginTop: 10, color: theme.subtext}}>Đang xử lý...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* BƯỚC 1: LẤY THÔNG TIN CÁ NHÂN */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="sparkles" size={24} color={theme.primary} />
            <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}>Chào mừng bạn mới!</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Hãy cho chúng tôi biết một chút về bạn để xây dựng lộ trình học phù hợp nhất nhé.</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Nghề nghiệp hiện tại của bạn:</Text>
            <View style={styles.chipContainer}>
              {jobOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt}
                  style={[
                    styles.chip, 
                    { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                    job === opt && [styles.chipSelected, { backgroundColor: isDark ? '#1c2438' : '#eff6ff', borderColor: theme.primary }]
                  ]}
                  onPress={() => setJob(opt)}
                >
                  <Text style={[styles.chipText, { color: theme.subtext }, job === opt && [styles.chipTextSelected, { color: theme.primary }]]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Sở thích cá nhân (Chọn nhiều):</Text>
              {loadingOptions && <ActivityIndicator size="small" color={theme.primary} />}
            </View>
            <View style={styles.chipContainer}>
              {interestOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt}
                  style={[
                    styles.chip, 
                    { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                    interests.includes(opt) && [styles.chipSelected, { backgroundColor: isDark ? '#1c2438' : '#eff6ff', borderColor: theme.primary }]
                  ]}
                  onPress={() => toggleInterest(opt)}
                >
                  <Text style={[styles.chipText, { color: theme.subtext }, interests.includes(opt) && [styles.chipTextSelected, { color: theme.primary }]]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.primary }]} onPress={startTest} disabled={interests.length === 0}>
            <Text style={styles.btnText}>Làm bài Test năng lực</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8}} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* BƯỚC 2: LÀM BÀI TEST */}
      {step === 2 && questions.length > 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <Text style={[styles.progressText, { color: theme.subtext, marginBottom: 0 }]}>
              Câu hỏi {currentQIndex + 1} / {questions.length}
            </Text>
            <View style={[styles.skillBadge, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#3b82f6' : '#bfdbfe' }]}>
              <Ionicons 
                name={
                  questions[currentQIndex].skillCategory === 'Listening' ? 'volume-high' :
                  questions[currentQIndex].skillCategory === 'Reading' ? 'book-outline' :
                  questions[currentQIndex].skillCategory === 'Vocabulary' ? 'text-outline' : 'pencil-outline'
                } 
                size={14} 
                color={theme.primary} 
                style={{marginRight: 4}} 
              />
              <Text style={[styles.skillBadgeText, { color: theme.primary }]}>
                {questions[currentQIndex].skillCategory === 'Listening' ? 'Nghe hiểu' :
                 questions[currentQIndex].skillCategory === 'Reading' ? 'Đọc hiểu' :
                 questions[currentQIndex].skillCategory === 'Vocabulary' ? 'Từ vựng' : 'Ngữ pháp'}
              </Text>
            </View>
          </View>

          <View style={[styles.progressBar, { backgroundColor: theme.cardSecondary }]}>
            <View style={[styles.progressFill, { width: `${((currentQIndex + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
          </View>
          
          {/* Nút phát âm thanh cho kỹ năng Listening */}
          {questions[currentQIndex].skillCategory === 'Listening' && (
            <TouchableOpacity 
              style={[styles.audioPlayBtn, { backgroundColor: theme.primary }]} 
              onPress={() => playAudio(questions[currentQIndex].audioText || questions[currentQIndex].question)}
            >
              <Ionicons name="volume-high" size={24} color="#fff" />
              <Text style={styles.audioPlayText}>Bấm để nghe âm thanh</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.questionText, { color: theme.text }]}>
            {questions[currentQIndex].question}
          </Text>
          
          {questions[currentQIndex].options.map((opt: string, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => selectAnswer(opt)}
            >
              <View style={[styles.optionLetter, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]}>
                <Text style={[styles.optionLetterText, { color: theme.text }]}>{String.fromCharCode(65 + idx)}</Text>
              </View>
              <Text style={[styles.optionText, { color: theme.text, flex: 1 }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* BƯỚC 3: KẾT QUẢ & RECOMMENDATION */}
      {step === 3 && result && (
        <ScrollView contentContainerStyle={styles.content}>
          <Ionicons name="trophy" size={80} color="#f59e0b" style={{alignSelf: 'center', marginBottom: 20}} />
          <Text style={[styles.title, { color: theme.text }]}>Hoàn tất đánh giá năng lực!</Text>
          
          <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <Text style={[styles.resultLabel, { color: theme.subtext, marginBottom: 0 }]}>
                Điểm số: <Text style={[styles.resultValue, { color: theme.text }]}>{result.score}</Text>
              </Text>
              <View style={[styles.cefrBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.cefrBadgeText}>CEFR {result.cefrLevel}</Text>
              </View>
            </View>

            {result.stoppedEarly && (
              <View style={{backgroundColor: isDark ? '#1e293b' : '#dbeafe', padding: 12, borderRadius: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Ionicons name="flash" size={18} color={isDark ? '#93c5fd' : '#1e40af'} />
                <Text style={{color: isDark ? '#93c5fd' : '#1e40af', fontSize: 13, fontWeight: '500', lineHeight: 18, flex: 1}}>
                  Đây là tính năng tự động dừng   {"\n"}
                  Thuật toán FAME-KT đã phân tích xong trình độ của bạn chỉ sau {result.questionsUsed} câu hỏi mà không cần làm hết bài!
                </Text>
                
              </View>
            )}

            {result.eloProfile && (
              <View style={{marginTop: 5}}>
                <Text style={[styles.resultLabel, { color: theme.subtext, marginBottom: 10 }]}>Báo cáo năng lực đa chiều theo FAME-KT Elo</Text>
                <View style={styles.skillsGrid}>
                  <View style={[styles.skillBox, { backgroundColor: isDark ? theme.cardSecondary : '#f8fafc', borderColor: theme.border }]}>
                    <Ionicons name="create-outline" size={24} color={theme.primary} style={{ marginBottom: 4 }} />
                    <Text style={[styles.skillName, { color: theme.subtext }]}>Ngữ pháp</Text>
                    <Text style={[styles.skillElo, { color: theme.text }]}>{result.eloProfile.Grammar}</Text>
                  </View>
                  <View style={[styles.skillBox, { backgroundColor: isDark ? theme.cardSecondary : '#f8fafc', borderColor: theme.border }]}>
                    <Ionicons name="library-outline" size={24} color={theme.primary} style={{ marginBottom: 4 }} />
                    <Text style={[styles.skillName, { color: theme.subtext }]}>Từ vựng</Text>
                    <Text style={[styles.skillElo, { color: theme.text }]}>{result.eloProfile.Vocabulary}</Text>
                  </View>
                  <View style={[styles.skillBox, { backgroundColor: isDark ? theme.cardSecondary : '#f8fafc', borderColor: theme.border }]}>
                    <Ionicons name="headset-outline" size={24} color={theme.primary} style={{ marginBottom: 4 }} />
                    <Text style={[styles.skillName, { color: theme.subtext }]}>Nghe hiểu</Text>
                    <Text style={[styles.skillElo, { color: theme.text }]}>{result.eloProfile.Listening}</Text>
                  </View>
                  <View style={[styles.skillBox, { backgroundColor: isDark ? theme.cardSecondary : '#f8fafc', borderColor: theme.border }]}>
                    <Ionicons name="book-outline" size={24} color={theme.primary} style={{ marginBottom: 4 }} />
                    <Text style={[styles.skillName, { color: theme.subtext }]}>Đọc hiểu</Text>
                    <Text style={[styles.skillElo, { color: theme.text }]}>{result.eloProfile.Reading}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.subtitle, { color: theme.subtext }]}>Hãy chọn mục tiêu học tập của bạn:</Text>
          
          {[
            { id: 'A1-A2', title: 'Dễ (A1 - A2)', desc: 'Dành cho người mới bắt đầu', levels: ['A1', 'A2'] },
            { id: 'B1-B2', title: 'Trung bình (B1 - B2)', desc: 'Giao tiếp cơ bản đến khá', levels: ['B1', 'B2'] },
            { id: 'C1-C2', title: 'Khó (C1 - C2)', desc: 'Thành thạo và chuyên sâu', levels: ['C1', 'C2'] }
          ].map(group => {
            const isRecommended = group.levels.includes(result.cefrLevel);
            return (
              <TouchableOpacity 
                key={group.id} 
                style={[
                  styles.courseCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isRecommended && { borderColor: '#10b981', backgroundColor: isDark ? '#052e16' : '#ecfdf5', borderWidth: 2 }
                ]}
                onPress={async () => {
                  await SecureStore.setItemAsync('targetLevelGroup', group.id);
                  router.replace('/(tabs)');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.courseTitle, { color: theme.text, marginBottom: 0 }, isRecommended && { color: isDark ? '#34d399' : '#047857' }]}>
                    {group.title}
                  </Text>
                  {isRecommended && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="sparkles" size={13} color="#f59e0b" />
                      <Text style={{ fontSize: 13, color: isDark ? '#34d399' : '#047857', fontWeight: 'bold' }}>
                        (Phù hợp với bạn)
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.courseDesc, { color: theme.subtext }]}>{group.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 15 },
  btnPrimary: { borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipSelected: {},
  chipText: { fontSize: 14, fontWeight: '500' },
  chipTextSelected: { fontWeight: 'bold' },

  progressText: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 20 },
  progressFill: { height: '100%', borderRadius: 3 },
  skillBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  skillBadgeText: { fontSize: 12, fontWeight: '600' },

  audioPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginBottom: 20, gap: 8 },
  audioPlayText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  questionText: { fontSize: 20, fontWeight: 'bold', marginBottom: 25, lineHeight: 28 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1.5, borderRadius: 12, marginBottom: 12 },
  optionLetter: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionLetterText: { fontSize: 14, fontWeight: 'bold' },
  optionText: { fontSize: 15, fontWeight: '500' },

  resultCard: { padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  resultLabel: { fontSize: 15, fontWeight: '500' },
  resultValue: { fontSize: 18, fontWeight: 'bold' },
  cefrBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  cefrBadgeText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  skillBox: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  skillIcon: { fontSize: 20, marginBottom: 4 },
  skillName: { fontSize: 12, fontWeight: '500' },
  skillElo: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },

  courseCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  courseTitle: { fontSize: 16, fontWeight: 'bold' },
  courseDesc: { fontSize: 13, marginTop: 4 }
});
