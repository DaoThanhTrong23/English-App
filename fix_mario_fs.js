const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

if (!code.includes('expo-file-system')) {
  code = code.replace(/import \{ Audio \} from 'expo-av';/, ''); // cleanup if any left
  code = code.replace(/import \{ useRouter \} from 'expo-router';/, "import { useRouter } from 'expo-router';\nimport * as FileSystem from 'expo-file-system';");
}

code = code.replace(
  /const uri = recorder\.uri;\s*if \(\!uri\) return;/,
  `const uri = recorder.uri;
      if (!uri) return;
      
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.log("Audio file does not exist on disk:", uri);
        Alert.alert('Lỗi', 'Không thể tạo file ghi âm. Hãy thử lại.');
        return;
      }
      
      // Axios sometimes needs the file:// prefix stripped on iOS, or sometimes it needs it. 
      // uri is usually file:///... which is fine, but let's be safe.
      const cleanUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;`
);

code = code.replace(/import \{ View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator \} from 'react-native';/, "import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator, Platform } from 'react-native';");

// Use cleanUri in FormData
code = code.replace(
  /formData\.append\('audio', \{\s*uri,\s*name: 'audio\.m4a',/g,
  `formData.append('audio', {
        uri: cleanUri,
        name: 'audio.m4a',`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
