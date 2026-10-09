const fs = require('fs');
const file = 'mobile-english/src/app/game/bubble-game.tsx';
let code = fs.readFileSync(file, 'utf8');

// Thay the state timeLeft thanh timeElapsed
code = code.replace(
  /const \[timeLeft, setTimeLeft\] = useState\(90\);/,
  `const [timeElapsed, setTimeElapsed] = useState(0);`
);

// Sua logic dem timer tang dan
code = code.replace(
  /const timer = setInterval\(\(\) => \{[\s\S]*?\}, 1000\);/m,
  `const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);`
);

// Sua score hien thi va header
code = code.replace(
  /<Text style=\{styles\.scoreText\}>Điểm: \{score\}<\/Text>/,
  `` // Xoa diem khoi header
);

code = code.replace(
  /<Text style=\{styles\.timerText\}>\{timeLeft\}s<\/Text>/,
  `<Text style={styles.timerText}>{timeElapsed}s</Text>`
);

// Sua diem thanh hieu ung the hien qua thoi gian va cap nhat api
code = code.replace(
  /const duration = Math\.floor\(\(Date\.now\(\) - startTime\.current\) \/ 1000\);/,
  `const duration = Math.floor((Date.now() - startTime.current) / 1000);
    const finalScore = Math.max(10, 1000 - duration * 10); // Diem tuy thuoc vao thoi gian cang nhanh cang cao`
);

code = code.replace(
  /totalScore: score,/,
  `totalScore: finalScore,`
);

code = code.replace(
  /Alert\.alert\('Kết thúc!', 'Bạn đạt ' \+ score \+ ' điểm!\\\\nĐã khớp: ' \+ matchedIds\.length \+ '\/' \+ allWords\.length,/,
  `Alert.alert('Hoàn thành!', 'Thời gian: ' + duration + 's\\nĐiểm thưởng tốc độ: ' + finalScore,`
);

// Xoa setScore khi tra loi dung sai
code = code.replace(/setScore\(prev => prev \+ 10\);/g, '');
code = code.replace(/setScore\(prev => Math\.max\(0, prev - 5\)\);/g, '');

fs.writeFileSync(file, code);
