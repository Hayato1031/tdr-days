import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VisitListScreen } from '../screens/VisitListScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Simple Material Design Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <View style={[
      styles.tabBarContainer,
      {
        backgroundColor: isDark ? theme.colors.background.card : '#ffffff',
        paddingBottom: insets.bottom,
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }
    ]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.6}
            >
              <View style={styles.tabContent}>
                <View style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                ]}>
                  <Ionicons
                    name={options.tabBarIcon}
                    size={24}
                    color={
                      isFocused
                        ? colors.purple[600]
                        : theme.colors.text.secondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? colors.purple[600]
                        : theme.colors.text.secondary,
                      fontWeight: isFocused ? '600' : '500',
                    },
                  ]}
                >
                  {options.tabBarLabel}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const TabNavigator = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: 'home' as any,
        }}
      />
      <Tab.Screen
        name="VisitList"
        component={VisitListScreen}
        options={{
          tabBarLabel: '来園記録',
          tabBarIcon: 'list' as any,
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarLabel: t('nav.record'),
          tabBarIcon: 'add-circle' as any,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: t('nav.analytics'),
          tabBarIcon: 'stats-chart' as any,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: 'person' as any,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 65 : 60,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 2,
  },
  iconContainerActive: {
    // Material design ripple effect could be added here
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
});