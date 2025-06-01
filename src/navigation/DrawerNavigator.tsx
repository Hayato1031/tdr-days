import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { TabNavigator } from './TabNavigator';

const Drawer = createDrawerNavigator();

// Custom Drawer Content - Revolutionary Design
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.mode === 'dark';
  const insets = useSafeAreaInsets();

  const menuItems = [
    { icon: 'home', label: 'Home', screen: 'MainTabs' },
    { icon: 'map', label: 'Park Map', screen: 'Map' },
    { icon: 'calendar', label: 'Calendar', screen: 'Calendar' },
    { icon: 'heart', label: 'Favorites', screen: 'Favorites' },
    { icon: 'share-social', label: 'Share', screen: 'Share' },
    { icon: 'settings', label: 'Settings', screen: 'Settings' },
  ];

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0a0a0b', '#1a1a2e', '#16213e']
          : ['#faf5ff', '#f3e8ff', '#e9d5ff']
      }
      style={styles.container}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
          <LinearGradient
            colors={['#a855f7', '#9333ea', '#7e22ce']}
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={32} color={colors.utility.white} />
          </LinearGradient>
          <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
            Disney Explorer
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
            explorer@tdrdays.com
          </Text>
        </View>

        {/* Navigation Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.screen === 'MainTabs') {
                  props.navigation.navigate('MainTabs');
                } else {
                  // Navigate to other screens when implemented
                  console.log(`Navigate to ${item.screen}`);
                }
              }}
            >
              <LinearGradient
                colors={
                  props.state.routeNames[props.state.index] === item.screen
                    ? ['rgba(168, 85, 247, 0.2)', 'rgba(147, 51, 234, 0.2)']
                    : ['transparent', 'transparent']
                }
                style={styles.menuItemGradient}
              >
                <View style={styles.menuItemContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      props.state.routeNames[props.state.index] === item.screen &&
                        styles.iconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={
                        props.state.routeNames[props.state.index] === item.screen
                          ? colors.purple[500]
                          : theme.colors.text.secondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      {
                        color:
                          props.state.routeNames[props.state.index] === item.screen
                            ? colors.purple[600]
                            : theme.colors.text.primary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Switcher */}
        <View style={styles.themeSection}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.05)', 'rgba(147, 51, 234, 0.05)']}
            style={styles.themeSwitcher}
          >
            <View style={styles.themeContent}>
              <View style={styles.themeLeft}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={24}
                  color={colors.purple[500]}
                />
                <Text style={[styles.themeLabel, { color: theme.colors.text.primary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.utility.borderLight,
                  true: colors.purple[300],
                }}
                thumbColor={isDark ? colors.purple[500] : colors.utility.white}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={[styles.helpText, { color: theme.colors.text.secondary }]}>
              Help & Support
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(10, 10, 11, 0.8)', '#0a0a0b']
            : ['transparent', 'rgba(250, 245, 255, 0.8)', '#faf5ff']
        }
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </LinearGradient>
  );
};

export const DrawerNavigator = () => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
          backgroundColor: 'transparent',
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerType: 'slide',
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.1)',
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  userEmail: {
    fontSize: 14,
  },
  menuSection: {
    paddingTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  menuItem: {
    marginBottom: spacing[2],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  menuItemGradient: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[8],
  },
  themeSwitcher: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing[3],
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
  },
  helpText: {
    fontSize: 14,
    marginLeft: spacing[2],
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
});