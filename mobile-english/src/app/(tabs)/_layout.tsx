import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Animated, PanResponder, Dimensions, Image, AppState } from 'react-native';
import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../context/ThemeContext';
import { axiosClient } from '../../api/axiosClient';

const BUBBLE_SIZE = 56;
const PADDING = 16;

function DraggableAiBubble() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

  // Vị trí mặc định: góc dưới bên phải, ngay trên tab bar
  const initialX = windowWidth - BUBBLE_SIZE - 20;
  const initialY = windowHeight - BUBBLE_SIZE - 90;

  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const currentPos = useRef({ x: initialX, y: initialY });
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);

  useEffect(() => {
    const id = pan.addListener((val) => {
      currentPos.current = val;
    });
    return () => {
      pan.removeListener(id);
    };
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.stopAnimation();
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });

        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: false,
          friction: 5,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          isDragging.current = true;
        }
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          friction: 5,
        }).start();

        // Nếu chỉ chạm nhẹ và thả ra ngay (không kéo) -> Chuyển sang màn hình chat AI
        if (!isDragging.current && Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
          /* @ts-ignore */
          router.push('/ai-chat');
          return;
        }

        // Tự động hít (snap) về mép trái hoặc mép phải màn hình cho gọn gàng
        const { width: screenW, height: screenH } = Dimensions.get('window');
        const snapLeft = currentPos.current.x + BUBBLE_SIZE / 2 < screenW / 2;
        const targetX = snapLeft ? PADDING : screenW - BUBBLE_SIZE - PADDING;

        // Giữ vị trí Y nằm trong vùng hiển thị an toàn (không bị che bởi status bar hoặc tab bar)
        const minY = 60;
        const maxY = screenH - BUBBLE_SIZE - 90;
        const targetY = Math.min(Math.max(minY, currentPos.current.y), maxY);

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 6,
          tension: 40,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.fabContainer,
        {
          transform: [
            ...pan.getTranslateTransform(),
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* <View style={styles.fab}>
        <Ionicons name="sparkles" size={24} color="#ffffff" />
      </View> */}
    <View style={styles.fab}>
      <Image 
        source={require('../../../assets/images/gacon.gif')} 
        style={{ width: 42, height: 42, borderRadius: 21 }} 
      />
    </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  
  useEffect(() => {
    let isMounted = true;

    const checkOnboarding = async () => {
      try {
        const userInfoStr = await SecureStore.getItemAsync('userInfo');
        if (userInfoStr) {
          const user = JSON.parse(userInfoStr);
          if (user.onboardingCompleted === false) {
            // Force user to placement test
            router.replace('/onboarding');
          }
        }
      } catch (e) {
        console.log('Error checking onboarding status', e);
      }
    };
    checkOnboarding();

    // Kiểm tra định kỳ trạng thái khóa tài khoản theo thời gian thực (Heartbeat)
    const checkAccountStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (!token) {
          router.replace('/(auth)/login');
          return;
        }
        // Gọi API để middleware Authenticate kiểm tra isLocked trong DB
        await axiosClient.get('/profile/me');
      } catch (e) {
        // Nếu tài khoản bị Admin khóa (403 account_locked), axiosClient interceptor sẽ tự động xóa phiên, hiện thông báo và chuyển về login
      }
    };

    checkAccountStatus();

    // Heartbeat mỗi 5 giây để ngắt phiên ngay lập tức khi Admin bấm khóa
    const timer = setInterval(() => {
      if (isMounted) checkAccountStatus();
    }, 5000);

    // Kiểm tra ngay khi người dùng mở lại app từ chế độ nền (background -> active)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkAccountStatus();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);  
  const { theme } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        initialRouteName="index"
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.subtext,
          tabBarStyle: {
            borderTopWidth: 1,
            borderColor: theme.tabBarBorder,
            backgroundColor: theme.tabBar,
            height: 60,
            paddingBottom: 10,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Khám phá',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Xếp hạng',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'Cộng đồng',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="course/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="lesson/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>

      {/* FLOATING DRAGGABLE AI CHAT BUBBLE */}
      <DraggableAiBubble />
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 999,
  },
  fab: {
    backgroundColor: '#8b5cf6', // Tím mộng mơ cho AI
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  }
});