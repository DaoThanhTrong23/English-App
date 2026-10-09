const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

const regex = /if \(q\.questionType === 'multiple_choice'\) \{[\s\S]*?\}\)/;
code = code.replace(
  regex,
  `if (q.questionType === 'multiple_choice') {
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
          <Text style={styles.inputLabel}>Chọn đáp án đúng:</Text>
          {q.answers?.map((ans: any) => {
            const isSelected = selectedOptionId === ans.id;
            return (
              <TouchableOpacity key={ans.id} style={[styles.radioCard, isSelected && styles.radioCardSelected]} onPress={() => setSelectedOptionId(ans.id)}>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioText, isSelected && styles.radioTextSelected]}>{ans.answerText}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) // END RETURN`
);

// Fix syntax error if any
code = code.replace(/\) \/\/ END RETURN\s*\}\)/g, ') // END RETURN\n    }');

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
