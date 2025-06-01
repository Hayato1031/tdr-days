import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}