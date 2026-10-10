const fs = require('fs');

let code = fs.readFileSync('mobile-english/src/app/game/word-matching.tsx', 'utf8');

// 1. Add state for layouts
if (!code.includes('const [layoutsA, setLayoutsA] = useState')) {
  code = code.replace(
    /const \[gameOver, setGameOver\] = useState\(false\);/,
    `const [gameOver, setGameOver] = useState(false);\n  const [layoutsA, setLayoutsA] = useState<Record<number, any>>({});\n  const [layoutsB, setLayoutsB] = useState<Record<number, any>>({});`
  );
}

// 2. Add onLayout to ColumnA
if (!code.includes('onLayout={(e) => {')) {
  code = code.replace(
    /onPress=\{\(\) => handleSelectA\(item\.id\)\}/,
    `onPress={() => handleSelectA(item.id)}\n        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setLayoutsA(prev => ({ ...prev, [item.id]: { x: layout.x, y: layout.y, width: layout.width, height: layout.height } }));
        }}`
  );

  code = code.replace(
    /onPress=\{\(\) => handleSelectB\(item\.id\)\}/,
    `onPress={() => handleSelectB(item.id)}\n        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setLayoutsB(prev => ({ ...prev, [item.id]: { x: layout.x, y: layout.y, width: layout.width, height: layout.height } }));
        }}`
  );
}

// 3. Add Lines rendering
const linesCode = `
          {/* Render Lines */}
          {connections.map(conn => {
            const layoutA = layoutsA[conn.wordId];
            const layoutB = layoutsB[conn.selectedMeaningId];
            if (!layoutA || !layoutB) return null;

            // Center of card A relative to its column
            const aX = layoutA.x + layoutA.width; // Right edge of A
            const aY = layoutA.y + layoutA.height / 2; // Center Y of A
            
            // Center of card B relative to its column
            // Wait, columnsContainer is flex-row with space-between.
            // B is in the second column. To draw lines across the container, we need absolute positions relative to the columnsContainer!
            // Actually, drawing lines relative to \`columnsContainer\` means A's X is \`layoutA.width\`, and B's X is \`columnsContainerWidth - layoutB.width\`.
            return null;
          })}
`;
// Let's use a simpler approach for lines instead of calculating exact container width:
// Since columns have \`flex: 1\`, their width is roughly 50% - 10px.
// But it's easier to put an absolute View over the whole columnsContainer, and use View.measure or just approximate it.
// Actually, using react-native-svg is MUCH easier and cleaner than math. Let's just install react-native-svg!
