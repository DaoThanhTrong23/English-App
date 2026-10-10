const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', 'utf8');

// The second getSkillProgress starts with "const getSkillProgress = (skillType: string) => {" and ends with "return 0;\n  };"
// We will find the FIRST index of "const getSkillProgress", which is the one we want to KEEP (the top one).
// Then we find the SECOND index, and remove it.

const firstIndex = code.indexOf('const getSkillProgress =');
const secondIndex = code.indexOf('const getSkillProgress =', firstIndex + 10);

if (secondIndex > -1) {
  const endOfSecond = code.indexOf('return 0;\n  };', secondIndex);
  if (endOfSecond > -1) {
    code = code.substring(0, secondIndex) + code.substring(endOfSecond + 'return 0;\n  };'.length);
  }
}

fs.writeFileSync('mobile-english/src/app/(tabs)/lesson/[id].tsx', code);
