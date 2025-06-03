import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, AppState, AppStateStatus, Image, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ProfileSetupModal } from './src/components/ProfileSetupModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { profileService, UserProfile } from './src/services/profileService';
import { colors } from './src/styles/colors';

export default function App() {
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    console.log('App initialization started');
    
    // Start fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Monitor app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed to:', nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start profile check immediately
    checkProfile();

    return () => {
      subscription.remove();
    };
  }, []);

  const checkProfile = async () => {
    try {
      console.log('Checking profile...');
      const hasProfile = await profileService.hasProfile();
      console.log('Has profile:', hasProfile);
      
      if (!hasProfile) {
        setShowProfileSetup(true);
      } else {
        const profile = await profileService.getProfile();
        console.log('Profile loaded:', profile?.name);
        setCurrentProfile(profile);
      }
    } catch (error) {
      console.error('Profile service error:', error);
      setInitError(String(error));
      // Continue without profile for now
    } finally {
      console.log('Profile check completed');
      setIsProfileChecked(true);
    }
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setCurrentProfile(profile);
    setShowProfileSetup(false);
  };

  // Show loading screen only during profile check
  if (!isProfileChecked) {
    return (
      <LinearGradient
        colors={[colors.purple[500], colors.orange[500]]}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar style="light" />
        <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>
            <Image
              source={require('./assets/icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.loadingText}>TDR Days</Text>
          <Text style={styles.subText}>マジカルな一日を記録しよう</Text>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          {initError && (
            <Text style={styles.errorText}>Error: {initError}</Text>
          )}
        </Animated.View>
      </LinearGradient>
    );
  }

  console.log('Rendering main app');
  
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LanguageProvider>
            <ThemeProvider>
              <View style={{ flex: 1 }}>
                <AppNavigator />
                <ProfileSetupModal
                  visible={showProfileSetup}
                  onComplete={handleProfileComplete}
                />
                <StatusBar style="auto" />
              </View>
            </ThemeProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  appIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 32,
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});