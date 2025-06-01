import React, { useState, useRef, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAdaptiveLayout, useResponsive } from '../../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';

interface SidebarLayoutProps {
  children: ReactNode;
  sidebarContent: ReactNode;
  headerContent?: ReactNode;
  style?: ViewStyle;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  sidebarContent,
  headerContent,
  style,
}) => {
  const { theme } = useTheme();
  const { shouldShowSidebar, isCompact } = useAdaptiveLayout();
  const { dimensions, rSpacing, animationDuration } = useResponsive();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarAnimation = useSharedValue(shouldShowSidebar ? 1 : 0);
  const contentAnimation = useSharedValue(1);

  const sidebarWidth = theme.dimensions.sidebar.width;
  const collapsedWidth = theme.dimensions.sidebar.collapsedWidth;
  const headerHeight = theme.dimensions.header.height;

  React.useEffect(() => {
    sidebarAnimation.value = withSpring(shouldShowSidebar && !isCollapsed ? 1 : 0, {
      damping: 20,
      stiffness: 90,
    });
    
    contentAnimation.value = withSpring(1, {
      damping: 20,
      stiffness: 90,
    });
  }, [shouldShowSidebar, isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarStyle = useAnimatedStyle(() => {
    const width = interpolate(
      sidebarAnimation.value,
      [0, 1],
      [collapsedWidth, sidebarWidth]
    );

    const translateX = interpolate(
      sidebarAnimation.value,
      [0, 1],
      [-(sidebarWidth - collapsedWidth), 0]
    );

    return {
      width,
      transform: [{ translateX }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const marginLeft = shouldShowSidebar
      ? interpolate(
          sidebarAnimation.value,
          [0, 1],
          [collapsedWidth, sidebarWidth]
        )
      : 0;

    const scale = interpolate(
      contentAnimation.value,
      [0, 1],
      [0.95, 1]
    );

    return {
      marginLeft,
      transform: [{ scale }],
    };
  });

  if (!shouldShowSidebar) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }, style]}>
        {headerContent && (
          <View
            style={[
              styles.header,
              {
                height: headerHeight,
                backgroundColor: theme.colors.background.elevated,
                borderBottomColor: theme.colors.border.default,
              },
            ]}
          >
            {headerContent}
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }, style]}>
      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: theme.colors.background.elevated,
            borderRightColor: theme.colors.border.default,
            zIndex: theme.zIndex.sticky,
          },
          sidebarStyle,
        ]}
      >
        <LinearGradient
          colors={[
            theme.colors.gradients.purple.start,
            theme.colors.gradients.purple.middle,
            theme.colors.gradients.purple.end,
          ]}
          style={styles.sidebarGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.sidebarHeader}>
          <TouchableOpacity
            onPress={toggleSidebar}
            style={[
              styles.toggleButton,
              {
                backgroundColor: theme.colors.background.primary + '20',
              },
            ]}
          >
            <Ionicons
              name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={theme.colors.text.inverse}
            />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          style={styles.sidebarContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: rSpacing(32) }}
        >
          {sidebarContent}
        </ScrollView>
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.mainContent, contentStyle]}>
        {headerContent && (
          <View
            style={[
              styles.header,
              {
                height: headerHeight,
                backgroundColor: theme.colors.background.elevated,
                borderBottomColor: theme.colors.border.default,
              },
            ]}
          >
            {headerContent}
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
};

// Sidebar Item Component
interface SidebarItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  collapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  onPress,
  active = false,
  collapsed = false,
}) => {
  const { theme } = useTheme();
  const { rSpacing, rFontSize } = useResponsive();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.sidebarItem,
        {
          backgroundColor: active
            ? theme.colors.purple[500] + '20'
            : 'transparent',
          paddingVertical: rSpacing(12),
          paddingHorizontal: rSpacing(16),
        },
      ]}
    >
      <View style={styles.sidebarItemContent}>
        <Ionicons
          name={icon as any}
          size={24}
          color={active ? theme.colors.purple[400] : theme.colors.text.secondary}
        />
        {!collapsed && (
          <Text
            style={[
              styles.sidebarItemLabel,
              {
                color: active ? theme.colors.purple[400] : theme.colors.text.primary,
                fontSize: rFontSize(16),
                marginLeft: rSpacing(12),
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
      {active && (
        <View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: theme.colors.purple[500],
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

// Sidebar Section Component
interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  collapsed?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  collapsed = false,
}) => {
  const { theme } = useTheme();
  const { rSpacing, rFontSize } = useResponsive();

  if (collapsed) {
    return <View style={{ marginVertical: rSpacing(8) }}>{children}</View>;
  }

  return (
    <View style={[styles.sidebarSection, { marginBottom: rSpacing(24) }]}>
      <Text
        style={[
          styles.sidebarSectionTitle,
          {
            color: theme.colors.text.tertiary,
            fontSize: rFontSize(12),
            paddingHorizontal: rSpacing(16),
            marginBottom: rSpacing(8),
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
      },
    }),
  },
  sidebarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.1,
  },
  sidebarHeader: {
    padding: 16,
    alignItems: 'flex-end',
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarSection: {},
  sidebarSectionTitle: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sidebarItem: {
    position: 'relative',
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  sidebarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarItemLabel: {
    flex: 1,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
});

export default SidebarLayout;