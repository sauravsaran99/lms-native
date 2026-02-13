import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppThemeProvider } from '../context/ThemeContext';

function InitialLayout() {
  const { userToken, userRole, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(drawer)';

    if (!userToken && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/(auth)/login');
    } else if (userToken && (inAuthGroup || segments[0] !== '(drawer)')) {
      // Redirect authenticated users
      if (userRole === 'RECEPTIONIST') {
        router.replace('/(drawer)/bookings');
      } else {
        router.replace('/(drawer)/dashboard');
      }
    }
  }, [userToken, userRole, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <InitialLayout />
      </AppThemeProvider>
    </AuthProvider>
  );
}
