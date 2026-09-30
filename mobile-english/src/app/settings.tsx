import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.sectionTitle}>Chung</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#4b5563" style={styles.settingIcon} />
              <Text style={styles.settingText}>Thông báo nhắc nhở</Text>
            </View>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: '#2563eb' }} />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high" size={20} color="#4b5563" style={styles.settingIcon} />
              <Text style={styles.settingText}>Hiệu ứng âm thanh</Text>
            </View>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: '#2563eb' }} />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={20} color="#4b5563" style={styles.settingIcon} />
              <Text style={styles.settingText}>Chế độ nền tối (Dark Mode)</Text>
            </View>
            <Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackColor={{ true: '#2563eb' }} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Hỗ trợ</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={20} color="#4b5563" style={styles.settingIcon} />
              <Text style={styles.settingText}>Trung tâm trợ giúp</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.settingDivider} />
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={20} color="#4b5563" style={styles.settingIcon} />
              <Text style={styles.settingText}>Về EngMaster</Text>
            </View>
            <Text style={{color: '#9ca3af', fontSize: 13}}>Phiên bản 1.0.0</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dangerBtn}>
          <Text style={styles.dangerText}>Xóa tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, marginTop: 10, marginLeft: 5 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#f3f4f6' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { marginRight: 15 },
  settingText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  settingDivider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 50 },
  dangerBtn: { padding: 15, marginTop: 20, alignItems: 'center' },
  dangerText: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 }
});
