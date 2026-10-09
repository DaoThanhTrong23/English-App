const fs = require('fs');
const file = 'backend-api/src/prisma/schema.prisma';
let lines = fs.readFileSync(file, 'utf8').split('\n');

let inUser = false;
let inQuestion = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('model User {')) {
    inUser = true;
  }
  if (lines[i].startsWith('model Question {')) {
    inQuestion = true;
  }
  if (lines[i].startsWith('}') && inUser) {
    inUser = false;
  }
  if (lines[i].startsWith('}') && inQuestion) {
    inQuestion = false;
  }

  if (lines[i].includes('communityPosts') && lines[i].includes('CommunityPost[]')) {
    if (inQuestion) {
      lines[i] = ''; // Remove from Question
    }
  }
}

let newCode = lines.join('\n');
if (!newCode.includes('communityPosts      CommunityPost[]') && newCode.includes('model CommunityPost')) {
  // Add back to User
  newCode = newCode.replace(/model User \{[\s\S]*?assessmentHistories AssessmentHistory\[\]/, match => match + '\n  communityPosts      CommunityPost[]');
}

fs.writeFileSync(file, newCode);
