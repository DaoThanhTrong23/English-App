const fs = require('fs');
const file = 'mobile-english/src/app/(tabs)/profile.tsx';
let code = fs.readFileSync(file, 'utf8');

// Thêm import * as ImagePicker from 'expo-image-picker'
if (!code.includes('expo-image-picker')) {
  code = code.replace(/import \* as SecureStore from 'expo-secure-store';/, "import * as SecureStore from 'expo-secure-store';\nimport * as ImagePicker from 'expo-image-picker';\nimport { axiosClient } from '../../api/axiosClient';\nimport { Alert } from 'react-native';");
}

// Thêm hàm handlePickImage
const pickImageFunc = `
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Show loading indicator instead of avatar
        setLoading(true);
        
        const localUri = selectedAsset.uri;
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        const match = /\\.(\\w+)$/.exec(filename);
        const type = match ? \`image/\${match[1]}\` : \`image\`;
        
        const formData = new FormData();
        // @ts-ignore
        formData.append('avatar', { uri: localUri, name: filename, type });

        try {
          const res = await axiosClient.put('/profile/update', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (res.data?.success) {
            const newAvatarUrl = 'http://localhost:3000' + res.data.data.avatarUrl; // Or API_URL base
            setAvatarUri(newAvatarUrl);
            await SecureStore.setItemAsync('userAvatar', newAvatarUrl);
            Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
          }
        } catch (apiErr: any) {
          console.error(apiErr);
          Alert.alert('Lỗi', 'Không thể tải ảnh lên máy chủ.');
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };
`;

code = code.replace(/const handleLogout = async \(\) => \{/, pickImageFunc + '\n  const handleLogout = async () => {');

// Gắn sự kiện vào nút editAvatarBtn
code = code.replace(/<TouchableOpacity style=\{styles\.editAvatarBtn\}>/, '<TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage}>');

// Gắn ImagePicker vào
fs.writeFileSync(file, code);
