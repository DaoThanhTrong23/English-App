const fs = require('fs');
const path = 'mobile-english/src/app/(tabs)/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const gameSection = `
        {/* GAME HUB & NHIỆM VỤ */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <TouchableOpacity 
            style={{flex: 1, backgroundColor: '#fef3c7', padding: 15, borderRadius: 16, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#fde68a'}}
            onPress={() => { /* @ts-ignore */ router.push('/games')}}
          >
            <Ionicons name="game-controller" size={32} color="#d97706" />
            <Text style={{fontWeight: 'bold', color: '#b45309', marginTop: 8}}>Giải Trí</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{flex: 1, backgroundColor: '#dcfce7', padding: 15, borderRadius: 16, marginLeft: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0'}}
            onPress={() => alert('Đã nhận nhiệm vụ: Hoàn thành 1 bài học (+20 XP)')}
          >
            <Ionicons name="calendar" size={32} color="#15803d" />
            <Text style={{fontWeight: 'bold', color: '#166534', marginTop: 8}}>Nhiệm Vụ</Text>
          </TouchableOpacity>
        </View>

        {/* CHỦ ĐỀ HỌC TẬP */}
`;

code = code.replace('{/* CHỦ ĐỀ HỌC TẬP */}', gameSection);
fs.writeFileSync(path, code);
