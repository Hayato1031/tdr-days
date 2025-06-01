import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ParkType } from '../types/models';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20 * 2 - 16) / 2;

interface ParkOption {
  type: ParkType;
  name: string;
  fullName: string;
  icon: string;
  color: string[];
  description: string;
  highlights: string[];
}

const PARK_OPTIONS: ParkOption[] = [
  {
    type: ParkType.LAND,
    name: 'ディズニーランド',
    fullName: '東京ディズニーランド',
    icon: 'fort-awesome',
    color: ['#ff6b6b', '#ee5a52', '#ff8787'],
    description: '夢と魔法の王国',
    highlights: ['スペースマウンテン', 'ホーンテッドマンション', 'ビッグサンダーマウンテン'],
  },
  {
    type: ParkType.SEA,
    name: 'ディズニーシー',
    fullName: '東京ディズニーシー',
    icon: 'globe',
    color: ['#4ecdc4', '#45b7b8', '#6c5ce7'],
    description: '冒険とイマジネーションの海',
    highlights: ['センター・オブ・ジ・アース', 'タワー・オブ・テラー', 'ファンタジースプリングス'],
  },
];

interface ParkSelectorProps {
  selectedPark?: ParkType;
  onParkSelect: (park: ParkType) => void;
}

export const ParkSelector: React.FC<ParkSelectorProps> = ({
  selectedPark,
  onParkSelect,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Animation refs for each card
  const landScaleAnim = useRef(new Animated.Value(1)).current;
  const seaScaleAnim = useRef(new Animated.Value(1)).current;
  const landGlowAnim = useRef(new Animated.Value(0)).current;
  const seaGlowAnim = useRef(new Animated.Value(0)).current;
  const selectionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate selection state
    Animated.spring(selectionAnim, {
      toValue: selectedPark ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    // Animate glow based on selection
    if (selectedPark === ParkType.LAND) {
      Animated.parallel([
        Animated.timing(landGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(seaGlowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (selectedPark === ParkType.SEA) {
      Animated.parallel([
        Animated.timing(seaGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(landGlowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(landGlowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(seaGlowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selectedPark]);

  const handleParkSelect = (parkType: ParkType) => {
    // Haptic feedback would go here
    onParkSelect(parkType);
    
    // Create ripple effect
    const scaleAnim = parkType === ParkType.LAND ? landScaleAnim : seaScaleAnim;
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
  };

  const renderParkCard = (park: ParkOption) => {
    const isSelected = selectedPark === park.type;
    const scaleAnim = park.type === ParkType.LAND ? landScaleAnim : seaScaleAnim;
    const glowAnim = park.type === ParkType.LAND ? landGlowAnim : seaGlowAnim;

    return (
      <Animated.View
        key={park.type}
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleParkSelect(park.type)}
          style={styles.card}
        >
          {/* Glow Effect */}
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim,
                shadowColor: park.color[1],
              },
            ]}
          />

          {/* Card Background */}
          <View
            style={[
              styles.cardBackground,
              {
                backgroundColor: isDark
                  ? isSelected
                    ? colors.background.secondary
                    : colors.background.tertiary
                  : isSelected
                  ? colors.utility.white
                  : colors.background.card,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? park.color[1] : colors.utility.borderLight,
              },
            ]}
          >
            <LinearGradient
              colors={
                isSelected
                  ? [...park.color, 'rgba(255, 255, 255, 0.1)']
                  : ['transparent', 'transparent', 'transparent']
              }
              style={styles.cardGradient}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.2)'
                        : `${park.color[1]}20`,
                    },
                  ]}
                >
                  <FontAwesome5
                    name={park.icon as any}
                    size={28}
                    color={isSelected ? colors.utility.white : park.color[1]}
                  />
                </View>
                
                {/* Checkbox - always visible */}
                <View style={styles.checkboxContainer}>
                  <Animated.View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected 
                          ? park.color[1] 
                          : 'transparent',
                        borderColor: isSelected 
                          ? park.color[1] 
                          : theme.colors.text.tertiary,
                        transform: [
                          {
                            scale: selectionAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {isSelected && (
                      <Animated.View
                        style={[
                          styles.checkmark,
                          {
                            opacity: selectionAnim,
                            transform: [
                              {
                                scale: selectionAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.5, 1],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.utility.white}
                        />
                      </Animated.View>
                    )}
                  </Animated.View>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text
                  style={[
                    styles.parkName,
                    {
                      color: isSelected
                        ? colors.text.dark.primary
                        : theme.colors.text.primary,
                    },
                  ]}
                >
                  {park.name}
                </Text>
                
                <Text
                  style={[
                    styles.parkDescription,
                    {
                      color: isSelected
                        ? colors.text.dark.secondary
                        : theme.colors.text.secondary,
                    },
                  ]}
                >
                  {park.description}
                </Text>

                {/* Highlights */}
                <View style={styles.highlightsContainer}>
                  {park.highlights.slice(0, 2).map((highlight, index) => (
                    <View
                      key={index}
                      style={[
                        styles.highlightPill,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(255, 255, 255, 0.2)'
                            : `${park.color[1]}15`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.highlightText,
                          {
                            color: isSelected
                              ? colors.text.dark.primary
                              : park.color[1],
                          },
                        ]}
                      >
                        {highlight}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Floating Elements */}
              {isSelected && (
                <Animated.View
                  style={[
                    styles.floatingElements,
                    {
                      opacity: selectionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.6],
                      }),
                    },
                  ]}
                >
                  {[...Array(3)].map((_, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.floatingDot,
                        {
                          backgroundColor: colors.text.dark.primary,
                          transform: [
                            {
                              translateY: selectionAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -10 - index * 5],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
                </Animated.View>
              )}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        パークを選択
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
        魔法の一日をどちらで始めますか？
      </Text>
      
      <View style={styles.cardsContainer}>
        {PARK_OPTIONS.map(renderParkCard)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardContainer: {
    flex: 1,
    height: 240,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  cardBackground: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.effects.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  parkName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  parkDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightsContainer: {
    gap: 8,
  },
  highlightPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  floatingElements: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 4,
  },
  floatingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
});