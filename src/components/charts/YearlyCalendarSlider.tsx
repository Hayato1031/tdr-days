import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';
import { MonthlyVisitCalendar } from './MonthlyVisitCalendar';
import { Visit } from '../../types/models';

const { width } = Dimensions.get('window');

interface YearlyCalendarSliderProps {
  visits: Visit[];
  animationDelay?: number;
}

export const YearlyCalendarSlider: React.FC<YearlyCalendarSliderProps> = ({
  visits,
  animationDelay = 0,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get years with visits
  const yearsWithVisits = React.useMemo(() => {
    if (!visits || !Array.isArray(visits)) return [];
    
    const years = new Set<number>();
    visits.forEach(visit => {
      if (visit?.date) {
        const year = new Date(visit.date).getFullYear();
        if (!isNaN(year)) {
          years.add(year);
        }
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [visits]);

  useEffect(() => {
    // Start fade in animation
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  if (yearsWithVisits.length === 0) {
    return null;
  }

  const currentYear = yearsWithVisits[currentYearIndex];

  const handlePrevYear = () => {
    if (currentYearIndex < yearsWithVisits.length - 1) {
      setCurrentYearIndex(currentYearIndex + 1);
    }
  };

  const handleNextYear = () => {
    if (currentYearIndex > 0) {
      setCurrentYearIndex(currentYearIndex - 1);
    }
  };

  const handleYearSelect = (yearIndex: number) => {
    setCurrentYearIndex(yearIndex);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        {language === 'ja' ? '年別来園カレンダー' : 'Yearly Visit Calendar'}
      </Text>
      
      {/* Year Navigation */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigation}>
          <TouchableOpacity
            onPress={handlePrevYear}
            style={[
              styles.navButton,
              {
                backgroundColor: theme.colors.background.elevated,
                opacity: currentYearIndex >= yearsWithVisits.length - 1 ? 0.5 : 1,
              }
            ]}
            disabled={currentYearIndex >= yearsWithVisits.length - 1}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          
          <View style={[styles.yearDisplay, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.yearText, { color: theme.colors.text.primary }]}>
              {currentYear}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleNextYear}
            style={[
              styles.navButton,
              {
                backgroundColor: theme.colors.background.elevated,
                opacity: currentYearIndex <= 0 ? 0.5 : 1,
              }
            ]}
            disabled={currentYearIndex <= 0}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Year selector dots */}
      {yearsWithVisits.length > 1 && (
        <View style={styles.yearSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearSelectorContent}
          >
            {yearsWithVisits.map((year, index) => (
              <TouchableOpacity
                key={year}
                onPress={() => handleYearSelect(index)}
                style={[
                  styles.yearDot,
                  {
                    backgroundColor: index === currentYearIndex
                      ? colors.purple[500]
                      : theme.colors.background.secondary,
                    borderColor: index === currentYearIndex
                      ? colors.purple[500]
                      : theme.colors.text.disabled,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.yearDotText,
                    {
                      color: index === currentYearIndex
                        ? colors.utility.white
                        : theme.colors.text.secondary,
                    }
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <MonthlyVisitCalendar
          visits={visits}
          year={currentYear}
          animationDelay={0}
          showTitle={false}
        />
      </View>

      {/* Statistics for current year */}
      <View style={styles.yearStats}>
        {(() => {
          const yearVisits = visits.filter(visit => {
            const visitYear = new Date(visit.date).getFullYear();
            return visitYear === currentYear;
          });
          
          const landCount = yearVisits.filter(v => v.parkType === 'LAND').length;
          const seaCount = yearVisits.filter(v => v.parkType === 'SEA').length;
          
          return (
            <View style={[styles.statsRow, { backgroundColor: theme.colors.background.elevated }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.purple[500] }]}>
                  {yearVisits.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '総来園数' : 'Total Visits'}
                </Text>
              </View>
              
              <View style={[styles.statDivider, { backgroundColor: colors.utility.borderLight }]} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.purple[500] }]}>
                  {landCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? 'ランド' : 'Disneyland'}
                </Text>
              </View>
              
              <View style={[styles.statDivider, { backgroundColor: colors.utility.borderLight }]} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.blue[500] }]}>
                  {seaCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? 'シー' : 'DisneySea'}
                </Text>
              </View>
            </View>
          );
        })()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  navigationContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearDisplay: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  yearText: {
    fontSize: 18,
    fontWeight: '600',
  },
  yearSelector: {
    marginBottom: spacing[4],
  },
  yearSelectorContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  yearDot: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  yearDotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarContainer: {
    marginBottom: spacing[4],
  },
  yearStats: {
    marginTop: spacing[2],
  },
  statsRow: {
    flexDirection: 'row',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});