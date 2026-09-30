import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../api/axiosClient';
import * as SecureStore from 'expo-secure-store';

export default function OnboardingScreen() {
  const router = useRouter();

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

  const selectAnswer = (answer: string) => {
    const q = questions[currentQIndex];
    const newAnswers = [...answers, { id: q.id, answer }];
    setAnswers(newAnswers);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{marginTop: 10, color: '#64748b'}}>Đang xử lý...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* BƯỚC 1: LẤY THÔNG TIN CÁ NHÂN */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Chào mừng bạn mới! 👋</Text>
          <Text style={styles.subtitle}>Hãy cho chúng tôi biết một chút về bạn để xây dựng lộ trình học phù hợp nhất nhé.</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nghề nghiệp hiện tại của bạn:</Text>
            <View style={styles.chipContainer}>
              {JOB_OPTIONS.map((opt) => (
                <TouchableOpacity 
                  key={opt}
                  style={[styles.chip, job === opt && styles.chipSelected]}
                  onPress={() => setJob(opt)}
                >
                  <Text style={[styles.chipText, job === opt && styles.chipTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sở thích cá nhân (Chọn nhiều):</Text>
            <View style={styles.chipContainer}>
              {INTEREST_OPTIONS.map((opt) => (
                <TouchableOpacity 
                  key={opt}
                  style={[styles.chip, interests.includes(opt) && styles.chipSelected]}
                  onPress={() => toggleInterest(opt)}
                >
                  <Text style={[styles.chipText, interests.includes(opt) && styles.chipTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={startTest} disabled={interests.length === 0}>
            <Text style={styles.btnText}>Làm bài Test năng lực</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8}} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* BƯỚC 2: LÀM BÀI TEST */}
      {step === 2 && questions.length > 0 && (
        <View style={styles.content}>
          <Text style={styles.progressText}>Câu hỏi {currentQIndex + 1} / {questions.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQIndex + 1) / questions.length) * 100}%` }]} />
          </View>
          
          <Text style={styles.questionText}>{questions[currentQIndex].question}</Text>
          
          {questions[currentQIndex].options.map((opt: string, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.optionBtn}
              onPress={() => selectAnswer(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* BƯỚC 3: KẾT QUẢ & RECOMMENDATION */}
      {step === 3 && result && (
        <View style={styles.content}>
          <Ionicons name="trophy" size={80} color="#f59e0b" style={{alignSelf: 'center', marginBottom: 20}} />
          <Text style={styles.title}>Hoàn tất đánh giá!</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Điểm số: <Text style={styles.resultValue}>{result.score}</Text></Text>
            <Text style={styles.resultLabel}>Trình độ CEFR: <Text style={[styles.resultValue, {color: '#2563eb'}]}>{result.cefrLevel}</Text></Text>
            {result.eloProfile && (
              <View style={{marginTop: 10}}>
                <Text style={styles.resultLabel}>Phân tích năng lực (FAME-KT Elo):</Text>
                <Text style={{color: '#64748b'}}>Ngữ pháp: {result.eloProfile.Grammar} | Từ vựng: {result.eloProfile.Vocabulary}</Text>
                <Text style={{color: '#64748b'}}>Nghe: {result.eloProfile.Listening} | Đọc: {result.eloProfile.Reading}</Text>
              </View>
            )}
          </View>

          <Text style={styles.subtitle}>Dựa trên nghề nghiệp và trình độ của bạn, chúng tôi đề xuất các khóa học sau:</Text>
          
          {result.recommendedCourses?.map((course: any) => (
            <View key={course.id} style={styles.courseCard}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.btnText}>Vào Trang chủ</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, fontSize: 15, color: '#0f172a' },
  btnPrimary: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipSelected: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { color: '#475569', fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#2563eb', fontWeight: 'bold' },

  
  progressText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 30 },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 3 },
  questionText: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 30, lineHeight: 32 },
  optionBtn: { padding: 18, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, marginBottom: 12 },
  optionText: { fontSize: 16, fontWeight: '500', color: '#334155', textAlign: 'center' },

  resultCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  resultLabel: { fontSize: 16, color: '#475569', marginBottom: 8 },
  resultValue: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  courseCard: { padding: 16, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  courseDesc: { fontSize: 13, color: '#64748b', marginTop: 4 }
});
