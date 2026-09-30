import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { axiosClient } from '../../src/api/axiosClient';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'Xin chào! Mình là Gà đây. Mình có thể giúp gì cho bạn hôm nay?', isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

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

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.isUser;
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAi]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAi]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAi]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gà</Text>
          <Text style={styles.headerSubtitle}>Gia sư Tiếng Anh của bạn</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.typingText}>AI đang suy nghĩ...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi AI bất cứ điều gì..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !input.trim() ? {backgroundColor: '#d1d5db'} : {}]} 
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  backBtn: { padding: 5 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#8b5cf6', fontWeight: '500' },
  chatContainer: { flex: 1 },
  messageList: { padding: 15, paddingBottom: 20 },
  
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperAi: { justifyContent: 'flex-start' },
  
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 4
  },

  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  messageBubbleUser: { 
    backgroundColor: '#2563eb', 
    borderBottomRightRadius: 4 
  },
  messageBubbleAi: { 
    backgroundColor: '#ffffff', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextUser: { color: '#ffffff' },
  messageTextAi: { color: '#111827' },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', marginLeft: 50, marginBottom: 15 },
  typingText: { fontSize: 12, color: '#6b7280', marginLeft: 8 },

  inputArea: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827'
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 10
  }
});
