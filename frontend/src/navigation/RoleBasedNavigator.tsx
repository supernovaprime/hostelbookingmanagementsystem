import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Import all screens
import HomeScreen from '../screens/HomeScreenSimple';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SuperAdminPortal from '../screens/SuperAdminPortal';
import ManagerPortal from '../screens/ManagerPortal';
import TenantPortal from '../screens/TenantPortal';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  SuperAdminPortal: undefined;
  ManagerPortal: undefined;
  TenantPortal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const RoleBasedNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Return a loading screen while checking authentication
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    );
  }

  if (!user) {
    // Unauthenticated user flow
    return (
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF8C00',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Hostel Booking' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Register' }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: 'Forgot Password' }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ title: 'Reset Password' }}
        />
      </Stack.Navigator>
    );
  }

  // Authenticated user flow - role-based navigation
  const getRoleBasedScreens = () => {
    // Since we already checked !user above, user should not be null here
    if (!user) return [];

    const commonScreens = [
      <Stack.Screen
        key="Home"
        name="Home"
        component={HomeScreen}
        options={{ title: 'Hostel Booking' }}
      />,
    ];

    switch (user.role) {
      case 'superadmin':
        return [
          ...commonScreens,
          <Stack.Screen
            key="SuperAdminPortal"
            name="SuperAdminPortal"
            component={SuperAdminPortal}
            options={{
              title: 'Super Admin Portal',
              gestureEnabled: false, // Prevent swipe back
            }}
          />,
        ];

      case 'manager':
        return [
          ...commonScreens,
          <Stack.Screen
            key="ManagerPortal"
            name="ManagerPortal"
            component={ManagerPortal}
            options={{
              title: 'Manager Portal',
              gestureEnabled: false,
            }}
          />,
        ];

      case 'tenant':
        return [
          ...commonScreens,
          <Stack.Screen
            key="TenantPortal"
            name="TenantPortal"
            component={TenantPortal}
            options={{
              title: 'Tenant Portal',
              gestureEnabled: false,
            }}
          />,
        ];

      default:
        return commonScreens;
    }
  };

  const getInitialRouteName = () => {
    switch (user?.role) {
      case 'superadmin':
        return 'SuperAdminPortal';
      case 'manager':
        return 'ManagerPortal';
      case 'tenant':
        return 'TenantPortal';
      default:
        return 'Home';
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF8C00',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {getRoleBasedScreens()}
    </Stack.Navigator>
  );
};

export default RoleBasedNavigator;
