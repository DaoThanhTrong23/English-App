import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { axiosClient } from '../../api/axiosClient';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../constants/api';
import * as Speech from 'expo-speech';
import { useAudioRecorder, useAudioRecorderState, useAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

const OBSTACLES = [
  { name: 'flame', color: '#f97316' },
  { name: 'bug', color: '#ef4444' }
];

export default function MarioVoiceRunScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Game states
  const [isPaused, setIsPaused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  

  // Animations
  const groundAnim = useRef(new Animated.Value(0)).current;
  const chickenY = useRef(new Animated.Value(0)).current;
  const obstacleX = useRef(new Animated.Value(500)).current;

  const startTime = useRef(Date.now());
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true
  });
  const recorderState = useAudioRecorderState(recorder, 100);
  const isPressed = useRef(false);
  const player = useAudioPlayer(words[currentIndex]?.audioUrl || '');

  const handlePlayAudio = () => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;
    
    if (currentWord.audioUrl) {
      player.play();
    } else {
      Speech.speak(currentWord.headword, { language: 'en-US' });
    }
  };

  useEffect(() => {
    fetchGameData();
    startGroundAnimation();
    spawnObstacle();
    return () => {
      stopAnimations();
    };
  }, []);

  

  const fetchGameData = async () => {
    try {
      const res = await axiosClient.get('/game/mario/start?limit=10');
      if (res.data?.data?.words) {
        setWords(res.data.data.words);
        startTime.current = Date.now();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu game', [{ text: 'Trở về', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  };

  const startGroundAnimation = () => {
    Animated.loop(
      Animated.timing(groundAnim, {
        toValue: -100,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const spawnObstacle = () => {
    obstacleX.setValue(500);
    Animated.timing(obstacleX, {
      toValue: 50,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        // Pause and show popup
        setIsPaused(true);
        setShowPopup(true);
        groundAnim.stopAnimation();
      }
    });
  };

  const stopAnimations = () => {
    groundAnim.stopAnimation();
    obstacleX.stopAnimation();
  };

  const resumeGame = () => {
    setShowPopup(false);
    // Jump animation
    Animated.sequence([
      Animated.timing(chickenY, { toValue: -100, duration: 300, useNativeDriver: true }),
      Animated.timing(chickenY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      // Move obstacle off screen
      Animated.timing(obstacleX, {
        toValue: -100,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        // Next word
        if (currentIndex < words.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsPaused(false);
          startGroundAnimation();
          spawnObstacle();
        } else {
          endGame();
        }
      });
    });
  };

  const startRecording = async () => {
    isPressed.current = true;
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      try { await recorder.prepareToRecordAsync(); } catch (e) { }

      // If user released the button while we were preparing, don't start recording!
      if (!isPressed.current) return;

      recorder.record();
      setIsRecording(true);
    } catch (err) { }
  };

  const stopRecording = async () => {
    isPressed.current = false;
    setIsRecording(false);
    try {
      try {
        await recorder.stop();
      } catch (e) {
        console.log("Stop recording error", e);
        return;
      }
      // Wait for iOS to flush the file to disk
      await new Promise(resolve => setTimeout(resolve, 300));
      const uri = recorder.uri;

      if (!uri) return;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.log("Audio file does not exist on disk:", uri);
        Alert.alert('Lỗi', 'Không thể tạo file ghi âm. Hãy thử lại.');
        return;
      }

      // Axios sometimes needs the file:// prefix stripped on iOS, or sometimes it needs it. 
      // uri is usually file:///... which is fine, but let's be safe.
      // Pass the exact uri which includes file://
      const cleanUri = uri;
      const currentWord = words[currentIndex];
      // Use expo-file-system for reliable multipart uploads
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await FileSystem.uploadAsync(`${API_URL}/ai/evaluate-pronunciation`, uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'audio',
        mimeType: 'audio/m4a',
        parameters: {
          targetWord: currentWord.headword,
          targetIpa: currentWord.phonetic || ''
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = JSON.parse(response.body);
      const pScore = responseData?.data?.overallScore || 0;
      if (pScore >= 60) {
        setScore(prev => prev + 10);
        Alert.alert('Tuyệt vời!', 'Điểm: ' + Math.round(pScore) + '%', [
          { text: 'Tiếp tục', onPress: resumeGame }
        ]);
      } else {
        Alert.alert('Chưa chính xác', 'Điểm: ' + Math.round(pScore) + '%. Hãy thử lại!');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Lỗi', 'Không thể chấm điểm');
    }
  };

  const skipWord = () => {
    setScore(prev => Math.max(0, prev - 5));
    resumeGame();
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      await axiosClient.post('/game/mario/finish', {
        totalScore: score,
        duration,
        correctPairs: Math.floor(score / 10),
        totalPairs: words.length
      });

      Alert.alert('Chiến thắng!', 'Gà con đã về đích an toàn!\\nĐiểm: ' + score, [
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
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ marginTop: 10 }}>Đang nạp dữ liệu đường đua...</Text>
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
        <View style={styles.stageBox}>
          <Text style={styles.stageText}>{currentIndex + 1}/{words.length}</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        {/* Background Clouds */}
        <Animated.View style={[styles.clouds, { transform: [{ translateX: groundAnim }] }]}>
          <Ionicons name="cloud" size={60} color="#ffffff" style={{ marginLeft: 50, opacity: 0.8 }} />
          <Ionicons name="cloud" size={40} color="#ffffff" style={{ marginLeft: 150, marginTop: 20, opacity: 0.6 }} />
          <Ionicons name="cloud" size={80} color="#ffffff" style={{ marginLeft: 100, opacity: 0.7 }} />
        </Animated.View>

        {/* Ground */}
        <View style={styles.groundBase}>
          <Animated.View style={[styles.groundPattern, { transform: [{ translateX: groundAnim }] }]} />
        </View>

        {/* Chicken */}
        <Animated.View style={[styles.chicken, { transform: [{ translateY: chickenY }] }]}>
          {/* @ts-ignore */}
          <Animated.Image source={require('../../../assets/images/gacon.gif')} style={{ width: 60, height: 60 }} />
        </Animated.View>

        {/* Obstacle */}
        <Animated.View style={[styles.obstacle, { transform: [{ translateX: obstacleX }] }]}>
          <Ionicons name={OBSTACLES[currentIndex % OBSTACLES.length].name as any} size={42} color={OBSTACLES[currentIndex % OBSTACLES.length].color} />
        </Animated.View>

        {/* Popup */}
        {showPopup && words[currentIndex] && (
          <View style={styles.popupOverlay}>
            <View style={styles.popup}>
              <Text style={styles.wordText}>{words[currentIndex].headword}</Text>
              <Text style={styles.phoneticText}>/{words[currentIndex].phonetic}/</Text>
              
              <TouchableOpacity onPress={handlePlayAudio} style={{ marginBottom: 10, backgroundColor: '#f3f4f6', padding: 8, borderRadius: 20 }}>
                  <Ionicons name="volume-high" size={24} color="#3b82f6" />
                </TouchableOpacity>
              <Text style={styles.meaningText}>{words[currentIndex].meaning}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.skipBtn} onPress={skipWord}>
                  <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Bỏ qua</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.recordBtn, isRecording && styles.recordingBtn]}
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                >
                  <Ionicons name="mic" size={32} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text style={{ marginTop: 10, color: '#6b7280', fontSize: 12 }}>
                {isRecording ? "Đang ghi âm..." : "Nhấn giữ để phát âm"}
              </Text>
              {isRecording && (
                <View style={{ width: '100%', height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, marginTop: 10, overflow: 'hidden' }}>
                  <Animated.View style={{
                    height: '100%',
                    backgroundColor: '#10b981',
                    width: `${Math.max(0, Math.min(100, ((recorderState.metering || -60) + 60) * (100 / 60)))}%`
                  }} />
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#38bdf8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, zIndex: 10 },
  backBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20 },
  scoreText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  stageBox: { backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  stageText: { color: '#0369a1', fontWeight: 'bold' },

  gameArea: { flex: 1, position: 'relative' },
  clouds: { flexDirection: 'row', position: 'absolute', top: 50, width: 1000 },

  groundBase: { position: 'absolute', bottom: 0, width: '100%', height: 150, backgroundColor: '#84cc16', borderTopWidth: 5, borderTopColor: '#65a30d' },
  groundPattern: { position: 'absolute', bottom: 0, width: 2000, height: 150, borderTopWidth: 2, borderTopColor: '#4d7c0f', borderStyle: 'dashed' },

  chicken: { position: 'absolute', bottom: 150, left: 50 },
  obstacle: { position: 'absolute', bottom: 150 },

  popupOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  popup: { backgroundColor: '#ffffff', padding: 25, borderRadius: 20, width: '80%', alignItems: 'center', elevation: 5 },
  wordText: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  phoneticText: { fontSize: 16, color: '#6366f1', marginVertical: 5 },
  meaningText: { fontSize: 18, color: '#10b981', marginBottom: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' },
  skipBtn: { padding: 10 },
  recordBtn: { backgroundColor: '#3b82f6', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  recordingBtn: { backgroundColor: '#ef4444', transform: [{ scale: 1.1 }] }
});
