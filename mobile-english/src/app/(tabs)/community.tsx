import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../../api/axiosClient';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      setPosting(true);
      const res = await axiosClient.post('/student/community/posts', { content });
      if (res.data?.success) {
        setContent('');
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
    return `${d.getHours()}:${d.getMinutes()} ${d.getDate()}/${d.getMonth()+1}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cộng đồng</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={fetchData}>
          <Ionicons name="refresh" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.createPostCard}>
          <TextInput 
            style={styles.postInput} placeholder="Chia sẻ suy nghĩ của bạn..." placeholderTextColor="#9ca3af" multiline
            value={content} onChangeText={setContent}
          />
          <View style={styles.createPostFooter}>
            <TouchableOpacity style={[styles.postBtn, !content.trim() && {opacity: 0.5}]} onPress={handlePost} disabled={!content.trim() || posting}>
              {posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Đăng bài</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 20}} />
        ) : (
          posts.map((post, idx) => (
            <View key={post.id} style={styles.mockPost}>
              <View style={styles.postHeader}>
                <Image source={post.user.avatarUrl ? {uri: post.user.avatarUrl} : require('../../../assets/images/gacon.gif')} style={styles.postAvatar} />
                <View>
                  <Text style={styles.postName}>{post.user.username}</Text>
                  <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.postText}>{post.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionItem} onPress={() => toggleLike(post.id, idx)}>
                  <Ionicons name={post.hasLiked ? "heart" : "heart-outline"} size={20} color={post.hasLiked ? "#ef4444" : "#6b7280"} />
                  <Text style={styles.actionText}>{post.likesCount || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => openComments(post.id)}>
                  <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
                  <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bình luận</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{flex: 1, padding: 15}}>
              {loadingComments ? <ActivityIndicator /> : comments.map(c => (
                <View key={c.id} style={styles.commentRow}>
                  <Image source={c.user.avatarUrl ? {uri: c.user.avatarUrl} : require('../../../assets/images/gacon.gif')} style={styles.commentAvatar} />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentName}>{c.user.username}</Text>
                    <Text style={styles.commentText}>{c.content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput style={styles.commentInput} placeholder="Viết bình luận..." value={commentText} onChangeText={setCommentText} />
              <TouchableOpacity onPress={postComment}><Ionicons name="send" size={24} color="#3b82f6" /></TouchableOpacity>
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
  createPostFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  postBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  mockPost: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 15 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 12 },
  postName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  postTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  postText: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 15 },
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
