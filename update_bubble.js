const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/bubble-game.tsx', 'utf8');

// 1. Change bubble size
code = code.replace(/const BUBBLE_SIZE = 80;/, 'const BUBBLE_SIZE = 110;');

// 2. Change animation speed to be slower (easier to catch)
code = code.replace(/duration: 3500 \+ Math\.random\(\) \* 2500,/, 'duration: 6000 + Math.random() * 4000,');

// 3. Add highlight to bubble
const oldBubbleContent = `{type === 'word' ? (
          <Text style={styles.bubbleText}>{item.word}</Text>
        ) : (
          <Text style={styles.bubbleTextMeaning}>{item.meaning}</Text>
        )}`;
        
const newBubbleContent = `
        <View style={styles.bubbleHighlight} />
        <View style={styles.bubbleReflection} />
        {type === 'word' ? (
          <Text style={styles.bubbleText}>{item.word}</Text>
        ) : (
          <Text style={styles.bubbleTextMeaning}>{item.meaning}</Text>
        )}`;

if (code.includes(oldBubbleContent)) {
  code = code.replace(oldBubbleContent, newBubbleContent);
} else {
  // Try regex if exact string mismatch
  code = code.replace(
    /\{type === 'word' \? \([\s\S]*?<Text style=\{styles\.bubbleText\}>\{item\.word\}<\/Text>[\s\S]*?\) : \([\s\S]*?<Text style=\{styles\.bubbleTextMeaning\}>\{item\.meaning\}<\/Text>[\s\S]*?\)\}/,
    newBubbleContent
  );
}

// 4. Update styles
const oldStyles = `  bubble: { width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE/2, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5 },
  bubbleWord: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#3b82f6' },
  bubbleMeaning: { backgroundColor: '#fef08a', borderWidth: 2, borderColor: '#ca8a04' },`;

const newStyles = `  bubble: { 
    width: BUBBLE_SIZE, 
    height: BUBBLE_SIZE, 
    borderRadius: BUBBLE_SIZE/2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: {width: 0, height: 4}, 
    shadowOpacity: 0.2, 
    shadowRadius: 5,
    overflow: 'hidden'
  },
  bubbleHighlight: {
    position: 'absolute',
    top: BUBBLE_SIZE * 0.1,
    left: BUBBLE_SIZE * 0.15,
    width: BUBBLE_SIZE * 0.35,
    height: BUBBLE_SIZE * 0.15,
    borderRadius: BUBBLE_SIZE * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '-45deg' }]
  },
  bubbleReflection: {
    position: 'absolute',
    bottom: BUBBLE_SIZE * 0.1,
    right: BUBBLE_SIZE * 0.15,
    width: BUBBLE_SIZE * 0.15,
    height: BUBBLE_SIZE * 0.1,
    borderRadius: BUBBLE_SIZE * 0.1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '-45deg' }]
  },
  bubbleWord: { backgroundColor: 'rgba(186, 230, 253, 0.75)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.8)' },
  bubbleMeaning: { backgroundColor: 'rgba(254, 240, 138, 0.75)', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.8)' },`;

code = code.replace(oldStyles, newStyles);

fs.writeFileSync('mobile-english/src/app/game/bubble-game.tsx', code);
console.log("Updated bubble-game.tsx successfully.");
