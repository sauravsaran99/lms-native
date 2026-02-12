import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, List, RadioButton, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

export default function Settings() {
  const { logout, userToken, userName, userEmail } = useAuth();
  const { themeMode, setMode } = useAppTheme();
  const theme = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          {userName || 'User'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {userEmail || 'user@example.com'}
        </Text>
      </View>

      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <View style={styles.radioGroup}>
          <View style={styles.radioItem}>
            <RadioButton
              value="system"
              status={themeMode === 'system' ? 'checked' : 'unchecked'}
              onPress={() => setMode('system')}
            />
            <Text onPress={() => setMode('system')}>System Default</Text>
          </View>
          <View style={styles.radioItem}>
            <RadioButton
              value="light"
              status={themeMode === 'light' ? 'checked' : 'unchecked'}
              onPress={() => setMode('light')}
            />
            <Text onPress={() => setMode('light')}>Light</Text>
          </View>
          <View style={styles.radioItem}>
            <RadioButton
              value="dark"
              status={themeMode === 'dark' ? 'checked' : 'unchecked'}
              onPress={() => setMode('dark')}
            />
            <Text onPress={() => setMode('dark')}>Dark</Text>
          </View>
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Token Status"
          description={userToken ? 'Active' : 'Inactive'}
          left={props => <List.Icon {...props} icon="key" />}
        />
      </List.Section>

      <View style={styles.footer}>
        <Button mode="contained" onPress={handleLogout} buttonColor={theme.colors.error}>
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  radioGroup: {
    paddingHorizontal: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    marginTop: 20,
  },
});
