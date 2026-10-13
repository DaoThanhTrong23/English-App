import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // History state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadRecentSession();
  }, []);

  const loadRecentSession = async () => {
    try {
      const res = await axiosClient.get('/ai/chat/sessions');
      if (res.data?.success && res.data.data.length > 0) {
        const latestSession = res.data.data[0];
        setSessions(res.data.data);
        await loadSessionMessages(latestSession.id);
      } else {
        setMessages([{ id: '0', text: 'Xin chào! Mình là Gà đây. Mình có thể giúp gì cho bạn hôm nay?', isUser: false }]);
      }
    } catch (error) {
      console.log('Error fetching sessions:', error);
      setMessages([{ id: '0', text: 'Xin chào! Mình là Gà đây. Mình có thể giúp gì cho bạn hôm nay?', isUser: false }]);
    }
  };

  const fetchSessionsList = async () => {
    try {
      setLoadingHistory(true);
      const res = await axiosClient.get('/ai/chat/sessions');
      if (res.data?.success) setSessions(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSessionMessages = async (id: number) => {
    try {
      setLoading(true);
      setSessionId(id);
      setHistoryModalVisible(false);
      const res = await axiosClient.get(`/ai/chat/sessions/${id}`);
      if (res.data?.success) {
        const msgs = res.data.data.map((m: any) => ({
          id: m.id.toString(),
          text: m.messageText,
          isUser: m.sender === 'user'
        }));
        setMessages(msgs);
      }
    } catch (error) {
      console.log('Error loading messages', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([{ id: '0', text: 'Xin chào! Mình là Gà đây. Mình có thể giúp gì cho bạn hôm nay?', isUser: false }]);
    setHistoryModalVisible(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/ai/chat', {
        message: userMsg.text,
        sessionId: sessionId
      });

      const data = response.data.data;
      if (data.sessionId) setSessionId(data.sessionId);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: data.response, isUser: false };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.log('AI Chat Error:', error);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: 'Xin lỗi, tôi đang bận hoặc hệ thống bị lỗi. Vui lòng thử lại sau!', isUser: false };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageWrapper, item.isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          {/* Icon cũ: <Ionicons name="sparkles" size={16} color="#ffffff" /> */}
          <Image 
            source={require('../../assets/images/gacon.gif')} 
            style={styles.botAvatarImage} 
          />
        </View>
      )}
      <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, item.isUser ? styles.userText : styles.botText]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image 
            source={require('../../assets/images/gacon.gif')} 
            style={styles.headerAvatar} 
          />
          <View>
            <Text style={styles.headerTitle}>Gia sư Gà Con AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={styles.onlineIndicator} />
              <Text style={{ fontSize: 11, color: '#10b981', marginLeft: 4, fontWeight: '500' }}>Đang hoạt động</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => { fetchSessionsList(); setHistoryModalVisible(true); }}>
          <Ionicons name="time-outline" size={26} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.loadingText}>Gà đang gõ...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi Gà bất cứ điều gì..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !input.trim() && {backgroundColor: '#e5e7eb'}]} 
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color={input.trim() ? "#ffffff" : "#9ca3af"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal visible={historyModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lịch sử trò chuyện</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
              <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
              <Text style={styles.newChatText}>Cuộc trò chuyện mới</Text>
            </TouchableOpacity>
            <ScrollView style={{flex: 1, padding: 15}}>
              {loadingHistory ? <ActivityIndicator color="#3b82f6"/> : sessions.map(s => (
                <TouchableOpacity key={s.id} style={styles.sessionItem} onPress={() => loadSessionMessages(s.id)}>
                  <Ionicons name="chatbubbles-outline" size={24} color="#6b7280" />
                  <View style={{marginLeft: 15, flex: 1}}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.sessionTime}>{new Date(s.startedAt).toLocaleDateString()}</Text>
                  </View>
                  {sessionId === s.id && <Ionicons name="checkmark" size={20} color="#10b981" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 5 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  onlineIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  keyboardView: { flex: 1 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  botAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  botAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  messageBubble: { maxWidth: '75%', padding: 14, borderRadius: 20 },
  userBubble: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#ffffff' },
  botText: { color: '#111827' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  loadingText: { marginLeft: 8, fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 15, color: '#111827' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', margin: 15, padding: 12, borderRadius: 12 },
  newChatText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  sessionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  sessionTitle: { fontSize: 15, fontWeight: '500', color: '#111827', marginBottom: 4 },
  sessionTime: { fontSize: 12, color: '#6b7280' }
});
