import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen      from './src/screens/LoginScreen';
import RegisterScreen   from './src/screens/RegisterScreen';
import ForgotScreen     from './src/screens/ForgotScreen';
import UserHomeScreen   from './src/screens/UserHomeScreen';
import PredictScreen    from './src/screens/PredictScreen';
import TrainScreen      from './src/screens/TrainScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminHomeScreen  from './src/screens/AdminHomeScreen';
import ManageUsersScreen from './src/screens/ManageUsersScreen';

const Stack = createNativeStackNavigator();

const screenOpts = {
  headerStyle:      { backgroundColor: '#1a1a2e' },
  headerTintColor:  '#00ffc8',
  headerTitleStyle: { fontWeight: 'bold' },
  contentStyle:     { backgroundColor: '#0f0c29' },
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Login" screenOptions={screenOpts}>
        {/* Auth */}
        <Stack.Screen name="Login"      component={LoginScreen}      options={{ title: '✍️ SigVerify', headerShown: false }} />
        <Stack.Screen name="Register"   component={RegisterScreen}   options={{ title: 'Create Account' }} />
        <Stack.Screen name="Forgot"     component={ForgotScreen}     options={{ title: 'Reset Password' }} />

        {/* User */}
        <Stack.Screen name="UserHome"   component={UserHomeScreen}   options={{ title: 'Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="Predict"    component={PredictScreen}    options={{ title: '🔍 Verify Signature' }} />
        <Stack.Screen name="Train"      component={TrainScreen}      options={{ title: '🧠 Train Model' }} />

        {/* Admin */}
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: '🛡️ Admin Login', headerShown: false }} />
        <Stack.Screen name="AdminHome"  component={AdminHomeScreen}  options={{ title: 'Admin Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: '👥 Manage Users' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
