const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/memory-card.tsx', 'utf8');

// Replace the <View style={styles.grid}> with a ScrollView
code = code.replace(
  /<View style=\{styles\.grid\}>/g,
  '<ScrollView contentContainerStyle={styles.grid}>'
);

code = code.replace(
  /<\/View>\s*<\/SafeAreaView>/,
  '</ScrollView>\n    </SafeAreaView>'
);

// Add ScrollView to imports if missing
if (!code.includes('ScrollView')) {
  code = code.replace(/import \{ View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator \}/, 'import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator, ScrollView }');
}

fs.writeFileSync('mobile-english/src/app/game/memory-card.tsx', code);
