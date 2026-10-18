import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { axiosClient } from '../../api/axiosClient';
import { useAppTheme } from '../../context/ThemeContext';

export default function CommunityScreen() {
  const { isDark, theme } = useAppTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/student/community/posts');
      if (res.data?.success) setPosts(res.data.data);
    } catch (error) {
      console.log('Error fetching community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (useCamera: boolean = false) => {
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
        setSelectedImage(result.assets[0].uri);
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
        setContent('');
        setSelectedImage(null);
        fetchData();
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng bài viết");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: number, idx: number) => {
    try {
      const res = await axiosClient.post(`/student/community/posts/${postId}/like`);
      if (res.data?.success) {
        const newPosts = [...posts];
        const hasLiked = res.data.data.hasLiked;
        newPosts[idx].hasLiked = hasLiked;
        newPosts[idx].likesCount += hasLiked ? 1 : -1;
        setPosts(newPosts);
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
      if (res.data?.success) setComments(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !currentPostId) return;
    try {
      const res = await axiosClient.post(`/student/community/posts/${currentPostId}/comments`, { content: commentText });
      if (res.data?.success) {
        setComments([...comments, res.data.data]);
        setCommentText('');
        // Update local post comment count
        const newPosts = [...posts];
        const pIdx = newPosts.findIndex(p => p.id === currentPostId);
        if (pIdx > -1) newPosts[pIdx].commentsCount += 1;
        setPosts(newPosts);
      }
    } catch (error) {
      console.log(error);
    }
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
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cộng đồng</Text>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} onPress={fetchData}>
          <Ionicons name="refresh" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.mediaBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} 
                onPress={() => pickImage(false)}
              >
                <Ionicons name="image-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.mediaBtn, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]} 
                onPress={() => pickImage(true)}
              >
                <Ionicons name="camera-outline" size={20} color={theme.primary} />
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

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 20}} />
        ) : posts.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.subtext} />
            <Text style={{ marginTop: 10, color: theme.subtext, fontSize: 14 }}>Chưa có bài viết nào. Hãy chia sẻ bài viết đầu tiên!</Text>
          </View>
        ) : (
          posts.map((post, idx) => (
            <View key={post.id} style={[styles.mockPost, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.postHeader}>
                <Image source={post.user.avatarUrl ? {uri: post.user.avatarUrl.startsWith('http') ? post.user.avatarUrl : baseURL + post.user.avatarUrl} : require('../../../assets/images/gacon.gif')} style={[styles.postAvatar, { backgroundColor: theme.cardSecondary }]} />
                <View>
                  <Text style={[styles.postName, { color: theme.text }]}>{post.user.username}</Text>
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
                <TouchableOpacity style={styles.actionItem} onPress={() => toggleLike(post.id, idx)}>
                  <Ionicons name={post.hasLiked ? "heart" : "heart-outline"} size={20} color={post.hasLiked ? "#ef4444" : theme.subtext} />
                  <Text style={[styles.actionText, { color: theme.subtext }]}>{post.likesCount || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => openComments(post.id)}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.subtext} />
                  <Text style={[styles.actionText, { color: theme.subtext }]}>{post.commentsCount || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Bình luận</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{flex: 1, padding: 15}}>
              {loadingComments ? <ActivityIndicator color={theme.primary} /> : comments.map(c => (
                <View key={c.id} style={styles.commentRow}>
                  <Image source={c.user.avatarUrl ? {uri: c.user.avatarUrl.startsWith('http') ? c.user.avatarUrl : baseURL + c.user.avatarUrl} : require('../../../assets/images/gacon.gif')} style={[styles.commentAvatar, { backgroundColor: theme.cardSecondary }]} />
                  <View style={[styles.commentBubble, { backgroundColor: isDark ? theme.cardSecondary : '#f3f4f6' }]}>
                    <Text style={[styles.commentName, { color: theme.text }]}>{c.user.username}</Text>
                    <Text style={[styles.commentText, { color: isDark ? '#d4d4d8' : '#374151' }]}>{c.content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.commentInputRow, { borderColor: theme.border }]}>
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
              />
              <TouchableOpacity onPress={postComment}><Ionicons name="send" size={24} color={theme.primary} /></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  iconBtn: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  createPostCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 25 },
  postInput: { fontSize: 15, color: '#111827', minHeight: 60, textAlignVertical: 'top' },
  createPostFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  imagePreviewContainer: { position: 'relative', marginTop: 10, marginBottom: 5, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#ffffff', borderRadius: 12 },
  mediaBtn: { padding: 8, borderRadius: 20 },
  postBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  mockPost: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 15 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 12 },
  postName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  postTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  postText: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 15 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 15 },
  actionItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { fontSize: 13, color: '#6b7280', marginLeft: 6 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  commentRow: { flexDirection: 'row', marginBottom: 15 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBubble: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 12, flex: 1 },
  commentName: { fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  commentText: { fontSize: 14, color: '#374151' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderColor: '#e5e7eb' },
  commentInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 }
});
