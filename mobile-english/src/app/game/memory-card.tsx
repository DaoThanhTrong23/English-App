import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../../api/axiosClient';
import { API_URL } from '../../constants/api';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 6;
const CARD_SIZE = (width - 40) / 3 - CARD_MARGIN * 2;

const getFixedImageURI = (url: string) => {
  if (!url) return null;
  const BASE_URL = API_URL.replace('/api', '');
  return url.startsWith('http') ? url : BASE_URL + (url.startsWith('/') ? '' : '/') + url;
};

// Force Metro Rebuild
export default function MemoryCardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameOver, setGameOver] = useState(false);
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
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, gameOver]);

  useEffect(() => {
    if (!loading && cards.length > 0 && matchedIds.length === cards.length / 2 && !gameOver) {
      endGame();
    }
  }, [matchedIds, loading, gameOver, cards]);

  const fetchGameData = async () => {
    try {
      const res = await axiosClient.get('/game/memory-card/start?limit=6');
      if (res.data?.data?.cards) {
        setCards(res.data.data.cards);
        startTime.current = Date.now();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu game', [{ text: 'Trở về', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (index: number) => {
    if (gameOver || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].pairId)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setTurns(prev => prev + 1);
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.pairId === card2.pairId) {
        setTimeout(() => {
          setScore(prev => prev + 20);
          setMatchedIds(prev => [...prev, card1.pairId]);
          setFlippedIndices([]);
          
          axiosClient.post('/game/memory-card/progress', {
            currentScore: score + 20,
            matchedPairs: matchedIds.length + 1,
            totalPairs: cards.length / 2,
            turns: turns + 1
          }).catch(() => {});
        }, 500);
      } else {
        setTimeout(() => {
          setScore(prev => Math.max(0, prev - 5));
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      const res = await axiosClient.post('/game/memory-card/finish', {
        totalScore: score,
        duration,
        turns,
        correctPairs: matchedIds.length,
        totalPairs: cards.length / 2
      });
      
      Alert.alert('Kết thúc!', 'Bạn đạt ' + score + ' điểm!\\nSố lượt lật: ' + turns, [
        { text: 'Xong', onPress: () => router.back() }
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert('Lỗi', 'Lỗi lưu kết quả', [{ text: 'Xong', onPress: () => router.back() }]);
    }
  };

    const renderCardContent = (card: any) => {
    if (card.type === 'word') {
      return <Text style={styles.cardText}>{card.content}</Text>;
    } else {
      return <Text style={styles.cardTextMeaning}>{card.content}</Text>;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{marginTop: 10}}>Đang xào bài...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.scoreText}>Điểm: {score}</Text>
        <View style={styles.timerBox}>
          <Ionicons name="timer-outline" size={16} color="#ef4444" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <Text style={styles.statText}>Lượt lật: {turns}</Text>
        <Text style={styles.statText}>Khớp: {matchedIds.length}/{cards.length / 2}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || matchedIds.includes(card.pairId);
          return (
            <TouchableOpacity 
              key={"card-" + index} 
              activeOpacity={0.8}
              style={[styles.card, isFlipped ? styles.cardFlipped : styles.cardHidden]}
              onPress={() => handleCardPress(index)}
            >
              {isFlipped ? renderCardContent(card) : <Ionicons name="help-outline" size={40} color="#cbd5e1" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 2, borderBottomColor: '#c4b5fd' },
  backBtn: { padding: 5 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#6d28d9' },
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  timerText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 4 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  statText: { fontSize: 14, color: '#4b5563', fontWeight: 'bold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', padding: 10 },
  card: { 
    width: CARD_SIZE, 
    height: CARD_SIZE * 1.4, 
    margin: CARD_MARGIN, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3,
    padding: 10,
    backgroundColor: '#ffffff'
  },
  cardHidden: { backgroundColor: '#8b5cf6', borderWidth: 2, borderColor: '#6d28d9' },
  cardFlipped: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#d8b4fe' },
  cardText: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
  cardTextMeaning: { fontSize: 14, fontWeight: 'bold', color: '#047857', textAlign: 'center' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'contain' }
});
