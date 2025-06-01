import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ParkArea, LandArea, SeaArea, ParkType } from '../types/models';

const { width: screenWidth } = Dimensions.get('window');

interface AreaPickerProps {
  parkType: ParkType;
  selectedArea?: ParkArea;
  onSelect: (area: ParkArea) => void;
  disabled?: boolean;
  style?: any;
}

interface AreaInfo {
  area: ParkArea;
  displayName: string;
  description: string;
  color: string;
  gradient: string[];
  icon: string;
  emoji: string;
  isNew?: boolean;
}

export const AreaPicker: React.FC<AreaPickerProps> = ({
  parkType,
  selectedArea,
  onSelect,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const [expandedArea, setExpandedArea] = useState<ParkArea | null>(null);
  const scaleAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const fadeAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Area configurations with rich metadata
  const landAreas: AreaInfo[] = [
    {
      area: LandArea.WORLD_BAZAAR,
      displayName: 'World Bazaar',
      description: 'Victorian charm & shopping',
      color: colors.blue[500],
      gradient: [colors.blue[400], colors.blue[600]],
      icon: 'storefront',
      emoji: '🏪',
    },
    {
      area: LandArea.ADVENTURELAND,
      displayName: 'Adventureland',
      description: 'Tropical adventures await',
      color: colors.green[500],
      gradient: [colors.green[400], colors.green[600]],
      icon: 'compass',
      emoji: '🌴',
    },
    {
      area: LandArea.WESTERNLAND,
      displayName: 'Westernland',
      description: 'Wild west frontier',
      color: colors.orange[500],
      gradient: [colors.orange[400], colors.orange[600]],
      icon: 'trending-up',
      emoji: '🤠',
    },
    {
      area: LandArea.CRITTER_COUNTRY,
      displayName: 'Critter Country',
      description: 'Forest friends & honey',
      color: colors.amber[500],
      gradient: [colors.amber[400], colors.amber[600]],
      icon: 'leaf',
      emoji: '🐻',
    },
    {
      area: LandArea.FANTASYLAND,
      displayName: 'Fantasyland',
      description: 'Where dreams come true',
      color: colors.pink[500],
      gradient: [colors.pink[400], colors.pink[600]],
      icon: 'star',
      emoji: '🏰',
      isNew: true,
    },
    {
      area: LandArea.TOONTOWN,
      displayName: 'Toontown',
      description: 'Colorful cartoon world',
      color: colors.purple[500],
      gradient: [colors.purple[400], colors.purple[600]],
      icon: 'happy',
      emoji: '🎭',
    },
    {
      area: LandArea.TOMORROWLAND,
      displayName: 'Tomorrowland',
      description: 'Future adventures',
      color: colors.cyan[500],
      gradient: [colors.cyan[400], colors.cyan[600]],
      icon: 'rocket',
      emoji: '🚀',
    },
  ];

  const seaAreas: AreaInfo[] = [
    {
      area: SeaArea.MEDITERRANEAN_HARBOR,
      displayName: 'Mediterranean Harbor',
      description: 'Italian romance & elegance',
      color: colors.blue[500],
      gradient: [colors.blue[400], colors.blue[600]],
      icon: 'boat',
      emoji: '🏛️',
    },
    {
      area: SeaArea.AMERICAN_WATERFRONT,
      displayName: 'American Waterfront',
      description: '1900s New York charm',
      color: colors.indigo[500],
      gradient: [colors.indigo[400], colors.indigo[600]],
      icon: 'business',
      emoji: '🗽',
    },
    {
      area: SeaArea.PORT_DISCOVERY,
      displayName: 'Port Discovery',
      description: 'Scientific exploration',
      color: colors.teal[500],
      gradient: [colors.teal[400], colors.teal[600]],
      icon: 'telescope',
      emoji: '🔬',
    },
    {
      area: SeaArea.LOST_RIVER_DELTA,
      displayName: 'Lost River Delta',
      description: 'Ancient mysteries',
      color: colors.green[500],
      gradient: [colors.green[400], colors.green[600]],
      icon: 'search',
      emoji: '🏺',
    },
    {
      area: SeaArea.ARABIAN_COAST,
      displayName: 'Arabian Coast',
      description: 'Middle Eastern magic',
      color: colors.orange[500],
      gradient: [colors.orange[400], colors.orange[600]],
      icon: 'library',
      emoji: '🕌',
    },
    {
      area: SeaArea.MERMAID_LAGOON,
      displayName: 'Mermaid Lagoon',
      description: 'Underwater kingdom',
      color: colors.cyan[500],
      gradient: [colors.cyan[400], colors.cyan[600]],
      icon: 'water',
      emoji: '🧜‍♀️',
    },
    {
      area: SeaArea.MYSTERIOUS_ISLAND,
      displayName: 'Mysterious Island',
      description: 'Volcanic adventure',
      color: colors.red[500],
      gradient: [colors.red[400], colors.red[600]],
      icon: 'flame',
      emoji: '🌋',
    },
    {
      area: SeaArea.FANTASY_SPRINGS,
      displayName: 'Fantasy Springs',
      description: 'Frozen, Tangled & Peter Pan',
      color: colors.purple[500],
      gradient: [colors.purple[400], colors.purple[600]],
      icon: 'snow',
      emoji: '❄️',
      isNew: true,
    },
  ];

  const areas = parkType === ParkType.LAND ? landAreas : seaAreas;

  // Initialize animations
  useEffect(() => {
    areas.forEach(area => {
      if (!scaleAnimations[area.area]) {
        scaleAnimations[area.area] = new Animated.Value(1);
      }
      if (!fadeAnimations[area.area]) {
        fadeAnimations[area.area] = new Animated.Value(1);
      }
    });
  }, [areas]);

  const handleAreaPress = (areaInfo: AreaInfo) => {
    if (disabled) return;

    // Animate selection
    const scaleAnim = scaleAnimations[areaInfo.area];
    
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onSelect(areaInfo.area);
  };

  const handleAreaLongPress = (areaInfo: AreaInfo) => {
    setExpandedArea(expandedArea === areaInfo.area ? null : areaInfo.area);
  };

  const renderAreaCard = (areaInfo: AreaInfo, index: number) => {
    const isSelected = selectedArea === areaInfo.area;
    const isExpanded = expandedArea === areaInfo.area;
    const scaleAnim = scaleAnimations[areaInfo.area] || new Animated.Value(1);
    const fadeAnim = fadeAnimations[areaInfo.area] || new Animated.Value(1);

    return (
      <Animated.View
        key={areaInfo.area}
        style={[
          styles.areaCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleAreaPress(areaInfo)}
          onLongPress={() => handleAreaLongPress(areaInfo)}
          disabled={disabled}
          activeOpacity={0.8}
          style={[
            styles.areaButton,
            {
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={isSelected ? areaInfo.gradient : [
              theme.colors.background.elevated,
              theme.colors.background.elevated,
            ]}
            style={[
              styles.areaGradient,
              {
                borderColor: isSelected ? areaInfo.color : theme.colors.border,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.areaHeader}>
              <View style={styles.areaIconContainer}>
                <Text style={styles.areaEmoji}>{areaInfo.emoji}</Text>
                <Ionicons
                  name={areaInfo.icon as any}
                  size={16}
                  color={isSelected ? 'white' : areaInfo.color}
                  style={styles.areaIcon}
                />
              </View>
              
              {areaInfo.isNew && (
                <View style={[styles.newBadge, { backgroundColor: colors.green[500] }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.areaContent}>
              <Text
                style={[
                  styles.areaTitle,
                  {
                    color: isSelected ? 'white' : theme.colors.text.primary,
                  },
                ]}
                numberOfLines={2}
              >
                {areaInfo.displayName}
              </Text>
              
              <Text
                style={[
                  styles.areaDescription,
                  {
                    color: isSelected ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary,
                  },
                ]}
                numberOfLines={2}
              >
                {areaInfo.description}
              </Text>
            </View>

            {/* Selection indicator */}
            {isSelected && (
              <View style={styles.selectionIndicator}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="white"
                />
              </View>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <Animated.View style={styles.expandedContent}>
                <BlurView intensity={20} style={styles.expandedBlur}>
                  <Text style={[styles.expandedText, { color: theme.colors.text.primary }]}>
                    Tap to select this area for your action
                  </Text>
                </BlurView>
              </Animated.View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Select Area in {parkType === ParkType.LAND ? 'Disneyland' : 'DisneySea'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
          Choose the area where your activity takes place
        </Text>
      </View>

      <ScrollView
        style={styles.areasContainer}
        contentContainerStyle={styles.areasContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.areasGrid}>
          {areas.map((areaInfo, index) => renderAreaCard(areaInfo, index))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  areasContainer: {
    flex: 1,
  },
  areasContent: {
    padding: spacing[4],
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  areaCard: {
    width: (screenWidth - spacing[4] * 2 - spacing[3]) / 2,
    marginBottom: spacing[3],
  },
  areaButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  areaGradient: {
    position: 'relative',
    minHeight: 120,
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    justifyContent: 'space-between',
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  areaIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaEmoji: {
    fontSize: 20,
    marginRight: spacing[1],
  },
  areaIcon: {
    opacity: 0.8,
  },
  newBadge: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  areaContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  areaTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing[1],
    lineHeight: 18,
  },
  areaDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  selectionIndicator: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 2,
  },
  expandedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  expandedBlur: {
    padding: spacing[2],
  },
  expandedText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});