const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

const anchor = "const pScore = responseData?.data?.overallScore || 0;";
const anchorIdx = code.indexOf(anchor);

if (anchorIdx !== -1) {
  const blockStart = anchorIdx + anchor.length;
  // find the end of the else block which is "}" followed by "catch (error)"
  const blockEndStr = "} catch (error) {";
  const blockEndIdx = code.indexOf(blockEndStr, blockStart);
  
  if (blockEndIdx !== -1) {
    const before = code.substring(0, blockStart);
    const after = code.substring(blockEndIdx);
    
    const newLogic = `
      if (pScore >= 60) {
        setScore(prev => prev + 10);
        Alert.alert('Tuyệt vời!', 'Điểm: ' + Math.round(pScore) + '%', [
          { text: 'Tiếp tục', onPress: resumeGame }
        ]);
      } else {
        Alert.alert('Chưa chính xác', 'Điểm: ' + Math.round(pScore) + '%. Hãy thử lại!');
      }
    `;
    
    fs.writeFileSync('mobile-english/src/app/game/mario.tsx', before + newLogic + after);
    console.log("Replaced successfully via indexOf!");
  }
}
