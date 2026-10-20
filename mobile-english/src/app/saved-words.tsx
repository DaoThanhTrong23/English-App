import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';
import VocabReviewModal from '../components/VocabReviewModal';

export default function SavedWordsScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  // Data states
  const [words, setWords] = useState<any[]>([]);
  const [dueReviews, setDueReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'due' | 'learning' | 'mastered'>('all');
  const [togglingWordId, setTogglingWordId] = useState<number | null>(null);

  // Review Modal states
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [savedRes, dueRes] = await Promise.all([
        axiosClient.get('/profile/saved-words'),
        axiosClient.get('/student/vocabulary/reviews/due').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (savedRes.data?.success) {
        setWords(savedRes.data.data || []);
      }
      if (dueRes.data?.success) {
        setDueReviews(dueRes.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching saved words:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const playPronunciation = (text?: string) => {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.85 });
  };

  const handleUnsaveWord = (item: any) => {
    const headword = item.word?.headword || 'từ này';
    const wordId = item.wordId || item.word?.id;

    Alert.alert(
      'Bỏ lưu từ vựng',
      `Bạn có chắc chắn muốn bỏ lưu từ "${headword}" khỏi sổ tay từ vựng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ lưu',
          style: 'destructive',
          onPress: async () => {
            try {
              setTogglingWordId(wordId);
              const res = await axiosClient.post('/student/vocabulary/toggle', { wordId });
              if (res.data?.success) {
                setWords(prev => prev.filter(w => (w.wordId || w.word?.id) !== wordId));
                setDueReviews(prev => prev.filter(w => (w.wordId || w.word?.id) !== wordId));
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể bỏ lưu từ vựng lúc này');
            } finally {
              setTogglingWordId(null);
            }
          },
        },
      ]
    );
  };

  // SRS Practice Handlers
  const startReviewSession = (mode: 'due' | 'all') => {
    let queue: any[] = [];
    if (mode === 'due') {
      queue = [...dueReviews];
      if (queue.length === 0) {
        Alert.alert(
          'Không có từ cần ôn tập!',
          'Hôm nay bạn không có từ nào đến hạn ôn tập SRS. Bạn có muốn luyện tập tự do tất cả từ đã lưu không?',
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Luyện tập tự do', onPress: () => startReviewSession('all') },
          ]
        );
        return;
      }
    } else {
      queue = [...words];
      if (queue.length === 0) {
        Alert.alert('Chưa có từ vựng', 'Bạn chưa lưu từ vựng nào để ôn tập!');
        return;
      }
    }

    setReviewQueue(queue);
    setReviewModalVisible(true);
  };

  // Filter logic
  const now = new Date();
  const filteredWords = words.filter(item => {
    // Search query check
    const headword = item.word?.headword?.toLowerCase() || '';
    const meaning = item.word?.meaning?.toLowerCase() || '';
    const query = searchQuery.trim().toLowerCase();
    if (query && !headword.includes(query) && !meaning.includes(query)) {
      return false;
    }

    // Tab filter
    if (filterTab === 'due') {
      return item.nextReviewDate && new Date(item.nextReviewDate) <= now;
    }
    if (filterTab === 'learning') {
      return item.status === 'learning' || item.status === 'new';
    }
    if (filterTab === 'mastered') {
      return item.status === 'mastered' || (item.memoryLevel || 0) >= 4;
    }
    return true;
  });

  const dueCount = dueReviews.length;
  const masteredCount = words.filter(w => w.status === 'mastered' || (w.memoryLevel || 0) >= 4).length;
  const learningCount = words.filter(w => w.status !== 'mastered' && (w.memoryLevel || 0) < 4).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Lịch sử từ vựng đã lưu</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
            {words.length} từ đã lưu trong sổ tay
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS OVERVIEW CARDS */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{words.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Tổng từ lưu</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: dueCount > 0 ? '#ef4444' : '#10b981' }]}>
              {dueCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Cần ôn hôm nay</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{masteredCount}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Thành thạo</Text>
          </View>
        </View>

        {/* SPACED REPETITION REVIEW BANNER */}
        <View
          style={[
            styles.srsBanner,
            {
              backgroundColor: dueCount > 0 ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#064e3b' : '#ecfdf5'),
              borderColor: dueCount > 0 ? '#f59e0b' : '#10b981',
            },
          ]}
        >
          <View style={styles.srsBannerHeader}>
            <View
              style={[
                styles.srsBannerIconBox,
                { backgroundColor: dueCount > 0 ? '#f59e0b' : '#10b981' },
              ]}
            >
              <Ionicons
                name={dueCount > 0 ? 'alarm' : 'checkmark-circle'}
                size={22}
                color="#ffffff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.srsBannerTitle,
                  { color: dueCount > 0 ? (isDark ? '#fef3c7' : '#92400e') : (isDark ? '#ecfdf5' : '#065f46') },
                ]}
              >
                {dueCount > 0
                  ? `Có ${dueCount} từ cần ôn tập hôm nay!`
                  : 'Bạn đã hoàn thành các từ đến hạn!'}
              </Text>
              <Text
                style={[
                  styles.srsBannerSub,
                  { color: dueCount > 0 ? (isDark ? '#fde68a' : '#b45309') : (isDark ? '#a7f3d0' : '#047857') },
                ]}
              >
                {dueCount > 0
                  ? 'Ôn tập ngắt quãng đúng hạn giúp biến từ vựng thành phản xạ dài hạn.'
                  : 'Hôm nay chưa có từ mới đến hạn. Bạn có thể luyện tập tự do bất kỳ lúc nào.'}
              </Text>
            </View>
          </View>

          <View style={styles.srsBannerActions}>
            {dueCount > 0 ? (
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: '#f59e0b' }]}
                onPress={() => startReviewSession('due')}
                activeOpacity={0.8}
              >
                <Ionicons name="flame" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.reviewBtnText}>Bắt đầu ôn tập ({dueCount} từ)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: '#10b981' }]}
                onPress={() => startReviewSession('all')}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.reviewBtnText}>Luyện tập tự do ({words.length} từ)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SEARCH BAR */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.subtext} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.inputText }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER TABS */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              filterTab === 'all' && [styles.tabBtnActive, { backgroundColor: theme.primary }],
              { borderColor: theme.border },
            ]}
            onPress={() => setFilterTab('all')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: filterTab === 'all' ? '#ffffff' : theme.subtext },
              ]}
            >
              Tất cả ({words.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              filterTab === 'due' && [styles.tabBtnActive, { backgroundColor: '#ef4444' }],
              { borderColor: theme.border },
            ]}
            onPress={() => setFilterTab('due')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: filterTab === 'due' ? '#ffffff' : theme.subtext },
              ]}
            >
              Cần ôn ({dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              filterTab === 'learning' && [styles.tabBtnActive, { backgroundColor: theme.primary }],
              { borderColor: theme.border },
            ]}
            onPress={() => setFilterTab('learning')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: filterTab === 'learning' ? '#ffffff' : theme.subtext },
              ]}
            >
              Đang học ({learningCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              filterTab === 'mastered' && [styles.tabBtnActive, { backgroundColor: '#10b981' }],
              { borderColor: theme.border },
            ]}
            onPress={() => setFilterTab('mastered')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: filterTab === 'mastered' ? '#ffffff' : theme.subtext },
              ]}
            >
              Thành thạo ({masteredCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIST OF SAVED WORDS */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 10, color: theme.subtext }}>Đang tải danh sách từ vựng...</Text>
          </View>
        ) : filteredWords.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={54} color={theme.subtext} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có từ vựng nào</Text>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              {searchQuery
                ? 'Không tìm thấy từ vựng nào khớp với từ khóa tìm kiếm.'
                : filterTab === 'due'
                ? 'Bạn không có từ nào đến hạn ôn tập hôm nay.'
                : 'Hãy bấm nút "Lưu từ" trong bài học để đưa từ vào sổ tay học tập!'}
            </Text>
          </View>
        ) : (
          filteredWords.map((item) => {
            const word = item.word || {};
            const wordId = item.wordId || word.id;
            const isDue = item.nextReviewDate && new Date(item.nextReviewDate) <= now;
            const memoryLevel = item.memoryLevel ?? 0;
            const isRemoving = togglingWordId === wordId;

            return (
              <View
                key={item.id || wordId}
                style={[
                  styles.wordCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.wordCardTop}>
                  <TouchableOpacity
                    style={[styles.audioBtn, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}
                    onPress={() => playPronunciation(word.headword)}
                  >
                    <Ionicons name="volume-high" size={20} color={theme.primary} />
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.headword, { color: theme.text }]}>{word.headword}</Text>
                      {word.phonetic ? (
                        <Text style={[styles.phonetic, { color: theme.primary }]}>
                          {word.phonetic.startsWith('/') ? word.phonetic : `/${word.phonetic}/`}
                        </Text>
                      ) : null}
                    </View>

                    {word.partOfSpeech || word.cefrLevel ? (
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                        {word.partOfSpeech ? (
                          <View style={[styles.tagBadge, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
                            <Text style={[styles.tagBadgeText, { color: theme.subtext }]}>{word.partOfSpeech}</Text>
                          </View>
                        ) : null}
                        {word.cefrLevel ? (
                          <View style={[styles.tagBadge, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                            <Text style={[styles.tagBadgeText, { color: theme.primary }]}>{word.cefrLevel}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>

                  {/* Bookmark / Unsave Button */}
                  <TouchableOpacity
                    style={styles.unsaveBtn}
                    onPress={() => handleUnsaveWord(item)}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <ActivityIndicator size="small" color="#f59e0b" />
                    ) : (
                      <Ionicons name="bookmark" size={22} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Meaning & Example */}
                <Text style={[styles.meaning, { color: theme.text }]}>{word.meaning}</Text>
                {word.exampleSentence ? (
                  <Text style={[styles.example, { color: theme.subtext }]}>
                    “{word.exampleSentence}”
                  </Text>
                ) : null}

                {/* SRS Footer info */}
                <View style={[styles.wordCardFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.memoryLevelRow}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={[styles.memoryLevelText, { color: theme.subtext }]}>
                      Cấp {memoryLevel}/6 • {memoryLevel >= 4 ? 'Thành thạo' : `Đang học`}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.dueBadge,
                      {
                        backgroundColor: isDue
                          ? (isDark ? '#450a0a' : '#fee2e2')
                          : (isDark ? '#1e293b' : '#f1f5f9'),
                      },
                    ]}
                  >
                    <Ionicons
                      name={isDue ? 'time' : 'calendar-outline'}
                      size={12}
                      color={isDue ? '#ef4444' : theme.subtext}
                    />
                    <Text
                      style={[
                        styles.dueBadgeText,
                        { color: isDue ? '#ef4444' : theme.subtext },
                      ]}
                    >
                      {isDue
                        ? 'Đến hạn ôn'
                        : item.nextReviewDate
                        ? `Ôn: ${new Date(item.nextReviewDate).toLocaleDateString('vi-VN')}`
                        : 'Chưa có lịch'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL LÀM BÀI ÔN TẬP TỪ VỰNG THEO CHU KỲ (SPACED REPETITION) */}
      <VocabReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        queue={reviewQueue}
        onFinished={() => {
          fetchData();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12, padding: 4 },
  refreshBtn: { padding: 6, marginLeft: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '500' },

  /* SRS Banner */
  srsBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  srsBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  srsBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  srsBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  srsBannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  srsBannerActions: {
    marginTop: 2,
  },
  reviewBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  reviewBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },

  /* Filter Tabs */
  filterTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    borderWidth: 0,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Word Cards */
  wordCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  wordCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  audioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headword: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  phonetic: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  unsaveBtn: {
    padding: 6,
  },
  meaning: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20,
  },
  example: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 18,
  },
  wordCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 4,
  },
  memoryLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memoryLevelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Empty */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Review Modal */
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  modalProgressText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  progressBarBg: { height: 4, width: '100%' },
  progressBarFill: { height: '100%' },

  flashcardWrapper: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  flashcard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardPhonetic: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  cardPos: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  answerSection: {
    padding: 16,
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardExample: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
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
    gap: 12,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 14,
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
    marginTop: 4,
  },
  decisionSubText: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.9,
    marginTop: 2,
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
