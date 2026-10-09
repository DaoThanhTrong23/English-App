const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/index.tsx', 'utf8');

// 1. Change the topicCard onPress
const oldTopicCardPress = `              <TouchableOpacity 
                key={course.id} 
                style={[styles.topicCard, isActive && {borderColor: '#3b82f6', backgroundColor: '#f0fdfa'}]} 
                onPress={() => {
                  setSelectedCourse(course);
                  fetchLessons(course.id);
                }}>`;

const newTopicCardPress = `              <TouchableOpacity 
                key={course.id} 
                style={styles.topicCard} 
                onPress={() => {
                  router.push({ pathname: '/(tabs)/course/[id]', params: { id: course.id } } as any);
                }}>`;

code = code.replace(oldTopicCardPress, newTopicCardPress);

// 2. Remove the selectedCourse check in render
code = code.replace(/const isActive = selectedCourse\?.id === course.id;/g, '');

// 3. Remove the entire lessons section
const lessonsSectionRegex = /\{\/\* BA\?I HOC \*\/\}.*?<\/View>\s*\{\/\* BOTTOM BANNER \*\/\}/gs;
code = code.replace(/\{\/\*\s*BÀI HỌC\s*\*\/\}.*?\{\/\*\s*BOTTOM BANNER\s*\*\/\}/gs, '{/* BOTTOM BANNER */}');

// The regex might not match if there are special characters. Let's do it safely using string replacement.
const startMarker = "{/* BÀI HỌC */}";
// Sometimes the comment has weird encoding BA?I HOC
code = code.replace(/\{\/\*.*?B.*?H.*?\*\/\}\s*\{selectedCourse && \([\s\S]*?<\/View>\s*\{\/\* BOTTOM BANNER \*\/\}/, '{/* BOTTOM BANNER */}');

fs.writeFileSync('mobile-english/src/app/(tabs)/index.tsx', code);
