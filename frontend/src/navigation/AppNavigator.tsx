import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreenSimple';
import  LoginScreen  from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SuperAdminPortal from '../screens/SuperAdminPortal';
import ManagerPortal from '../screens/ManagerPortal';
import TenantPortal from '../screens/TenantPortal';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Hostel Booking' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
        <Stack.Screen name="SuperAdminPortal" component={SuperAdminPortal} options={{ title: 'Super Admin Portal' }} />
        <Stack.Screen name="ManagerPortal" component={ManagerPortal} options={{ title: 'Manager Portal' }} />
        <Stack.Screen name="TenantPortal" component={TenantPortal} options={{ title: 'Tenant Portal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
