import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface ThemePalette {
  isDark: boolean;
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  inputText: string;
  statusBarStyle: 'dark' | 'light';
}

export const lightTheme: ThemePalette = {
  isDark: false,
  background: '#f8fafc',
  card: '#ffffff',
  cardSecondary: '#f1f5f9',
  text: '#0f172a',
  subtext: '#64748b',
  border: '#e2e8f0',
  primary: '#2563eb',
  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  inputBg: '#f8fafc',
  inputText: '#0f172a',
  statusBarStyle: 'dark',
};

export const darkTheme: ThemePalette = {
  isDark: true,
  background: '#000000', // Đen sâu chuẩn OLED
  card: '#121214',       // Đen nhẹ (Charcoal surface)
  cardSecondary: '#1c1c1f', // Đen nhẹ cấp 2
  text: '#ffffff',       // Trắng tinh
  subtext: '#a1a1aa',    // Xám trung tính
  border: '#27272a',     // Viền đen nhẹ
  primary: '#3b82f6',
  tabBar: '#09090b',     // Đen sâu cho thanh bottom bar
  tabBarBorder: '#27272a',
  inputBg: '#18181b',
  inputText: '#ffffff',
  statusBarStyle: 'light',
};

interface ThemeContextType {
  isDark: boolean;
  theme: ThemePalette;
  toggleDarkMode: (enabled: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: lightTheme,
  toggleDarkMode: async () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedDark = await SecureStore.getItemAsync('appDarkMode');
        if (storedDark !== null) {
          setIsDark(storedDark === 'true');
        }
      } catch (err) {
        console.log('Error loading dark mode setting:', err);
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async (enabled: boolean) => {
    setIsDark(enabled);
    try {
      await SecureStore.setItemAsync('appDarkMode', enabled ? 'true' : 'false');
    } catch (err) {
      console.log('Error saving dark mode setting:', err);
    }
  };

  const currentTheme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme: currentTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
