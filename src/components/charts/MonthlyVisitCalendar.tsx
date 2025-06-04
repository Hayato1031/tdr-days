import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';
import { Visit, ParkType } from '../../types/models';

const { width } = Dimensions.get('window');

interface MonthlyVisitCalendarProps {
  visits: Visit[];
  year: number;
  animationDelay?: number;
  showTitle?: boolean;
}

export const MonthlyVisitCalendar: React.FC<MonthlyVisitCalendarProps> = ({
  visits,
  year,
  animationDelay = 0,
  showTitle = true,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme.mode === 'dark';

  // Calculate visits by month for the given year
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      landCount: 0,
      seaCount: 0,
      total: 0,
    }));

    visits.forEach(visit => {
      const visitDate = new Date(visit.date);
      if (visitDate.getFullYear() === year) {
        const monthIndex = visitDate.getMonth();
        months[monthIndex].total += 1;
        if (visit.parkType === ParkType.LAND) {
          months[monthIndex].landCount += 1;
        } else {
          months[monthIndex].seaCount += 1;
        }
      }
    });

    return months;
  }, [visits, year]);

  // Month names
  const getMonthName = (monthIndex: number) => {
    const monthNames = language === 'ja'
      ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthIndex];
  };

  // Calculate grid dimensions
  const cardWidth = (width - spacing[5] * 2 - spacing[3] * 2) / 3;
  const isTablet = width >= 768;
  const gridColumns = isTablet ? 4 : 3;
  const adjustedCardWidth = isTablet 
    ? (width - spacing[5] * 2 - spacing[3] * 3) / 4
    : cardWidth;

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {year}{language === 'ja' ? '年 月別来園カレンダー' : ' Monthly Visit Calendar'}
        </Text>
      )}
      
      <View style={[
        styles.grid,
        {
          marginHorizontal: -spacing[1],
        }
      ]}>
        {monthlyData.map((data, index) => (
          <View
            key={index}
            style={[
              styles.monthCard,
              {
                width: adjustedCardWidth,
                backgroundColor: isDark
                  ? theme.colors.background.secondary
                  : theme.colors.background.elevated,
                borderColor: data.total > 0 ? colors.purple[200] : colors.utility.borderLight,
                borderWidth: data.total > 0 ? 2 : 1,
              }
            ]}
          >
            <Text style={[
              styles.monthName,
              { 
                color: data.total > 0 
                  ? colors.purple[600] 
                  : theme.colors.text.secondary 
              }
            ]}>
              {getMonthName(data.month)}
            </Text>
            
            <Text style={[
              styles.totalCount,
              { 
                color: data.total > 0 
                  ? theme.colors.text.primary 
                  : theme.colors.text.disabled 
              }
            ]}>
              {data.total}
            </Text>
            
            {data.total > 0 && (
              <View style={styles.parkBreakdown}>
                <Text style={[styles.parkCount, { color: colors.purple[500] }]}>
                  L:{data.landCount}
                </Text>
                <Text style={[styles.parkCount, { color: colors.blue[500] }]}>
                  S:{data.seaCount}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCard: {
    aspectRatio: 1,
    margin: spacing[1],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  totalCount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  parkBreakdown: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  parkCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});