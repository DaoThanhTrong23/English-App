import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';

export interface VocabReviewModalProps {
  visible: boolean;
  onClose: () => void;
  queue: any[];
  onFinished?: (stats: { correctCount: number; xpEarned: number }) => void;
}

export default function VocabReviewModal({
  visible,
  onClose,
  queue,
  onFinished,
}: VocabReviewModalProps) {
  const { isDark, theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Đảm bảo khoảng cách an toàn không bị camera đục lỗ/tai thỏ/status bar che khuất
  const topInset = Math.max(
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : insets.top,
    insets.top,
    Platform.OS === 'ios' ? 44 : 32
  );
  const bottomInset = Math.max(insets.bottom, 16);

  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (visible && queue && queue.length > 0) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      setReviewQueue(shuffled);
      setCurrentIndex(0);
      setShowAnswer(false);
      setIsFinished(false);
      setSessionCorrectCount(0);
      setSessionXpEarned(0);

      if (shuffled[0]?.word?.headword) {
        setTimeout(() => playPronunciation(shuffled[0].word.headword), 400);
      }
    }
  }, [visible, queue]);

  const playPronunciation = (text?: string) => {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.85 });
  };

  const handleReviewAnswer = async (isCorrect: boolean) => {
    if (isSubmitting || reviewQueue.length === 0) return;
    const currentItem = reviewQueue[currentIndex];
    const wordId = currentItem.wordId || currentItem.word?.id;

    try {
      setIsSubmitting(true);
      const res = await axiosClient.post('/student/vocabulary/reviews', {
        wordId,
        isCorrect,
      });

      const awardedXp = res.data?.data?.xpAwarded ?? (isCorrect ? 5 : 1);
      if (isCorrect) {
        setSessionCorrectCount((prev) => prev + 1);
      }
      setSessionXpEarned((prev) => prev + awardedXp);

      if (currentIndex + 1 < reviewQueue.length) {
        setCurrentIndex((prev) => prev + 1);
        setShowAnswer(false);
        const nextWord = reviewQueue[currentIndex + 1]?.word?.headword;
        if (nextWord) {
          setTimeout(() => playPronunciation(nextWord), 300);
        }
      } else {
        setIsFinished(true);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể ghi nhận kết quả ôn tập. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận thoát buổi ôn tập bất kỳ lúc nào
  const confirmExit = () => {
    Speech.stop();

    if (isFinished) {
      if (onFinished) {
        onFinished({ correctCount: sessionCorrectCount, xpEarned: sessionXpEarned });
      }
      onClose();
      return;
    }

    if (currentIndex > 0) {
      Alert.alert(
        'Dừng buổi ôn tập?',
        `Bạn đã học ${currentIndex}/${reviewQueue.length} từ và tích lũy được +${sessionXpEarned} XP.\n\nTiến trình các từ đã học đều được hệ thống lưu lại an toàn. Bạn có muốn thoát bây giờ không?`,
        [
          { text: 'Tiếp tục học', style: 'cancel' },
          {
            text: 'Dừng & Thoát',
            style: 'destructive',
            onPress: () => {
              if (onFinished) {
                onFinished({ correctCount: sessionCorrectCount, xpEarned: sessionXpEarned });
              }
              onClose();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Thoát ôn tập?',
        'Bạn có chắc chắn muốn rời khỏi buổi luyện tập từ vựng không?',
        [
          { text: 'Tiếp tục học', style: 'cancel' },
          {
            text: 'Thoát ra',
            style: 'destructive',
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    }
  };

  const handleFinishDone = () => {
    Speech.stop();
    if (onFinished) {
      onFinished({ correctCount: sessionCorrectCount, xpEarned: sessionXpEarned });
    }
    onClose();
  };

  const currentReviewItem = reviewQueue[currentIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={confirmExit}
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: theme.background,
            paddingTop: topInset,
          },
        ]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Modal Header (Đã đẩy xuống dưới StatusBar và chỉ giữ lại 1 nút Thoát bên trái) */}
        <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={confirmExit}
            style={styles.modalCloseBtn}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.text} />
            <Text style={[styles.headerExitText, { color: theme.text }]}>Thoát</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Ôn tập Spaced Repetition</Text>
            <Text style={[styles.modalProgressText, { color: theme.primary }]}>
              {isFinished
                ? 'Hoàn thành!'
                : `Từ ${currentIndex + 1} / ${reviewQueue.length}`}
            </Text>
          </View>

          {/* Cân đối layout bằng spacer 60px để tiêu đề nằm chính giữa màn hình */}
          <View style={{ width: 68 }} />
        </View>

        {/* Progress Bar */}
        {!isFinished && reviewQueue.length > 0 && (
          <View style={[styles.progressBarBg, { backgroundColor: theme.cardSecondary }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${((currentIndex + 1) / reviewQueue.length) * 100}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
        )}

        {isFinished ? (
          /* COMPLETION CELEBRATION VIEW */
          <View style={[styles.finishContainer, { paddingBottom: bottomInset + 16 }]}>
            <View style={[styles.trophyBox, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
              <Ionicons name="trophy" size={60} color="#f59e0b" />
            </View>
            <Text style={[styles.finishTitle, { color: theme.text }]}>
              Xuất sắc! Đã hoàn thành ôn tập
            </Text>
            <Text style={[styles.finishSub, { color: theme.subtext }]}>
              Các từ vựng đã được hệ thống cập nhật lịch ôn ngắt quãng tiếp theo.
            </Text>

            <View style={[styles.finishCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.finishStatRow}>
                <Text style={[styles.finishStatLabel, { color: theme.subtext }]}>Tổng số từ ôn tập:</Text>
                <Text style={[styles.finishStatValue, { color: theme.text }]}>{reviewQueue.length} từ</Text>
              </View>
              <View style={styles.finishStatRow}>
                <Text style={[styles.finishStatLabel, { color: theme.subtext }]}>Số từ đã nhớ tốt:</Text>
                <Text style={[styles.finishStatValue, { color: '#10b981' }]}>
                  {sessionCorrectCount} từ
                </Text>
              </View>
              <View style={styles.finishStatRow}>
                <Text style={[styles.finishStatLabel, { color: theme.subtext }]}>Điểm kinh nghiệm thưởng:</Text>
                <Text style={[styles.finishStatValue, { color: '#f59e0b' }]}>
                  +{sessionXpEarned} XP
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.finishDoneBtn, { backgroundColor: theme.primary }]}
              onPress={handleFinishDone}
            >
              <Text style={styles.finishDoneBtnText}>Hoàn tất ôn tập</Text>
            </TouchableOpacity>
          </View>
        ) : currentReviewItem ? (
          /* ACTIVE FLASHCARD VIEW */
          <View style={[styles.flashcardWrapper, { paddingBottom: bottomInset + 14 }]}>
            <View
              style={[
                styles.flashcard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Top Badge */}
              <View style={styles.flashcardHeader}>
                <View style={[styles.flashcardBadge, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
                    Cấp độ nhớ: Level {currentReviewItem.memoryLevel ?? 0}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => playPronunciation(currentReviewItem.word?.headword)}
                  style={[styles.audioCircleBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="volume-high" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Headword & IPA */}
              <View style={styles.cardCenter}>
                <Text style={[styles.cardHeadword, { color: theme.text }]}>
                  {currentReviewItem.word?.headword}
                </Text>
                {currentReviewItem.word?.phonetic ? (
                  <Text style={[styles.cardPhonetic, { color: theme.primary }]}>
                    {currentReviewItem.word.phonetic.startsWith('/')
                      ? currentReviewItem.word.phonetic
                      : `/${currentReviewItem.word.phonetic}/`}
                  </Text>
                ) : null}

                {currentReviewItem.word?.partOfSpeech ? (
                  <Text style={[styles.cardPos, { color: theme.subtext }]}>
                    ({currentReviewItem.word.partOfSpeech})
                  </Text>
                ) : null}
              </View>

              {/* Revealed Answer Area */}
              {showAnswer ? (
                <View style={[styles.answerSection, { backgroundColor: isDark ? '#1c1c1f' : '#f8fafc', borderColor: theme.border }]}>
                  <Text style={styles.answerLabel}>Nghĩa tiếng Việt:</Text>
                  <Text style={[styles.cardMeaning, { color: theme.text }]}>
                    {currentReviewItem.word?.meaning}
                  </Text>
                  {currentReviewItem.word?.exampleSentence ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.answerLabel}>Câu ví dụ:</Text>
                      <Text style={[styles.cardExample, { color: theme.subtext }]}>
                        “{currentReviewItem.word.exampleSentence}”
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.revealBtn, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}
                  onPress={() => setShowAnswer(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="eye-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.revealBtnText, { color: theme.primary }]}>
                    Lật thẻ xem nghĩa & ví dụ
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Actions Area */}
            <View style={{ gap: 10 }}>
              {/* Action buttons (Chưa nhớ / Đã nhớ) */}
              {showAnswer ? (
                <View style={styles.decisionRow}>
                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.wrongBtn]}
                    onPress={() => handleReviewAnswer(false)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={22} color="#ffffff" />
                        <Text style={styles.decisionBtnText}>Chưa nhớ</Text>
                        <Text style={styles.decisionSubText}>Ôn lại ngày mai (+1 XP)</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.correctBtn]}
                    onPress={() => handleReviewAnswer(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                        <Text style={styles.decisionBtnText}>Đã nhớ rõ</Text>
                        <Text style={styles.decisionSubText}>Tăng cấp (+5 XP)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Nút thoát / dừng học rõ ràng ở đáy màn hình */}
              <TouchableOpacity
                style={[styles.bottomPauseBtn, { borderColor: theme.border }]}
                onPress={confirmExit}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={17} color={theme.subtext} />
                <Text style={[styles.bottomPauseBtnText, { color: theme.subtext }]}>
                  Dừng luyện tập & Thoát ra
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
    gap: 4,
  },
  headerExitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  modalProgressText: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  progressBarBg: { height: 4, width: '100%' },
  progressBarFill: { height: '100%' },

  flashcardWrapper: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  flashcard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    minHeight: 330,
    justifyContent: 'space-between',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashcardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCenter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardHeadword: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardPhonetic: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardPos: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  answerSection: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardMeaning: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  cardExample: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  revealBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  revealBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  decisionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongBtn: {
    backgroundColor: '#ef4444',
  },
  correctBtn: {
    backgroundColor: '#10b981',
  },
  decisionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 3,
  },
  decisionSubText: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.9,
    marginTop: 2,
  },

  bottomPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  bottomPauseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Finished View */
  finishContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  finishTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  finishSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  finishCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  finishStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  finishStatLabel: {
    fontSize: 14,
  },
  finishStatValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  finishDoneBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishDoneBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
