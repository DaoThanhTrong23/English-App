const fs = require('fs');

let code = fs.readFileSync('mobile-english/src/app/game/word-matching.tsx', 'utf8');

// 1. Add state for layouts
if (!code.includes('const [layoutsA, setLayoutsA] = useState')) {
  code = code.replace(
    /const \[gameOver, setGameOver\] = useState\(false\);/,
    `const [gameOver, setGameOver] = useState(false);\n  const [layoutsA, setLayoutsA] = useState<Record<number, any>>({});\n  const [layoutsB, setLayoutsB] = useState<Record<number, any>>({});\n  const [containerWidth, setContainerWidth] = useState(0);`
  );
}

// 2. Add onLayout to ColumnA items
if (!code.includes('setLayoutsA(prev => ({ ...prev')) {
  code = code.replace(
    /onPress=\{\(\) => handleSelectA\(item\.id\)\}/,
    `onPress={() => handleSelectA(item.id)}\n        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setLayoutsA(prev => ({ ...prev, [item.id]: { y: layout.y, height: layout.height } }));
        }}`
  );

  code = code.replace(
    /onPress=\{\(\) => handleSelectB\(item\.id\)\}/,
    `onPress={() => handleSelectB(item.id)}\n        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setLayoutsB(prev => ({ ...prev, [item.id]: { y: layout.y, height: layout.height } }));
        }}`
  );
}

// 3. Add onLayout to columnsContainer and render lines
if (!code.includes('setContainerWidth(e.nativeEvent.layout.width)')) {
  code = code.replace(
    /<View style=\{styles\.columnsContainer\}>/,
    `<View style={styles.columnsContainer} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>`
  );
  
  // The line rendering logic
  const linesCode = `
          {/* Render Lines */}
          {containerWidth > 0 && connections.map((conn, idx) => {
            const layoutA = layoutsA[conn.wordId];
            const layoutB = layoutsB[conn.selectedMeaningId];
            if (!layoutA || !layoutB) return null;

            const colWidth = (containerWidth - 21) / 2;
            const startX = colWidth; // Right edge of column A
            const startY = 35 + layoutA.y + layoutA.height / 2; // +35 for "Tiếng Anh" title text height
            
            const endX = colWidth + 21; // Left edge of column B
            const endY = 35 + layoutB.y + layoutB.height / 2;

            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            const centerX = (startX + endX) / 2;
            const centerY = (startY + endY) / 2;

            return (
              <View 
                key={\`line-\${idx}\`}
                style={{
                  position: 'absolute',
                  left: centerX - length / 2,
                  top: centerY - 2,
                  width: length,
                  height: 4,
                  backgroundColor: '#10b981', // green-500
                  transform: [{ rotate: \`\${angle}deg\` }],
                  zIndex: -1,
                  elevation: -1
                }} 
              />
            );
          })}
          
          <View style={styles.column}>`;
          
  code = code.replace(/<View style=\{styles\.column\}>/, linesCode);
}

fs.writeFileSync('mobile-english/src/app/game/word-matching.tsx', code);
