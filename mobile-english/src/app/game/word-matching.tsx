import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { axiosClient } from '../../api/axiosClient';
import { API_URL } from '../../constants/api';
import { useAppTheme } from '../../context/ThemeContext';

const getFixedImageURI = (url: string) => {
  if (!url) return null;
  const BASE_URL = API_URL.replace('/api', '');
  return url.startsWith('http') ? url : BASE_URL + (url.startsWith('/') ? '' : '/') + url;
};

export default function WordMatchingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const difficulty = (params.difficulty as string) || 'NORMAL';
  const { isDark, theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [gameConfig, setGameConfig] = useState<any>({
    pointsPerItem: 15,
    penaltyPoints: 5,
    timeLimit: 60,
  });
  
  const [columnA, setColumnA] = useState<any[]>([]);
  const [columnB, setColumnB] = useState<any[]>([]);
  
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  
  const [connections, setConnections] = useState<any[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [layoutsA, setLayoutsA] = useState<Record<number, any>>({});
  const [layoutsB, setLayoutsB] = useState<Record<number, any>>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    fetchGameData();
  }, []);

  useEffect(() => {
    if (loading || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, gameOver]);

  const fetchGameData = async () => {
    try {
      const res = await axiosClient.get(`/game/word-matching/start?difficulty=${difficulty}`);
      if (res.data?.data) {
        if (res.data.data.config) {
          setGameConfig(res.data.data.config);
          if (res.data.data.config.timeLimit) {
            setTimeLeft(res.data.data.config.timeLimit);
          }
        }
        setColumnA(res.data.data.columnA);
        setColumnB(res.data.data.columnB);
        startTime.current = Date.now();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu game', [{ text: 'Trở về', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectA = (id: number) => {
    if (gameOver) return;
    if (connections.find(c => c.wordId === id)) {
      setConnections(prev => prev.filter(c => c.wordId !== id));
      return;
    }
    
    setSelectedA(id);
    if (selectedB !== null) {
      makeConnection(id, selectedB);
    }
  };

  const handleSelectB = (id: number) => {
    if (gameOver) return;
    if (connections.find(c => c.selectedMeaningId === id)) {
      setConnections(prev => prev.filter(c => c.selectedMeaningId !== id));
      return;
    }
    
    setSelectedB(id);
    if (selectedA !== null) {
      makeConnection(selectedA, id);
    }
  };

  const makeConnection = (idA: number, idB: number) => {
    setConnections(prev => [...prev, { wordId: idA, selectedMeaningId: idB }]);
    setSelectedA(null);
    setSelectedB(null);
  };

  const handleSubmit = async () => {
    if (gameOver) return;
    setGameOver(true);
    
    if (connections.length === 0) {
      Alert.alert('Bạn chưa nối từ nào!', '', [{ text: 'Thoát', onPress: () => router.back() }]);
      return;
    }

    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    
    try {
      const res = await axiosClient.post('/game/word-matching/submit', {
        difficulty,
        duration,
        answers: connections
      });
      
      const result = res.data?.data;
      Alert.alert(
        'Hoàn thành!', 
        'Điểm: ' + result.totalScore + '\\nSố câu đúng: ' + result.correctCount + '/' + result.totalQuestions + '\\nThời gian: ' + duration + 's',
        [{ text: 'Về danh sách', onPress: () => router.back() }]
      );
    } catch (e) {
      console.log(e);
      Alert.alert('Lỗi', 'Không thể gửi kết quả.', [{ text: 'Thoát', onPress: () => router.back() }]);
    }
  };

  const renderColumnAItem = (item: any) => {
    const isSelected = selectedA === item.id;
    const isConnected = connections.find(c => c.wordId === item.id);
    
    return (
      <TouchableOpacity
        key={"A-" + item.id}
        style={[
          styles.card,
          { backgroundColor: theme.card },
          styles.cardA,
          isDark && { borderColor: '#2563eb' },
          isSelected && styles.cardSelected,
          isConnected && [styles.cardConnected, isDark && { backgroundColor: '#052e16', borderColor: '#10b981' }]
        ]}
        onPress={() => handleSelectA(item.id)}
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setLayoutsA(prev => ({ ...prev, [item.id]: { y: layout.y, height: layout.height } }));
        }}
      >
        <Text style={[styles.cardText, { color: theme.text }, isConnected && [styles.textConnected, isDark && { color: '#34d399' }]]}>{item.word}</Text>
        <Text style={[styles.cardPhonetic, { color: theme.subtext }]}>{item.phonetic}</Text>
      </TouchableOpacity>
    );
  };

  const renderColumnBItem = (item: any) => {
    const isSelected = selectedB === item.id;
    const isConnected = connections.find(c => c.selectedMeaningId === item.id);
    
    return (
      <TouchableOpacity
        key={"B-" + item.id}
        style={[
          styles.card,
          { backgroundColor: theme.card },
          styles.cardB,
          isDark && { borderColor: '#d97706' },
          isSelected && styles.cardSelected,
          isConnected && [styles.cardConnected, isDark && { backgroundColor: '#052e16', borderColor: '#10b981' }]
        ]}
        onPress={() => handleSelectB(item.id)}
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setLayoutsB(prev => ({ ...prev, [item.id]: { y: layout.y, height: layout.height } }));
        }}
      >
        <Text style={[styles.cardText, { color: theme.text }, isConnected && [styles.textConnected, isDark && { color: '#34d399' }]]}>{item.meaning}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 10, color: theme.subtext }}>Đang chuẩn bị từ vựng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: isDark ? theme.border : '#6ee7b7' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.titleText, { color: isDark ? '#34d399' : '#047857' }]}>Nối Từ</Text>
        <View style={[styles.timerBox, { backgroundColor: isDark ? '#450a0a' : '#fee2e2' }]}>
          <Ionicons name="timer-outline" size={16} color="#ef4444" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 15, paddingBottom: 100}}>
        <Text style={[styles.instruction, { color: theme.subtext }]}>Chạm vào một ô bên trái, sau đó chạm vào ô bên phải để nối cặp. Chạm lại để hủy nối.</Text>
        
        <View style={styles.columnsContainer} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          
          {/* Render Lines */}
          {containerWidth > 0 && connections.map((conn, idx) => {
            const layoutA = layoutsA[conn.wordId];
            const layoutB = layoutsB[conn.selectedMeaningId];
            if (!layoutA || !layoutB) return null;

            const colWidth = (containerWidth - 21) / 2;
            const startX = colWidth; // Right edge of column A
            const startY = layoutA.y + layoutA.height / 2;
            
            const endX = colWidth + 21; // Left edge of column B
            const endY = layoutB.y + layoutB.height / 2;

            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            const centerX = (startX + endX) / 2;
            const centerY = (startY + endY) / 2;

            return (
              <View 
                key={`line-${idx}`}
                style={{
                  position: 'absolute',
                  left: centerX - length / 2,
                  top: centerY - 2,
                  width: length,
                  height: 4,
                  backgroundColor: '#10b981', // green-500
                  transform: [{ rotate: `${angle}deg` }],
                  zIndex: -1,
                  elevation: -1
                }} 
              />
            );
          })}
          
          <View style={styles.column}>
            <Text style={[styles.colTitle, { color: theme.text }]}>Tiếng Anh</Text>
            {columnA.map(renderColumnAItem)}
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]}></View>
          
          <View style={styles.column}>
            <Text style={[styles.colTitle, { color: theme.text }]}>Tiếng Việt</Text>
            {columnB.map(renderColumnBItem)}
          </View>
        </View>
      </ScrollView>

      {!gameOver && connections.length === columnA.length && (
        <View style={[styles.submitContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Nộp bài ngay</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 2 },
  backBtn: { padding: 5 },
  titleText: { fontSize: 18, fontWeight: 'bold' },
  timerBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  timerText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 4 },
  
  instruction: { fontSize: 13, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  
  columnsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center' },
  divider: { width: 1, marginHorizontal: 10 },
  colTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  
  card: { 
    width: '100%', 
    minHeight: 80, 
    borderRadius: 12, 
    marginBottom: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 10, 
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2,
    borderWidth: 2
  },
  cardA: { borderColor: '#93c5fd' },
  cardB: { borderColor: '#fcd34d' },
  cardSelected: { borderColor: '#ef4444', borderWidth: 3, transform: [{ scale: 1.05 }] },
  cardConnected: { backgroundColor: '#d1fae5', borderColor: '#10b981', opacity: 0.7 },
  
  cardText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  textConnected: { color: '#047857' },
  cardPhonetic: { fontSize: 12, marginTop: 5 },
  cardImage: { width: 60, height: 60, resizeMode: 'cover', borderRadius: 8 },
  
  submitContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  submitBtn: { backgroundColor: '#10b981', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
