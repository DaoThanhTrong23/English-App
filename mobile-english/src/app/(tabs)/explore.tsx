import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../../api/axiosClient';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const router = useRouter();

  const FILTER_OPTIONS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'A1', label: 'Cơ bản (A1)' },
    { id: 'A2', label: 'Sơ cấp (A2)' },
    { id: 'B1_B2', label: 'Trung cấp (B1-B2)' },
    { id: 'VOCAB', label: 'Nhiều từ vựng nhất' }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/student/courses');
      // res.data.data.items handles the new backend structure
      setCourses(res.data?.data?.items || res.data?.data || []);
    } catch (error) {
      console.log('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses
    .filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (selectedFilter === 'A1') return c.cefrLevel === 'A1';
      if (selectedFilter === 'A2') return c.cefrLevel === 'A2';
      if (selectedFilter === 'B1_B2') return c.cefrLevel === 'B1' || c.cefrLevel === 'B2';
      return true;
    })
    .sort((a, b) => {
      if (selectedFilter === 'VOCAB') {
        return (b.totalWords || 0) - (a.totalWords || 0);
      }
      return 0;
    });

  const renderCourse = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.courseCard}
        onPress={() => router.push({ pathname: '/(tabs)/course/[id]', params: { id: item.id } } as any)}
      >
        <Image 
          source={item.imageUrl ? { uri: item.imageUrl } : require('../../../assets/images/gacon.gif')} 
          style={styles.courseImage}
          resizeMode="cover"
        />
        <View style={styles.courseContent}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.cefrLevel || 'A1'}</Text>
          </View>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.courseDesc} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.courseFooter}>
            <View style={styles.statInfo}>
              <Ionicons name="book-outline" size={14} color="#6b7280" style={{marginRight: 4}} />
              <Text style={styles.statText}>{item.totalLessons || 0} bài học</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={() => router.push({ pathname: '/(tabs)/course/[id]', params: { id: item.id } } as any)}>
              <Text style={styles.startBtnText}>Học ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá khóa học</Text>
        <Text style={styles.headerSubtitle}>Tìm kiếm các chủ đề tiếng Anh thú vị phù hợp với bạn</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học, chủ đề..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
          {FILTER_OPTIONS.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <TouchableOpacity 
                key={f.id} 
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.id)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Không tìm thấy khóa học nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, backgroundColor: '#ffffff', paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#6b7280' },
  
  searchContainer: { backgroundColor: '#ffffff', paddingHorizontal: 20, paddingBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 15, height: 45 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },

  filtersContainer: { backgroundColor: '#ffffff', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 10 },
  filterChipActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#3b82f6' },
  filterText: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  filterTextActive: { color: '#2563eb', fontWeight: 'bold' },

  listContainer: { padding: 20, paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  courseCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  courseImage: { width: '100%', height: 140 },
  courseContent: { padding: 15 },
  levelBadge: { position: 'absolute', top: -15, right: 15, backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#ffffff' },
  levelText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 5, marginTop: 5 },
  courseDesc: { fontSize: 13, color: '#6b7280', marginBottom: 15, lineHeight: 20 },
  courseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 15 },
  statInfo: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  startBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  startBtnText: { color: '#2563eb', fontSize: 13, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, fontSize: 15, color: '#9ca3af' }
});
