const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Add OBSTACLES array outside or inside the component
if (!code.includes("const OBSTACLES =")) {
  code = code.replace(
    /export default function MarioVoiceRunScreen\(\) \{/,
    `const OBSTACLES = [
  { name: 'bug', color: '#ef4444' },
  { name: 'flame', color: '#f97316' },
  { name: 'skull', color: '#4b5563' },
  { name: 'bonfire', color: '#ea580c' },
  { name: 'flash', color: '#eab308' },
];

export default function MarioVoiceRunScreen() {`
  );
}

// Replace the obstacle rendering
code = code.replace(
  /<Ionicons name=\{currentIndex % 2 === 0 \? "leaf" : "water"\} size=\{40\} color="#10b981" \/>/,
  `<Ionicons name={OBSTACLES[currentIndex % OBSTACLES.length].name as any} size={42} color={OBSTACLES[currentIndex % OBSTACLES.length].color} />`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
