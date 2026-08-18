import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkInitialState() {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        const token = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;

        if (!hasLaunched) {
          // Stay on index
          router.replace('/');
        } else if (token && userData) {
          if (userData.role === 'admin' || userData.email === 'noreply@indebel.be') {
            router.replace('/admin');
          } else if (userData.role === 'employer') {
            router.replace('/employer');
          } else {
            router.replace('/freelancer');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking initial state:', error);
      } finally {
        setIsReady(true);
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 500);
      }
    }

    // Only run this if we are not already ready
    if (!isReady) {
      checkInitialState();
    }
  }, [isReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="missions" />
      <Stack.Screen name="freelancers" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="auth-choice" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="register-freelancer" />
      <Stack.Screen name="register-employer" />
      <Stack.Screen name="employer" />
      <Stack.Screen name="freelancer" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  );
}
