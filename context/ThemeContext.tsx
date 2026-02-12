import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { DarkTheme, LightTheme } from '../app/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    isDark: boolean;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    isDark: false,
    toggleTheme: () => { },
    setMode: () => { },
});

export const useAppTheme = () => useContext(ThemeContext);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme_mode');
                if (savedTheme) {
                    setThemeMode(savedTheme as ThemeMode);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            }
        };
        loadTheme();
    }, []);

    // Update effect when mode or system changes
    useEffect(() => {
        if (themeMode === 'system') {
            setIsDark(systemScheme === 'dark');
        } else {
            setIsDark(themeMode === 'dark');
        }
    }, [themeMode, systemScheme]);

    const toggleTheme = async () => {
        const newMode = isDark ? 'light' : 'dark';
        setThemeMode(newMode);
        await AsyncStorage.setItem('theme_mode', newMode);
    };

    const setMode = async (mode: ThemeMode) => {
        setThemeMode(mode);
        await AsyncStorage.setItem('theme_mode', mode);
    };

    const currentTheme = isDark ? DarkTheme : LightTheme;

    return (
        <ThemeContext.Provider value={{ themeMode, isDark, toggleTheme, setMode }}>
            <PaperProvider theme={currentTheme}>
                {children}
            </PaperProvider>
        </ThemeContext.Provider>
    );
};
