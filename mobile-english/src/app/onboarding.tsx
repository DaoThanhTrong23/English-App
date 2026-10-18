import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../api/axiosClient';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../context/ThemeContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  const JOB_OPTIONS = ['Học sinh / Sinh viên', 'Người đi làm', 'Giáo viên', 'Khác'];
  const INTEREST_OPTIONS = ['Công nghệ (IT)', 'Du lịch', 'Kinh doanh', 'Giải trí / Game', 'Văn hóa nghệ thuật', 'Giao tiếp hàng ngày', 'Kỹ năng mềm', 'Học thuật'];

  const toggleInterest = (val: string) => {
    if (interests.includes(val)) {
      setInterests(interests.filter(i => i !== val));
    } else {
      setInterests([...interests, val]);
    }
  };

  const [step, setStep] = useState(1);
  const [job, setJob] = useState('Sinh viên');
  const [interests, setInterests] = useState<string[]>([]);
  
  // Test Data
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{id: string, answer: string}[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startTest = async () => {
    if (!job || !interests) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ nghề nghiệp và sở thích để chúng tôi gợi ý tốt hơn!');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.get('/onboarding/placement-test');
      setQuestions(res.data.data);
      setStep(2);
    } catch (e) {
      Alert.alert('Lỗi', 'Không tải được bài test');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = async (answer: string) => {
    const q = questions[currentQIndex];
    const newAnswers = [...answers, { id: q.id, answer }];
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
          <Text style={[styles.title, { color: theme.text }]}>Chào mừng bạn mới! 👋</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Hãy cho chúng tôi biết một chút về bạn để xây dựng lộ trình học phù hợp nhất nhé.</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Nghề nghiệp hiện tại của bạn:</Text>
            <View style={styles.chipContainer}>
              {JOB_OPTIONS.map((opt) => (
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
            <Text style={[styles.label, { color: theme.text }]}>Sở thích cá nhân (Chọn nhiều):</Text>
            <View style={styles.chipContainer}>
              {INTEREST_OPTIONS.map((opt) => (
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
        <View style={styles.content}>
          <Text style={[styles.progressText, { color: theme.subtext }]}>Câu hỏi {currentQIndex + 1} / {questions.length}</Text>
          <View style={[styles.progressBar, { backgroundColor: theme.cardSecondary }]}>
            <View style={[styles.progressFill, { width: `${((currentQIndex + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
          </View>
          
          <Text style={[styles.questionText, { color: theme.text }]}>{questions[currentQIndex].question}</Text>
          
          {questions[currentQIndex].options.map((opt: string, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => selectAnswer(opt)}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* BƯỚC 3: KẾT QUẢ & RECOMMENDATION */}
      {step === 3 && result && (
        <View style={styles.content}>
          <Ionicons name="trophy" size={80} color="#f59e0b" style={{alignSelf: 'center', marginBottom: 20}} />
          <Text style={[styles.title, { color: theme.text }]}>Hoàn tất đánh giá!</Text>
          
          <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
    <Text style={[styles.resultLabel, { color: theme.subtext }]}>Điểm số: <Text style={[styles.resultValue, { color: theme.text }]}>{result.score}</Text></Text>
    {result.stoppedEarly && (
      <View style={{backgroundColor: isDark ? '#1e293b' : '#dbeafe', padding: 10, borderRadius: 8, marginTop: 10, marginBottom: 5}}>
        <Text style={{color: isDark ? '#93c5fd' : '#1e40af', fontSize: 13, fontWeight: '500'}}>
          ⚡ Tính năng Tự động dừng (Auto-stop): Thuật toán thông minh FAME-KT đã phân tích xong trình độ của bạn chỉ sau {result.questionsUsed} câu hỏi mà không cần làm hết bài!
        </Text>
      </View>
    )}
  
            <Text style={[styles.resultLabel, { color: theme.subtext }]}>Trình độ CEFR: <Text style={[styles.resultValue, {color: theme.primary}]}>{result.cefrLevel}</Text></Text>
            {result.eloProfile && (
              <View style={{marginTop: 10}}>
                <Text style={[styles.resultLabel, { color: theme.subtext }]}>Phân tích năng lực (FAME-KT Elo):</Text>
                <Text style={{color: theme.subtext}}>Ngữ pháp: {result.eloProfile.Grammar} | Từ vựng: {result.eloProfile.Vocabulary}</Text>
                <Text style={{color: theme.subtext}}>Nghe: {result.eloProfile.Listening} | Đọc: {result.eloProfile.Reading}</Text>
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
                <Text style={[styles.courseTitle, { color: theme.text }, isRecommended && { color: isDark ? '#34d399' : '#047857' }]}>
                  {group.title} {isRecommended && '✨ (Phù hợp với bạn)'}
                </Text>
                <Text style={[styles.courseDesc, { color: theme.subtext }]}>{group.desc}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, marginBottom: 24, textAlign: 'center', lineHeight: 22 },
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

  progressText: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 30 },
  progressFill: { height: '100%', borderRadius: 3 },
  questionText: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, lineHeight: 32 },
  optionBtn: { padding: 18, borderWidth: 2, borderRadius: 12, marginBottom: 12 },
  optionText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },

  resultCard: { padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  resultLabel: { fontSize: 16, marginBottom: 8 },
  resultValue: { fontSize: 20, fontWeight: 'bold' },
  courseCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  courseTitle: { fontSize: 16, fontWeight: 'bold' },
  courseDesc: { fontSize: 13, marginTop: 4 }
});
