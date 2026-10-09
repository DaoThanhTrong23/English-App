const fs = require('fs');
let code = fs.readFileSync('backend-api/seed_courses.ts', 'utf8');

const replacements = [
  ['Greetings and Introductions', 'Chào hỏi và Giới thiệu'],
  ['Daily Routines', 'Thói quen hàng ngày'],
  ['Food and Drink', 'Đồ ăn và Thức uống'],
  ['Travel and Holidays', 'Du lịch và Kỳ nghỉ'],
  ['Health and Fitness', 'Sức khỏe và Thể hình'],
  ['Shopping', 'Mua sắm'],
  ['Education and Careers', 'Giáo dục và Nghề nghiệp'],
  ['Environment', 'Môi trường'],
  ['Technology', 'Công nghệ'],
  ['Media and News', 'Truyền thông và Tin tức'],
  ['Society and Culture', 'Xã hội và Văn hóa'],
  ['Business and Economy', 'Kinh doanh và Kinh tế'],
  ['Arts and Literature', 'Nghệ thuật và Văn học'],
  ['Science and Innovation', 'Khoa học và Đổi mới'],
  ['Global Issues', 'Các vấn đề toàn cầu'],
  ['Philosophy and Ethics', 'Triết học và Đạo đức'],
  ['Advanced Linguistics', 'Ngôn ngữ học chuyên sâu'],
  ['International Relations', 'Quan hệ quốc tế']
];

for (const [en, vi] of replacements) {
  code = code.replace(new RegExp(en, 'g'), vi);
}

// Ensure lesson titles are also correctly structured
code = code.replace(/Lesson \$\{l\}: \$\{topic\.title\} - Part \$\{l\}/g, "Bài học ${l}: ${topicData.title} - Phần ${l}");
code = code.replace(/<h2>Lesson \$\{l\}:/g, "<h2>Bài học ${l}:");

fs.writeFileSync('backend-api/seed_courses.ts', code);
