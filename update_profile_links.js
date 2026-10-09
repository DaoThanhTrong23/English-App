const fs = require('fs');
const path = 'mobile-english/src/app/(tabs)/profile.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /<TouchableOpacity style=\{styles\.menuItem\}>\s*<View style=\{\[styles\.menuIcon, \{ backgroundColor: '#f3f4f6' \}\]\}>\s*<Ionicons name="bookmark-outline"[\s\S]*?<Text style=\{styles\.menuText\}>Từ vựng đã lưu<\/Text>\s*<Text style=\{styles\.badgeUpdate\}>Đang cập nhật<\/Text>\s*<Ionicons name="chevron-forward"[\s\S]*?<\/TouchableOpacity>/,
  '<TouchableOpacity style={styles.menuItem} onPress={() => { /* @ts-ignore */ router.push(\'/saved-words\')}}><View style={[styles.menuIcon, { backgroundColor: \'#f3f4f6\' }]}><Ionicons name="bookmark-outline" size={20} color="#374151" /></View><Text style={styles.menuText}>Từ vựng đã lưu</Text><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></TouchableOpacity>'
);

code = code.replace(
  /<TouchableOpacity style=\{styles\.menuItem\}>\s*<View style=\{\[styles\.menuIcon, \{ backgroundColor: '#f3f4f6' \}\]\}>\s*<Ionicons name="time-outline"[\s\S]*?<Text style=\{styles\.menuText\}>Lịch sử học tập<\/Text>\s*<Text style=\{styles\.badgeUpdate\}>Đang cập nhật<\/Text>\s*<Ionicons name="chevron-forward"[\s\S]*?<\/TouchableOpacity>/,
  '<TouchableOpacity style={styles.menuItem} onPress={() => { /* @ts-ignore */ router.push(\'/history\')}}><View style={[styles.menuIcon, { backgroundColor: \'#f3f4f6\' }]}><Ionicons name="time-outline" size={20} color="#374151" /></View><Text style={styles.menuText}>Lịch sử học tập</Text><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></TouchableOpacity>'
);

code = code.replace(
  /<TouchableOpacity style=\{styles\.menuItem\}>\s*<View style=\{\[styles\.menuIcon, \{ backgroundColor: '#f3f4f6' \}\]\}>\s*<Ionicons name="trophy-outline"[\s\S]*?<Text style=\{styles\.menuText\}>Thành tựu<\/Text>\s*<Text style=\{styles\.badgeUpdate\}>Đang cập nhật<\/Text>\s*<Ionicons name="chevron-forward"[\s\S]*?<\/TouchableOpacity>/,
  '<TouchableOpacity style={styles.menuItem} onPress={() => { /* @ts-ignore */ router.push(\'/achievements\')}}><View style={[styles.menuIcon, { backgroundColor: \'#f3f4f6\' }]}><Ionicons name="trophy-outline" size={20} color="#374151" /></View><Text style={styles.menuText}>Thành tựu</Text><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></TouchableOpacity>'
);

fs.writeFileSync(path, code);
