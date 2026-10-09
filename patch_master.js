const fs = require('fs');
let code = fs.readFileSync('update_practice_full.js', 'utf8');

// The string to replace inside update_practice_full.js
const oldBlock = `    if (q.questionType === 'multiple_choice') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          <Text style={styles.inputLabel}>Chọn đáp án đúng:</Text>`;

const newBlock = `    if (q.questionType === 'multiple_choice') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionCard}>
            {(type === 'listening' || q.audioUrl) && (
               <TouchableOpacity onPress={playDummyAudio} style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15}}>
                 <Ionicons name="volume-medium" size={30} color="#fff" />
               </TouchableOpacity>
            )}
            <Text style={styles.questionSubtitle}>{q.quesionText}</Text>
          </View>
          <Text style={styles.inputLabel}>Chọn đáp án đúng:</Text>`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('update_practice_full.js', code);
