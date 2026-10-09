const fs = require('fs');

const f1 = 'mobile-english/src/app/game/bubble-game.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/Alert\.alert\('Kết thúc!', [^,]+, \[/g, "Alert.alert('Kết thúc!', 'Bạn đạt ' + score + ' điểm!\\nĐã khớp: ' + matchedIds.length + '/' + words.length, [");
fs.writeFileSync(f1, c1);

const f2 = 'mobile-english/src/app/game/memory-card.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/Alert\.alert\('Kết thúc!', [^,]+, \[/g, "Alert.alert('Kết thúc!', 'Bạn đạt ' + score + ' điểm!\\nSố lượt lật: ' + turns, [");
fs.writeFileSync(f2, c2);

const f3 = 'mobile-english/src/app/game/word-matching.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/Alert\.alert\(\s*'Hoàn thành!',\s*[^,]+,\s*\[/g, "Alert.alert('Hoàn thành!', 'Điểm: ' + result.totalScore + '\\nSố câu đúng: ' + result.correctCount + '/' + result.totalQuestions + '\\nThời gian: ' + duration + 's', [");
fs.writeFileSync(f3, c3);
