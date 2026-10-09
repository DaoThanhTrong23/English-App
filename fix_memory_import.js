const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/memory-card.tsx', 'utf8');

if (!code.includes('ScrollView')) {
  // Replace the View with ScrollView
  code = code.replace(/<View style=\{styles\.grid\}>/, '<ScrollView contentContainerStyle={styles.grid}>');
  code = code.replace(/<\/View>\s*<\/SafeAreaView>/, '</ScrollView>\n    </SafeAreaView>');
}

if (!code.match(/import \{.*ScrollView.*\} from 'react-native'/)) {
  code = code.replace(/import \{ View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator \} from 'react-native';/, "import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';");
}

fs.writeFileSync('mobile-english/src/app/game/memory-card.tsx', code);
