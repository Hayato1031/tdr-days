import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

const { width } = Dimensions.get('window');

interface CalendarPickerProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme.mode === 'dark';
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  const toggleCalendar = () => {
    if (calendarVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setCalendarVisible(false));
    } else {
      setCalendarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
    toggleCalendar();
  };

  const getTodayInJST = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
    return jstTime.toISOString().split('T')[0];
  };

  const getTomorrowInJST = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
    jstTime.setDate(jstTime.getDate() + 1);
    return jstTime.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) {
      return language === 'ja' ? '日付を選択' : 'Select Date';
    }
    
    const todayJST = getTodayInJST();
    const tomorrowJST = getTomorrowInJST();
    
    if (dateString === todayJST) {
      return language === 'ja' ? '今日' : 'Today';
    } else if (dateString === tomorrowJST) {
      return language === 'ja' ? '明日' : 'Tomorrow';
    } else {
      const date = new Date(dateString);
      const locale = language === 'ja' ? 'ja-JP' : 'en-US';
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    }
  };

  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: colors.purple[400],
    textSectionTitleDisabledColor: theme.colors.text.secondary,
    selectedDayBackgroundColor: colors.purple[500],
    selectedDayTextColor: colors.utility.white,
    todayTextColor: colors.purple[600],
    dayTextColor: theme.colors.text.primary,
    textDisabledColor: theme.colors.text.secondary,
    dotColor: colors.purple[500],
    selectedDotColor: colors.utility.white,
    arrowColor: colors.purple[500],
    disabledArrowColor: theme.colors.text.secondary,
    monthTextColor: theme.colors.text.primary,
    indicatorColor: colors.purple[500],
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '500',
    textMonthFontWeight: '700',
    textDayHeaderFontWeight: '600',
    textDayFontSize: 16,
    textMonthFontSize: 20,
    textDayHeaderFontSize: 14,
    'stylesheet.calendar.header': {
      week: {
        marginTop: spacing[2],
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing[3],
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderRadius: borderRadius.xl,
        marginBottom: spacing[4],
      },
    },
    'stylesheet.day.basic': {
      base: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        marginVertical: spacing[1],
      },
      selected: {
        backgroundColor: colors.purple[500],
        borderRadius: 18,
        shadowColor: colors.purple[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      today: {
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        borderRadius: 18,
      },
    },
  };

  return (
    <View style={styles.container}>
      {/* Date Selector Button */}
      <TouchableOpacity
        onPress={toggleCalendar}
        style={[
          styles.dateButton,
          {
            backgroundColor: isDark
              ? theme.colors.background.secondary
              : theme.colors.background.elevated,
          },
        ]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            selectedDate
              ? ['rgba(168, 85, 247, 0.1)', 'rgba(147, 51, 234, 0.1)']
              : ['transparent', 'transparent']
          }
          style={styles.dateButtonGradient}
        >
          <View style={styles.dateButtonContent}>
            <Ionicons
              name="calendar"
              size={24}
              color={selectedDate ? colors.purple[500] : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.dateButtonText,
                {
                  color: selectedDate
                    ? colors.purple[600]
                    : theme.colors.text.secondary,
                  fontWeight: selectedDate ? '600' : '500',
                },
              ]}
            >
              {formatDisplayDate(selectedDate)}
            </Text>
            <Ionicons
              name={calendarVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text.secondary}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleCalendar}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleCalendar}
        >
          <Animated.View
            style={[
              styles.calendarContainer,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                  {
                    scale: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[
                styles.calendarWrapper,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.utility.border,
                }
              ]}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: theme.colors.text.primary }]}>
                    {language === 'ja' ? '日付を選択' : 'Select Date'}
                  </Text>
                  <TouchableOpacity
                    onPress={toggleCalendar}
                    style={styles.calendarCloseButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                  <Calendar
                    style={styles.calendar}
                    theme={calendarTheme}
                    current={selectedDate || new Date().toISOString().split('T')[0]}
                    onDayPress={handleDayPress}
                    markedDates={
                      selectedDate
                        ? {
                            [selectedDate]: {
                              selected: true,
                              disableTouchEvent: false,
                              selectedColor: colors.purple[500],
                              selectedTextColor: colors.utility.white,
                            },
                          }
                        : undefined
                    }
                    minDate={minDate}
                    maxDate={maxDate}
                    enableSwipeMonths={true}
                    hideArrows={false}
                    hideExtraDays={true}
                    disableMonthChange={false}
                    firstDay={0}
                    hideDayNames={false}
                    showWeekNumbers={false}
                    disableArrowLeft={false}
                    disableArrowRight={false}
                    disableAllTouchEventsForDisabledDays={true}
                    renderArrow={(direction) => (
                      <View style={styles.arrowContainer}>
                        <Ionicons
                          name={
                            direction === 'left' ? 'chevron-back' : 'chevron-forward'
                          }
                          size={24}
                          color={colors.purple[500]}
                        />
                      </View>
                    )}
                  />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  dateButton: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.utility.border,
    backgroundColor: colors.background.card,
    shadowColor: colors.effects.shadowSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButtonGradient: {
    padding: spacing[4],
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
    marginLeft: spacing[3],
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 400,
  },
  calendarWrapper: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    shadowColor: colors.effects.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.utility.borderLight,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarCloseButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  calendar: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[4],
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});