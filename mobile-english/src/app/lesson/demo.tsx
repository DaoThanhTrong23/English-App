import { Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export default function DemoLesson() {
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Demo Lesson</Text>
    </View>
  );
}
