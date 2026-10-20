import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../../api/axiosClient';
import { useAppTheme } from '../../context/ThemeContext';

export default function CommunityScreen() {
  const { isDark, theme } = useAppTheme();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPublicPost, setIsPublicPost] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'my' | 'private'>('all');

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const PAGE_SIZE = 10;

  // Comment Modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const commentScrollViewRef = useRef<ScrollView>(null);

  // Edit Post Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const infoStr = await SecureStore.getItemAsync('userInfo');
        if (infoStr) {
          const u = JSON.parse(infoStr);
          setCurrentUserId(u.id);
        }
      } catch (e) {
        console.log('Error reading userInfo:', e);
      }
    };
    loadUserInfo();
    fetchPosts('all', 1);
  }, []);

  const fetchPosts = async (tab: 'all' | 'my' | 'private', pageNum: number, isRefresh: boolean = false) => {
    if (isFetchingRef.current) return;
    if (!isRefresh && pageNum > 1 && !hasMore) return;

    isFetchingRef.current = true;
    try {
      if (pageNum === 1) {
        if (!isRefresh) setLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      const res = await axiosClient.get('/student/community/posts', {
        params: { 
          filter: tab,
          page: pageNum,
          limit: PAGE_SIZE
        }
      });

      if (res.data?.success) {
        const newPosts = res.data.data || [];
        const pagination = res.data.pagination;

        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p.id));
            return [...prev, ...uniqueNewPosts];
          });
        }

        setPage(pageNum);
        if (pagination) {
          setHasMore(pagination.hasMore);
        } else {
          setHasMore(newPosts.length >= PAGE_SIZE);
        }
      }
    } catch (error) {
      console.log('Error fetching community posts:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'my' | 'private') => {
    if (tab === filterTab && !loading) return;
    setFilterTab(tab);
    setPage(1);
    setHasMore(true);
    fetchPosts(tab, 1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchPosts(filterTab, 1, true);
  };

  const handleLoadMore = () => {
    if (loading || isFetchingMore || refreshing || !hasMore || isFetchingRef.current) return;
    fetchPosts(filterTab, page + 1);
  };

  const pickImage = async (useCamera: boolean = false, isEdit: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền camera để chụp ảnh!');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền thư viện để chọn ảnh!');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (isEdit) {
          setEditImageUri(uri);
          setEditRemoveImage(false);
        } else {
          setSelectedImage(uri);
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) return;
    try {
      setPosting(true);
      const formData = new FormData();
      if (content.trim()) {
        formData.append('content', content.trim());
      }
      formData.append('isPublic', isPublicPost ? 'true' : 'false');

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'post.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('image', { uri: selectedImage, name: filename, type });
      }

      const res = await axiosClient.post('/student/community/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const newPost = res.data.data;
        setContent('');
        setSelectedImage(null);
        setIsPublicPost(true);
        if (newPost) {
          if (filterTab === 'all' || filterTab === 'my' || (filterTab === 'private' && !newPost.isPublic)) {
            setPosts(prev => [newPost, ...prev]);
          }
        }
        Alert.alert('Thành công', 'Đã đăng bài viết!');
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng bài viết");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const res = await axiosClient.post(`/student/community/posts/${postId}/like`);
      if (res.data?.success) {
        const hasLiked = res.data.data.hasLiked;
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked,
              likesCount: Math.max(0, (p.likesCount || 0) + (hasLiked ? 1 : -1))
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openComments = async (postId: number) => {
    setCurrentPostId(postId);
    setCommentModalVisible(true);
    setLoadingComments(true);
    try {
      const res = await axiosClient.get(`/student/community/posts/${postId}/comments`);
      if (res.data?.success) {
        setComments(res.data.data || []);
        setTimeout(() => {
          commentScrollViewRef.current?.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !currentPostId) return;
    try {
      const res = await axiosClient.post(`/student/community/posts/${currentPostId}/comments`, { content: commentText.trim() });
      if (res.data?.success) {
        setComments(prev => [...prev, res.data.data]);
        setCommentText('');
        // Update local post comment count
        setPosts(prev => {
          const next = [...prev];
          const pIdx = next.findIndex(p => p.id === currentPostId);
          if (pIdx > -1) next[pIdx].commentsCount = (next[pIdx].commentsCount || 0) + 1;
          return next;
        });
        setTimeout(() => {
          commentScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // --- Chức năng Chỉnh sửa bài viết & Trạng thái ---
  const openEditModal = (post: any) => {
    setEditingPost(post);
    setEditContent(post.content || '');
    setEditIsPublic(post.isPublic !== false);
    setEditImageUri(post.imageUrl ? (post.imageUrl.startsWith('http') ? post.imageUrl : baseURL + post.imageUrl) : null);
    setEditRemoveImage(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    if (!editContent.trim() && !editImageUri && editRemoveImage) {
      Alert.alert('Lỗi', 'Bài viết phải có nội dung văn bản hoặc hình ảnh');
      return;
    }

    try {
      setSavingEdit(true);
      const formData = new FormData();
      formData.append('content', editContent.trim());
      formData.append('isPublic', editIsPublic ? 'true' : 'false');

      // Nếu người dùng chọn ảnh mới từ thiết bị
      if (editImageUri && !editImageUri.startsWith('http')) {
        const filename = editImageUri.split('/').pop() || 'post.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        formData.append('image', { uri: editImageUri, name: filename, type });
      } else if (editRemoveImage) {
        formData.append('removeImage', 'true');
      }

      const res = await axiosClient.put(`/student/community/posts/${editingPost.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã cập nhật bài viết!');
        setEditModalVisible(false);
        const updated = res.data.data;
        if (updated) {
          setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...updated } : p));
        }
        setEditingPost(null);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật bài viết lúc này');
    } finally {
      setSavingEdit(false);
    }
  };

  // Chuyển nhanh trạng thái Công khai / Riêng tư khi chạm vào badge
  const handleQuickTogglePrivacy = (post: any) => {
    const isOwner = currentUserId !== null && post.userId === currentUserId;
    if (!isOwner) return;

    const nextStatus = !post.isPublic;
    Alert.alert(
      'Thay đổi trạng thái',
      `Bạn có muốn chuyển bài viết sang chế độ ${nextStatus ? 'Công khai (Mọi người đều xem được)' : 'Riêng tư (Chỉ mình tôi)'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              const res = await axiosClient.patch(`/student/community/posts/${post.id}/privacy`, {
                isPublic: nextStatus
              });
              if (res.data?.success) {
                // Cập nhật trạng thái tức thì trên UI
                setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPublic: nextStatus } : p));
                if (filterTab === 'private' && nextStatus === true) {
                  setPosts(prev => prev.filter(p => p.id !== post.id));
                }
              }
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đổi trạng thái bài viết');
            }
          }
        }
      ]
    );
  };

  // Xóa bài viết
  const handleDeletePost = (postId: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa bài',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingPost(true);
              const res = await axiosClient.delete(`/student/community/posts/${postId}`);
              if (res.data?.success) {
                setPosts(prev => prev.filter(p => p.id !== postId));
                if (editModalVisible) setEditModalVisible(false);
                Alert.alert('Thành công', 'Đã xóa bài viết.');
              }
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa bài viết lúc này');
            } finally {
              setDeletingPost(false);
            }
          }
        }
      ]
    );
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cộng đồng</Text>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} 
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      <View style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.filterTabItem,
            filterTab === 'all' && [styles.filterTabItemActive, { borderBottomColor: theme.primary }]
          ]}
          onPress={() => handleTabChange('all')}
        >
          <Ionicons name="globe-outline" size={16} color={filterTab === 'all' ? theme.primary : theme.subtext} />
          <Text style={[styles.filterTabText, { color: filterTab === 'all' ? theme.primary : theme.subtext, fontWeight: filterTab === 'all' ? 'bold' : 'normal' }]}>
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTabItem,
            filterTab === 'my' && [styles.filterTabItemActive, { borderBottomColor: theme.primary }]
          ]}
          onPress={() => handleTabChange('my')}
        >
          <Ionicons name="person-outline" size={16} color={filterTab === 'my' ? theme.primary : theme.subtext} />
          <Text style={[styles.filterTabText, { color: filterTab === 'my' ? theme.primary : theme.subtext, fontWeight: filterTab === 'my' ? 'bold' : 'normal' }]}>
            Của tôi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTabItem,
            filterTab === 'private' && [styles.filterTabItemActive, { borderBottomColor: theme.primary }]
          ]}
          onPress={() => handleTabChange('private')}
        >
          <Ionicons name="lock-closed-outline" size={16} color={filterTab === 'private' ? theme.primary : theme.subtext} />
          <Text style={[styles.filterTabText, { color: filterTab === 'private' ? theme.primary : theme.subtext, fontWeight: filterTab === 'private' ? 'bold' : 'normal' }]}>
            Riêng tư
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: post }) => {
          const isOwner = currentUserId !== null && post.userId === currentUserId;

          return (
            <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.postHeader}>
                <Image 
                  source={post.user?.avatarUrl ? {uri: post.user.avatarUrl.startsWith('http') ? post.user.avatarUrl : baseURL + post.user.avatarUrl} : require('../../../assets/images/gacon.gif')} 
                  style={[styles.postAvatar, { backgroundColor: theme.cardSecondary }]} 
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.postName, { color: theme.text }]}>{post.user?.username || 'Người dùng'}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {/* Badge trạng thái Công khai / Riêng tư (Nhấn vào để đổi nhanh nếu là bài viết của mình) */}
                      <TouchableOpacity 
                        style={[
                          styles.postPrivacyBadge,
                          {
                            backgroundColor: post.isPublic === false
                              ? (isDark ? '#27272a' : '#f3f4f6')
                              : (isDark ? '#064e3b' : '#ecfdf5'),
                            borderColor: post.isPublic === false
                              ? (isDark ? '#3f3f46' : '#e5e7eb')
                              : (isDark ? '#047857' : '#a7f3d0')
                          }
                        ]} 
                        onPress={() => isOwner && handleQuickTogglePrivacy(post)}
                        disabled={!isOwner}
                      >
                        <Ionicons 
                          name={post.isPublic === false ? "lock-closed" : "globe-outline"} 
                          size={11} 
                          color={post.isPublic === false ? (isDark ? '#a1a1aa' : '#6b7280') : (isDark ? '#34d399' : '#059669')} 
                        />
                        <Text style={[
                          styles.postPrivacyText,
                          { color: post.isPublic === false ? (isDark ? '#a1a1aa' : '#6b7280') : (isDark ? '#34d399' : '#059669') }
                        ]}>
                          {post.isPublic === false ? "Riêng tư" : "Công khai"}
                        </Text>
                        {isOwner && (
                          <Ionicons name="swap-horizontal" size={11} color={post.isPublic === false ? (isDark ? '#a1a1aa' : '#6b7280') : (isDark ? '#34d399' : '#059669')} style={{marginLeft: 2}} />
                        )}
                      </TouchableOpacity>

                      {/* Nút Chỉnh sửa dành riêng cho chủ bài viết (đặc biệt tại trang Của tôi) */}
                      {isOwner && (
                        <TouchableOpacity 
                          style={[styles.editActionBtn, { backgroundColor: isDark ? '#27272a' : '#eff6ff', borderColor: isDark ? '#3f3f46' : '#bfdbfe' }]} 
                          onPress={() => openEditModal(post)}
                        >
                          <Ionicons name="create-outline" size={13} color={isDark ? '#60a5fa' : '#2563eb'} />
                          <Text style={[styles.editActionText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>Sửa</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.postTime, { color: theme.subtext }]}>{formatTime(post.createdAt)}</Text>
                </View>
              </View>

              {post.content ? <Text style={[styles.postText, { color: theme.text }]}>{post.content}</Text> : null}
              
              {post.imageUrl && (
                <Image 
                  source={{ uri: post.imageUrl.startsWith('http') ? post.imageUrl : baseURL + post.imageUrl }} 
                  style={styles.postImage} 
                  resizeMode="cover"
                />
              )}

              <View style={[styles.postActions, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.actionItem} onPress={() => toggleLike(post.id)}>
                  <Ionicons name={post.hasLiked ? "heart" : "heart-outline"} size={20} color={post.hasLiked ? "#ef4444" : theme.subtext} />
                  <Text style={[styles.actionText, { color: theme.subtext }]}>{post.likesCount || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => openComments(post.id)}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.subtext} />
                  <Text style={[styles.actionText, { color: theme.subtext }]}>{post.commentsCount || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListHeaderComponent={(
          <View>
            {/* CREATE POST CARD */}
            <View style={[styles.createPostCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.postInput, { color: theme.inputText }]} 
                placeholder="Chia sẻ suy nghĩ hoặc câu hỏi học tập của bạn..." 
                placeholderTextColor={theme.subtext} 
                multiline
                value={content} 
                onChangeText={setContent}
              />

              {/* Preview ảnh đính kèm nếu có */}
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.createPostFooter, { borderTopColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity 
                    style={[styles.mediaBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} 
                    onPress={() => pickImage(false, false)}
                  >
                    <Ionicons name="image-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.mediaBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} 
                    onPress={() => pickImage(true, false)}
                  >
                    <Ionicons name="camera-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>

                  {/* Nút chuyển đổi chế độ Công khai / Riêng tư khi tạo bài */}
                  <TouchableOpacity
                    style={[
                      styles.privacyToggle,
                      {
                        backgroundColor: isPublicPost
                          ? (isDark ? '#064e3b' : '#ecfdf5')
                          : (isDark ? '#27272a' : '#f3f4f6'),
                        borderColor: isPublicPost
                          ? (isDark ? '#059669' : '#a7f3d0')
                          : (isDark ? '#52525b' : '#d1d5db'),
                      }
                    ]}
                    onPress={() => setIsPublicPost(!isPublicPost)}
                  >
                    <Ionicons
                      name={isPublicPost ? "globe-outline" : "lock-closed"}
                      size={14}
                      color={isPublicPost ? (isDark ? '#34d399' : '#059669') : (isDark ? '#a1a1aa' : '#4b5563')}
                    />
                    <Text
                      style={[
                        styles.privacyToggleText,
                        {
                          color: isPublicPost
                            ? (isDark ? '#34d399' : '#059669')
                            : (isDark ? '#d4d4d8' : '#374151')
                        }
                      ]}
                    >
                      {isPublicPost ? "Công khai" : "Riêng tư"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.postBtn, (!content.trim() && !selectedImage) && {opacity: 0.5}]} 
                  onPress={handlePost} 
                  disabled={(!content.trim() && !selectedImage) || posting}
                >
                  {posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Đăng bài</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {loading && posts.length === 0 && (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 30, paddingHorizontal: 20 }}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.subtext} />
              <Text style={{ marginTop: 10, color: theme.subtext, fontSize: 14, textAlign: 'center' }}>
                {filterTab === 'private' 
                  ? 'Bạn chưa có bài viết riêng tư nào.' 
                  : filterTab === 'my' 
                  ? 'Bạn chưa đăng bài viết nào.' 
                  : 'Chưa có bài viết nào. Hãy chia sẻ bài viết đầu tiên!'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.footerLoaderText, { color: theme.subtext }]}>Đang tải thêm bài viết...</Text>
            </View>
          ) : !hasMore && posts.length > 0 ? (
            <View style={styles.endOfListContainer}>
              <View style={[styles.endOfListDivider, { backgroundColor: theme.border }]} />
              <Text style={[styles.endOfListText, { color: theme.subtext }]}>Đã hiển thị tất cả bài viết</Text>
              <View style={[styles.endOfListDivider, { backgroundColor: theme.border }]} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={[theme.primary]} 
            tintColor={theme.primary} 
          />
        }
      />

      {/* Modal Chỉnh Sửa Bài Viết & Trạng Thái */}
      <Modal 
        visible={editModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.card, height: '85%' }]}>
              <View style={[styles.modalHeader, { borderColor: theme.border }]}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Ionicons name="create-outline" size={22} color={theme.primary} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Chỉnh sửa bài viết</Text>
                </View>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Nội dung bài viết */}
              <Text style={[styles.labelTitle, { color: theme.text }]}>Nội dung bài viết</Text>
              <TextInput 
                style={[
                  styles.editInput, 
                  { 
                    backgroundColor: theme.inputBg, 
                    color: theme.inputText,
                    borderColor: theme.border,
                    borderWidth: 1
                  }
                ]} 
                placeholder="Nhập nội dung chia sẻ..." 
                placeholderTextColor={theme.subtext}
                multiline
                value={editContent} 
                onChangeText={setEditContent} 
              />

              {/* Tùy chỉnh trạng thái Công khai / Riêng tư */}
              <Text style={[styles.labelTitle, { color: theme.text, marginTop: 15 }]}>Trạng thái hiển thị</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.statusOptionCard,
                    {
                      backgroundColor: editIsPublic
                        ? (isDark ? '#064e3b' : '#ecfdf5')
                        : (isDark ? theme.cardSecondary : '#f9fafb'),
                      borderColor: editIsPublic
                        ? (isDark ? '#059669' : '#10b981')
                        : theme.border,
                      borderWidth: editIsPublic ? 2 : 1
                    }
                  ]}
                  onPress={() => setEditIsPublic(true)}
                >
                  <Ionicons name="globe-outline" size={20} color={editIsPublic ? '#10b981' : theme.subtext} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.statusOptionTitle, { color: editIsPublic ? (isDark ? '#34d399' : '#047857') : theme.text }]}>
                      Công khai
                    </Text>
                    <Text style={[styles.statusOptionSub, { color: theme.subtext }]}>
                      Mọi người đều có thể xem bài
                    </Text>
                  </View>
                  {editIsPublic && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusOptionCard,
                    {
                      backgroundColor: !editIsPublic
                        ? (isDark ? '#27272a' : '#f3f4f6')
                        : (isDark ? theme.cardSecondary : '#f9fafb'),
                      borderColor: !editIsPublic
                        ? (isDark ? '#71717a' : '#6b7280')
                        : theme.border,
                      borderWidth: !editIsPublic ? 2 : 1
                    }
                  ]}
                  onPress={() => setEditIsPublic(false)}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={!editIsPublic ? (isDark ? '#a1a1aa' : '#4b5563') : theme.subtext} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.statusOptionTitle, { color: !editIsPublic ? (isDark ? '#f4f4f5' : '#1f2937') : theme.text }]}>
                      Riêng tư
                    </Text>
                    <Text style={[styles.statusOptionSub, { color: theme.subtext }]}>
                      Chỉ mình bạn xem được
                    </Text>
                  </View>
                  {!editIsPublic && <Ionicons name="checkmark-circle" size={18} color={isDark ? '#a1a1aa' : '#4b5563'} />}
                </TouchableOpacity>
              </View>

              {/* Ảnh đính kèm */}
              <Text style={[styles.labelTitle, { color: theme.text, marginTop: 15 }]}>Hình ảnh đính kèm</Text>
              {editImageUri && !editRemoveImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: editImageUri }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity 
                    style={styles.removeImageBtn} 
                    onPress={() => {
                      setEditImageUri(null);
                      setEditRemoveImage(true);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity 
                    style={[styles.mediaOptionBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6', borderColor: theme.border }]} 
                    onPress={() => pickImage(false, true)}
                  >
                    <Ionicons name="image-outline" size={18} color={theme.primary} />
                    <Text style={[styles.mediaOptionText, { color: theme.text }]}>Chọn từ thư viện</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.mediaOptionBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6', borderColor: theme.border }]} 
                    onPress={() => pickImage(true, true)}
                  >
                    <Ionicons name="camera-outline" size={18} color={theme.primary} />
                    <Text style={[styles.mediaOptionText, { color: theme.text }]}>Chụp ảnh mới</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Nút Xóa bài viết */}
              {editingPost && (
                <TouchableOpacity 
                  style={[styles.deletePostActionRow, { borderColor: isDark ? '#7f1d1d' : '#fee2e2', backgroundColor: isDark ? '#450a0a' : '#fef2f2' }]} 
                  onPress={() => handleDeletePost(editingPost.id)}
                  disabled={deletingPost}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={styles.deletePostActionText}>Xóa bài viết vĩnh viễn</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.editFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} 
                onPress={() => setEditModalVisible(false)}
                disabled={savingEdit}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comment Modal */}
      <Modal 
        visible={commentModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setCommentModalVisible(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.card, height: '75%' }]}>
              <View style={[styles.modalHeader, { borderColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Bình luận</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                ref={commentScrollViewRef} 
                style={{ flex: 1, padding: 15 }} 
                keyboardShouldPersistTaps="handled" 
                showsVerticalScrollIndicator={false}
              >
                {loadingComments ? (
                  <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                ) : comments.length === 0 ? (
                  <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <Ionicons name="chatbubbles-outline" size={40} color={theme.subtext} />
                    <Text style={{ color: theme.subtext, marginTop: 8, fontSize: 13 }}>Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</Text>
                  </View>
                ) : comments.map(c => (
                  <View key={c.id} style={styles.commentRow}>
                    <Image source={c.user?.avatarUrl ? {uri: c.user.avatarUrl.startsWith('http') ? c.user.avatarUrl : baseURL + c.user.avatarUrl} : require('../../../assets/images/gacon.gif')} style={[styles.commentAvatar, { backgroundColor: theme.cardSecondary }]} />
                    <View style={[styles.commentBubble, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]}>
                      <Text style={[styles.commentName, { color: theme.text }]}>{c.user?.username || 'Người dùng'}</Text>
                      <Text style={[styles.commentText, { color: isDark ? '#d4d4d8' : '#374151' }]}>{c.content}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={[styles.commentInputRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <TextInput 
                  style={[
                    styles.commentInput, 
                    { 
                      backgroundColor: theme.inputBg, 
                      color: theme.inputText,
                      borderColor: theme.border,
                      borderWidth: isDark ? 1 : 0
                    }
                  ]} 
                  placeholder="Viết bình luận..." 
                  placeholderTextColor={theme.subtext}
                  value={commentText} 
                  onChangeText={setCommentText} 
                  returnKeyType="send"
                  onSubmitEditing={postComment}
                />
                <TouchableOpacity 
                  style={styles.sendCommentBtn}
                  onPress={postComment}
                  disabled={!commentText.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={22} 
                    color={commentText.trim() ? theme.primary : theme.subtext} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  iconBtn: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  
  filterBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 15 },
  filterTabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabItemActive: { borderBottomWidth: 2 },
  filterTabText: { fontSize: 14 },

  scrollContent: { padding: 20, paddingBottom: 80 },
  createPostCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
  postInput: { fontSize: 15, color: '#111827', minHeight: 60, textAlignVertical: 'top' },
  createPostFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  imagePreviewContainer: { position: 'relative', marginTop: 10, marginBottom: 5, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#ffffff', borderRadius: 12 },
  mediaBtn: { padding: 8, borderRadius: 20 },
  privacyToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, gap: 5 },
  privacyToggleText: { fontSize: 12, fontWeight: '600' },
  postBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },

  postCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 15 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 12 },
  postName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  postTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  postPrivacyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, gap: 4 },
  postPrivacyText: { fontSize: 11, fontWeight: '600' },
  editActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, gap: 3 },
  editActionText: { fontSize: 11, fontWeight: '600' },

  postText: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 15 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 15 },
  actionItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { fontSize: 13, color: '#6b7280', marginLeft: 6 },
  
  keyboardAvoidingView: { flex: 1 },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '75%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  labelTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  editInput: { borderRadius: 12, padding: 12, fontSize: 15, minHeight: 90, textAlignVertical: 'top' },

  statusOptionCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  statusOptionTitle: { fontSize: 13, fontWeight: 'bold' },
  statusOptionSub: { fontSize: 10, marginTop: 2 },

  mediaOptionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  mediaOptionText: { fontSize: 12, fontWeight: '600' },

  deletePostActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 20, gap: 6 },
  deletePostActionText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },

  editFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  commentRow: { flexDirection: 'row', marginBottom: 15 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBubble: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 12, flex: 1 },
  commentName: { fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  commentText: { fontSize: 14, color: '#374151' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderColor: '#e5e7eb' },
  commentInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendCommentBtn: { padding: 6, justifyContent: 'center', alignItems: 'center' },

  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 8 },
  footerLoaderText: { fontSize: 13, fontWeight: '500' },
  endOfListContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 22, paddingHorizontal: 20, gap: 10 },
  endOfListDivider: { flex: 1, height: 1 },
  endOfListText: { fontSize: 12, fontWeight: '500' }
});
