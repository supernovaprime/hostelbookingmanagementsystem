import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'HostelHub' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
        <Stack.Screen name="super-admin" options={{ title: 'Super Admin Portal' }} />
        <Stack.Screen name="manager" options={{ title: 'Manager Portal' }} />
        <Stack.Screen name="tenant" options={{ title: 'Tenant Portal' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
