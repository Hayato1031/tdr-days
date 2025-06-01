import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive, useAdaptiveLayout } from '../../hooks/useResponsive';

interface TabletNavigationProps {
  tabs: Array<{
    key: string;
    label: string;
    icon: string;
    component: React.ComponentType<any>;
  }>;
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  style?: ViewStyle;
}

export const TabletNavigation: React.FC<TabletNavigationProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  style,
}) => {
  const { theme } = useTheme();
  const { dimensions, rSpacing, rFontSize, breakpoint } = useResponsive();
  const { navigationPosition } = useAdaptiveLayout();
  
  const [activeTab, setActiveTab] = useState(controlledActiveTab || tabs[0]?.key);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabRefs = useRef<Record<string, View | null>>({});
  
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const isTopNavigation = navigationPosition === 'top';
  const navigationHeight = theme.dimensions.navigation.height;

  const handleTabPress = (tabKey: string, index: number) => {
    const newTab = tabKey;
    setActiveTab(newTab);
    onTabChange?.(newTab);

    // Animate indicator
    const tabRef = tabRefs.current[tabKey];
    if (tabRef) {
      tabRef.measure((x, y, width, height, pageX, pageY) => {
        indicatorPosition.value = withSpring(pageX, {
          damping: 20,
          stiffness: 90,
        });
        indicatorWidth.value = withSpring(width, {
          damping: 20,
          stiffness: 90,
        });
      });
    }

    // Scroll to tab if needed
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * 150 - dimensions.width / 2 + 75,
        animated: true,
      });
    }
  };

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
      width: indicatorWidth.value,
    };
  });

  const activeTabData = tabs.find(tab => tab.key === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }, style]}>
      {/* Navigation Bar */}
      <View
        style={[
          styles.navigationBar,
          isTopNavigation ? styles.topNavigation : styles.bottomNavigation,
          {
            height: navigationHeight,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.background.elevated,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={95}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsContainer,
            { paddingHorizontal: rSpacing(16) },
          ]}
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              ref={(ref) => (tabRefs.current[tab.key] = ref as any)}
              onPress={() => handleTabPress(tab.key, index)}
              style={[
                styles.tab,
                {
                  paddingHorizontal: rSpacing(20),
                  paddingVertical: rSpacing(12),
                },
              ]}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={tab.icon as any}
                  size={24}
                  color={
                    activeTab === tab.key
                      ? theme.colors.purple[500]
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color:
                        activeTab === tab.key
                          ? theme.colors.purple[500]
                          : theme.colors.text.secondary,
                      fontSize: rFontSize(14),
                      marginLeft: rSpacing(8),
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Tab Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            isTopNavigation ? styles.indicatorTop : styles.indicatorBottom,
            indicatorStyle,
          ]}
        >
          <LinearGradient
            colors={[
              theme.colors.gradients.purple.start,
              theme.colors.gradients.purple.end,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>
      </View>

      {/* Content */}
      <View style={[styles.content, isTopNavigation && { paddingTop: navigationHeight }]}>
        {ActiveComponent && <ActiveComponent />}
      </View>
    </View>
  );
};

// Floating Tab Bar for tablets
interface FloatingTabBarProps {
  tabs: Array<{
    key: string;
    label: string;
    icon: string;
  }>;
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const { theme } = useTheme();
  const { rSpacing, rFontSize } = useResponsive();

  return (
    <View style={[styles.floatingContainer, { bottom: rSpacing(32) }]}>
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: theme.colors.background.elevated,
            borderColor: theme.colors.border.default,
            paddingHorizontal: rSpacing(8),
            paddingVertical: rSpacing(4),
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={[
                styles.floatingTab,
                {
                  backgroundColor: isActive
                    ? theme.colors.purple[500]
                    : 'transparent',
                  paddingHorizontal: rSpacing(16),
                  paddingVertical: rSpacing(10),
                },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={isActive ? '#FFFFFF' : theme.colors.text.secondary}
              />
              {isActive && (
                <Text
                  style={[
                    styles.floatingTabLabel,
                    {
                      color: '#FFFFFF',
                      fontSize: rFontSize(13),
                      marginLeft: rSpacing(6),
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Split View Navigation for larger tablets
interface SplitViewNavigationProps {
  masterView: React.ReactNode;
  detailView: React.ReactNode;
  masterWidth?: number;
}

export const SplitViewNavigation: React.FC<SplitViewNavigationProps> = ({
  masterView,
  detailView,
  masterWidth = 320,
}) => {
  const { theme } = useTheme();
  const { dimensions } = useResponsive();
  const [isMasterCollapsed, setIsMasterCollapsed] = useState(false);
  
  const masterAnimation = useSharedValue(1);
  
  const toggleMaster = () => {
    setIsMasterCollapsed(!isMasterCollapsed);
    masterAnimation.value = withSpring(isMasterCollapsed ? 1 : 0, {
      damping: 20,
      stiffness: 90,
    });
  };
  
  const masterStyle = useAnimatedStyle(() => {
    const width = interpolate(
      masterAnimation.value,
      [0, 1],
      [0, masterWidth]
    );
    
    return { width };
  });

  return (
    <View style={styles.splitContainer}>
      <Animated.View
        style={[
          styles.masterView,
          {
            backgroundColor: theme.colors.background.secondary,
            borderRightColor: theme.colors.border.default,
          },
          masterStyle,
        ]}
      >
        {masterView}
      </Animated.View>
      
      <View style={styles.detailView}>
        <TouchableOpacity
          onPress={toggleMaster}
          style={[
            styles.toggleMasterButton,
            {
              backgroundColor: theme.colors.background.elevated,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <Ionicons
            name={isMasterCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={20}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        {detailView}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  topNavigation: {
    top: 0,
    borderBottomWidth: 1,
  },
  bottomNavigation: {
    bottom: 0,
    borderTopWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabel: {
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    height: 3,
  },
  indicatorTop: {
    bottom: 0,
  },
  indicatorBottom: {
    top: 0,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  
  // Floating Tab Bar
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingBar: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
  },
  floatingTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  floatingTabLabel: {
    fontWeight: '600',
  },
  
  // Split View
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  masterView: {
    borderRightWidth: 1,
  },
  detailView: {
    flex: 1,
    position: 'relative',
  },
  toggleMasterButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default TabletNavigation;