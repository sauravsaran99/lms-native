import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightColors = {
  ...MD3LightTheme.colors,
  primary: '#2563EB', // Professional Blue
  secondary: '#0F172A', // Navy
  tertiary: '#F59E0B', // Amber
  background: '#F8F9FA',
  surface: '#FFFFFF',
  error: '#DC2626',
  success: '#10B981',
  warning: '#FBBF24',
  text: '#1E293B',
  onSurface: '#1E293B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  card: '#FFFFFF',
};

export const darkColors = {
  ...MD3DarkTheme.colors,
  primary: '#60A5FA', // Lighter Blue for dark mode
  secondary: '#94A3B8', // Slate
  tertiary: '#FBBF24',
  background: '#0F172A', // Deep Slate
  surface: '#1E293B',
  error: '#EF4444',
  success: '#34D399',
  warning: '#F59E0B',
  text: '#F1F5F9', // Light Grey text
  onSurface: '#F1F5F9',
  placeholder: '#64748B',
  border: '#334155',
  card: '#1E293B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  bold: '700',
  heavy: '800',
};

export const LightTheme = {
  ...MD3LightTheme,
  colors: lightColors,
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: darkColors,
};

export const colors = lightColors;
