const fs = require('fs');

// Fix ai-chat.tsx imports
const aiChatPath = 'mobile-english/src/app/ai-chat.tsx';
let aiChat = fs.readFileSync(aiChatPath, 'utf8');
aiChat = aiChat.replace(/from '\.\/api\/axiosClient'/, "from '../api/axiosClient'");
aiChat = aiChat.replace(/import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';/, "import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, ScrollView } from 'react-native';");
fs.writeFileSync(aiChatPath, aiChat);

// Fix achievements.tsx, history.tsx, saved-words.tsx
const paths = ['mobile-english/src/app/achievements.tsx', 'mobile-english/src/app/history.tsx', 'mobile-english/src/app/saved-words.tsx'];
for (const p of paths) {
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf8');
    code = code.replace(/from '\.\/api\/axiosClient'/g, "from '../api/axiosClient'");
    fs.writeFileSync(p, code);
  }
}
