const fs = require('fs');
const file = 'mobile-english/src/app/(tabs)/profile.tsx';
let code = fs.readFileSync(file, 'utf8');

const deleteAccountFunc = `
  const handleDeleteAccount = () => {
    Alert.alert(
      "Cảnh báo nguy hiểm",
      "Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản và toàn bộ tiến trình học tập không? Thao tác này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa tài khoản", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await axiosClient.delete('/profile/delete-account');
              if (res.data?.success) {
                Alert.alert("Thành công", "Tài khoản của bạn đã được xóa.");
                handleLogout(); // Clear local storage and navigate to login
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể xóa tài khoản lúc này.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
`;

if (!code.includes('handleDeleteAccount')) {
  code = code.replace(/const handleLogout = async \(\) => \{/, deleteAccountFunc + '\n  const handleLogout = async () => {');
  
  // Thêm nút xóa tài khoản dưới nút đăng xuất
  const deleteBtnUI = `
          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Xóa tài khoản</Text>
          </TouchableOpacity>
`;
  
  code = code.replace(/<Text style=\{\[styles\.menuText, \{ color: '#ef4444' \}\]\}>Đăng xuất<\/Text>\s*<\/TouchableOpacity>/, "$&\n" + deleteBtnUI);
  
  fs.writeFileSync(file, code);
}
