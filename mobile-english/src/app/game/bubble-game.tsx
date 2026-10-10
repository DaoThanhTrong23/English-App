import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../../api/axiosClient';
import { API_URL } from '../../constants/api';

const { width, height } = Dimensions.get('window');
const BUBBLE_SIZE = 110;

// Random position that allows floating slightly out of bounds
const getRandomPosition = () => {
  // Allow -50 to width/height + 50
  return {
    x: Math.random() * (width + 100) - 50,
    y: Math.random() * (height + 100) - 50,
  };
};

const getFixedImageURI = (url: string) => {
  if (!url) return null;
  const BASE_URL = API_URL.replace('/api', '');
  return url.startsWith('http') ? url : BASE_URL + (url.startsWith('/') ? '' : '/') + url;
};

// A floating Bubble component
const FloatingBubble = ({ item, isSelected, onPress, type }: any) => {
  const pan = useRef(new Animated.ValueXY(getRandomPosition())).current;

  useEffect(() => {
    moveRandomly();
  }, []);

  const moveRandomly = () => {
    Animated.timing(pan, {
      toValue: getRandomPosition(),
      duration: 6000 + Math.random() * 4000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) moveRandomly();
    });
  };

  return (
    <Animated.View style={[styles.bubbleWrapper, { left: pan.x, top: pan.y }]}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => onPress(item, type)}
        style={[
            styles.bubble, 
            type === 'word' ? styles.bubbleWord : styles.bubbleMeaning,
            isSelected && styles.bubbleSelected
          ]}
      >
        
        <View style={styles.bubbleHighlight} />
        <View style={styles.bubbleReflection} />
        {type === 'word' ? (
          <Text style={styles.bubbleText}>{item.word}</Text>
        ) : (
          <Text style={styles.bubbleTextMeaning}>{item.meaning}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function BubbleGameScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [allWords, setAllWords] = useState<any[]>([]);
  const [allMeanings, setAllMeanings] = useState<any[]>([]);
  
  // Track IDs currently in the arena (max 5)
  const [activeIds, setActiveIds] = useState<number[]>([]);
  // Track IDs remaining in the queue to be spawned
  const [queueIds, setQueueIds] = useState<number[]>([]);
  
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    fetchGameData();
  }, []);

  useEffect(() => {
    if (loading || gameOver) return;
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, gameOver]);

  // Check win condition
  useEffect(() => {
    if (!loading && allWords.length > 0 && matchedIds.length === allWords.length && !gameOver) {
      endGame();
    }
  }, [matchedIds, loading, gameOver, allWords]);

  const fetchGameData = async () => {
    try {
      const res = await axiosClient.get('/game/bubble-game/start?limit=15'); // Fetch more to queue
      if (res.data?.data) {
        const words = res.data.data.wordBubbles;
        const meanings = res.data.data.meaningBubbles;
        
        // Lấy tất cả ảnh để preload
        const imageUrls = meanings
          .map((m: any) => getFixedImageURI(m.imageUrl))
          .filter(Boolean) as string[];

        // Preload toàn bộ ảnh (nếu có) trước khi cho phép vào game
        if (imageUrls.length > 0) {
          await Promise.all(imageUrls.map(url => Image.prefetch(url).catch(() => {})));
        }

        setAllWords(words);
        setAllMeanings(meanings);
        
        const allItemIds = words.map((w: any) => w.id);
        
        // Spawn 5 bóng ban đầu, còn lại nạp vào hàng chờ
        setActiveIds(allItemIds.slice(0, 5));
        setQueueIds(allItemIds.slice(5));

        startTime.current = Date.now();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu game', [{ text: 'Trở về', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (item: any, type: 'word' | 'meaning') => {
    if (gameOver) return;

    let currentSelectedWord = selectedWord;
    let currentSelectedMeaning = selectedMeaning;

    if (type === 'word') {
      if (selectedWord?.id === item.id) {
        setSelectedWord(null);
        return;
      }
      setSelectedWord(item);
      currentSelectedWord = item;
    } else {
      if (selectedMeaning?.id === item.id) {
        setSelectedMeaning(null);
        return;
      }
      setSelectedMeaning(item);
      currentSelectedMeaning = item;
    }

    // Nếu đã chọn đủ 1 cặp
    if (currentSelectedWord && currentSelectedMeaning) {
      const isCorrect = currentSelectedWord.id === currentSelectedMeaning.id;
      const timeTakenMs = Date.now() - startTime.current;

      if (isCorrect) {
        
        const matchId = currentSelectedWord.id;
        
        setMatchedIds(prev => [...prev, matchId]);
        
        // Gỡ cặp này khỏi màn hình (activeIds)
        setActiveIds(prev => prev.filter(id => id !== matchId));
        
        // Bơm thêm 1 cặp từ hàng chờ (queueIds) vào màn hình nếu còn
        setQueueIds(prevQueue => {
          if (prevQueue.length > 0) {
            const nextId = prevQueue[0];
            setActiveIds(prevAct => [...prevAct, nextId]);
            return prevQueue.slice(1);
          }
          return prevQueue;
        });

      } else {
        // Sai bị trừ điểm
        
      }

      // Reset selection
      setSelectedWord(null);
      setSelectedMeaning(null);

      // Call API (không cần đợi)
      axiosClient.post('/game/bubble-game/match', {
        currentScore: score,
        matchedPairs: isCorrect ? matchedIds.length + 1 : matchedIds.length,
        totalPairs: allWords.length || 1
      }).catch(e => console.log('Lỗi gửi tiến trình', e));
    }
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    const finalScore = Math.max(10, 1000 - duration * 10); // Diem tuy thuoc vao thoi gian cang nhanh cang cao
    try {
      const res = await axiosClient.post('/game/bubble-game/finish', {
        totalScore: finalScore,
        duration,
        correctPairs: matchedIds.length,
        totalPairs: allWords.length
      });
      
      Alert.alert('Hoàn thành!', 'Thời gian: ' + duration + 's\nĐiểm thưởng tốc độ: ' + finalScore, [
        { text: 'Xong', onPress: () => router.back() }
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert('Lỗi', 'Lỗi lưu kết quả', [{ text: 'Xong', onPress: () => router.back() }]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{marginTop: 10}}>Đang tải bong bóng và hình ảnh...</Text>
      </View>
    );
  }

  // Chỉ lấy ra các bong bóng đang active
  const activeWordBubbles = allWords.filter(w => activeIds.includes(w.id));
  const activeMeaningBubbles = allMeanings.filter(m => activeIds.includes(m.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        
        <Text style={{fontSize: 12, color: "#4b5563", fontStyle: "italic", marginLeft: 10}}>Chạm 1 Bóng Chữ & 1 Bóng Hình</Text>
        <View style={styles.timerBox}>
          <Ionicons name="timer-outline" size={16} color="#ef4444" />
          <Text style={styles.timerText}>{timeElapsed}s</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        {activeWordBubbles.map(w => (
          <FloatingBubble 
            key={"word-" + w.id} 
            item={w} 
            type="word" 
            isSelected={selectedWord?.id === w.id}
            onPress={handlePress}
          />
        ))}

        {activeMeaningBubbles.map(m => (
          <FloatingBubble 
            key={"meaning-" + m.id} 
            item={m} 
            type="meaning" 
            isSelected={selectedMeaning?.id === m.id}
            onPress={handlePress}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#cffafe' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 2, borderBottomColor: '#0ea5e9', zIndex: 10 },
  backBtn: { padding: 5 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#1d4ed8' },
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  timerText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 4 },
  
  gameArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  bubbleWrapper: { position: 'absolute' },
  bubble: { 
    width: BUBBLE_SIZE, 
    height: BUBBLE_SIZE, 
    borderRadius: BUBBLE_SIZE/2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: {width: 0, height: 4}, 
    shadowOpacity: 0.2, 
    shadowRadius: 5,
    overflow: 'hidden'
  },
  bubbleHighlight: {
    position: 'absolute',
    top: BUBBLE_SIZE * 0.1,
    left: BUBBLE_SIZE * 0.15,
    width: BUBBLE_SIZE * 0.35,
    height: BUBBLE_SIZE * 0.15,
    borderRadius: BUBBLE_SIZE * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '-45deg' }]
  },
  bubbleReflection: {
    position: 'absolute',
    bottom: BUBBLE_SIZE * 0.1,
    right: BUBBLE_SIZE * 0.15,
    width: BUBBLE_SIZE * 0.15,
    height: BUBBLE_SIZE * 0.1,
    borderRadius: BUBBLE_SIZE * 0.1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '-45deg' }]
  },
  bubbleWord: { backgroundColor: 'rgba(186, 230, 253, 0.75)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.8)' },
  bubbleMeaning: { backgroundColor: 'rgba(254, 240, 138, 0.75)', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.8)' },
  bubbleSelected: { borderWidth: 4, borderColor: '#22c55e', transform: [{ scale: 1.1 }] },
  bubbleText: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' },
  bubbleTextMeaning: { fontSize: 12, fontWeight: 'bold', color: '#854d0e', textAlign: 'center', padding: 5 },
  bubbleImage: { width: BUBBLE_SIZE - 10, height: BUBBLE_SIZE - 10, borderRadius: (BUBBLE_SIZE - 10)/2, resizeMode: 'cover' },
});
