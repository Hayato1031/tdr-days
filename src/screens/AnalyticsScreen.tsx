import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';
import { useVisits } from '../hooks/useVisits';
import { useActions } from '../hooks/useActions';
import { useResponsive, useColumns } from '../hooks/useResponsive';
import { ResponsiveContainer, ResponsiveSection, ResponsiveRow } from '../components/layouts/ResponsiveContainer';
import {
  StatsCard,
  SimplePieChart,
  BarChart,
  LineChart,
  HeatMap,
  TopRankingList,
  type SimplePieChartData,
  type BarChartData,
  type LineChartData,
  type HeatMapData,
  type RankingItem,
} from '../components/charts';
import {
  Visit,
  TimelineAction,
  ActionCategory,
  ParkType,
  ParkArea,
  VisitFilter,
  ActionFilter,
  DateRange,
} from '../types/models';

// Period types for analytics
type PeriodType = 'monthly' | 'yearly' | 'all-time' | 'custom';

// Custom date range state
interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

// Specific period selector
interface SpecificPeriod {
  type: 'month' | 'year';
  value: number; // month: 0-11, year: actual year
}

export const AnalyticsScreen = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme.mode === 'dark';
  
  // Add error state for crash handling
  const [hasError, setHasError] = useState(false);
  
  // Error boundary effect
  useEffect(() => {
    const handleError = (error: any) => {
      console.error('Analytics screen error:', error);
      setHasError(true);
    };
    
    // Reset error state when component mounts
    setHasError(false);
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  const { 
    dimensions, 
    breakpoint, 
    rSpacing, 
    rFontSize,
    isBreakpoint,
    layoutConfig 
  } = useResponsive();
  
  // Memoize column calculations to prevent excessive re-renders
  const statsColumns = useMemo(() => {
    if (!breakpoint) return 2; // Fallback
    const config = {
      mobile: 2,
      mobileL: 2,
      tablet: 4,
      laptop: 4,
      desktop: 4,
      desktopL: 4,
      ultraWide: 6,
    };
    return config[breakpoint] || 2;
  }, [breakpoint]);
  
  const chartColumns = useMemo(() => {
    if (!breakpoint) return 1; // Fallback
    const config = {
      mobile: 1,
      mobileL: 1,
      tablet: 2,
      laptop: 3,
      desktop: 3,
      desktopL: 4,
      ultraWide: 4,
    };
    return config[breakpoint] || 1;
  }, [breakpoint]);
  
  // Data hooks
  const {
    visits,
    companions,
    isLoading: visitsLoading,
    getVisitStatistics,
    getFilteredVisits,
  } = useVisits();
  
  const {
    actions,
    isLoading: actionsLoading,
    getActionStatistics,
    getFilteredActions,
  } = useActions();

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('yearly');
  const [specificPeriod, setSpecificPeriod] = useState<SpecificPeriod>({
    type: 'year',
    value: new Date().getFullYear(),
  });
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Responsive states
  const isTabletOrLarger = isBreakpoint('tablet');
  const isLaptopOrLarger = isBreakpoint('laptop');

  const periods: { key: PeriodType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'monthly', label: t('analytics.monthly'), icon: 'calendar' },
    { key: 'yearly', label: t('analytics.yearly'), icon: 'calendar-outline' },
    { key: 'all-time', label: t('analytics.allTime'), icon: 'infinite' },
    { key: 'custom', label: t('analytics.custom'), icon: 'options' },
  ];

  // Loading state
  const isLoading = visitsLoading || actionsLoading;

  // Calculate current period filter
  const currentFilter = useMemo((): { visitFilter?: VisitFilter; actionFilter?: ActionFilter } => {
    let dateRange: DateRange | undefined;

    switch (selectedPeriod) {
      case 'monthly':
        if (specificPeriod.type === 'month') {
          const year = Math.floor(specificPeriod.value / 100);
          const month = specificPeriod.value % 100;
          dateRange = {
            startDate: new Date(year, month, 1),
            endDate: new Date(year, month + 1, 0),
          };
        } else {
          const now = new Date();
          dateRange = {
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          };
        }
        break;
      case 'yearly':
        if (specificPeriod.type === 'year') {
          dateRange = {
            startDate: new Date(specificPeriod.value, 0, 1),
            endDate: new Date(specificPeriod.value, 11, 31),
          };
        } else {
          const now = new Date();
          dateRange = {
            startDate: new Date(now.getFullYear(), 0, 1),
            endDate: new Date(now.getFullYear(), 11, 31),
          };
        }
        break;
      case 'custom':
        dateRange = {
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate,
        };
        break;
      case 'all-time':
      default:
        dateRange = undefined;
        break;
    }

    return {
      visitFilter: dateRange ? { dateRange } : undefined,
      actionFilter: dateRange ? { dateRange } : undefined,
    };
  }, [selectedPeriod, specificPeriod, customDateRange]);

  // Analytics data
  const [visitStats, setVisitStats] = useState<any>(null);
  const [actionStats, setActionStats] = useState<any>(null);

  // Load analytics data with comprehensive error handling
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounted
    
    const loadAnalytics = async () => {
      try {
        // Add timeout protection
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analytics loading timeout')), 10000)
        );
        
        const analyticsPromise = Promise.all([
          getVisitStatistics(currentFilter.visitFilter),
          getActionStatistics(currentFilter.actionFilter),
        ]);
        
        const [visitData, actionData] = await Promise.race([analyticsPromise, timeout]);
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Validate data structure before setting state
          if (visitData && typeof visitData === 'object' && !Array.isArray(visitData)) {
            setVisitStats(visitData);
          } else {
            console.warn('Invalid visit statistics data received:', visitData);
            setVisitStats(null);
          }
          
          if (actionData && typeof actionData === 'object' && !Array.isArray(actionData)) {
            setActionStats(actionData);
          } else {
            console.warn('Invalid action statistics data received:', actionData);
            setActionStats(null);
          }
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        // Only update state if component is still mounted
        if (isMounted) {
          setVisitStats(null);
          setActionStats(null);
          setHasError(true);
        }
      }
    };

    if (!isLoading && getVisitStatistics && getActionStatistics && typeof getVisitStatistics === 'function' && typeof getActionStatistics === 'function') {
      loadAnalytics();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentFilter, isLoading, getVisitStatistics, getActionStatistics]);

  // Statistics cards data
  const statsCards = useMemo(() => {
    if (!visitStats || !actionStats) return [];

    // Add safety checks for all data access
    const safeVisitStats = {
      totalVisits: visitStats?.totalVisits || 0,
      averageVisitDuration: visitStats?.averageVisitDuration || null,
    };

    const safeActionStats = {
      totalActions: actionStats?.totalActions || 0,
      averageActionsPerVisit: actionStats?.averageActionsPerVisit || 0,
      photoCount: actionStats?.photoCount || 0,
    };

    return [
      {
        title: t('analytics.totalVisits'),
        value: safeVisitStats.totalVisits,
        icon: 'calendar' as keyof typeof Ionicons.glyphMap,
        color: colors.purple[500],
        subtitle: selectedPeriod === 'all-time' ? t('analytics.allTime') : t('analytics.thisPeriod'),
      },
      {
        title: t('analytics.totalActions'),
        value: safeActionStats.totalActions,
        icon: 'rocket' as keyof typeof Ionicons.glyphMap,
        color: '#3b82f6',
        subtitle: `${safeActionStats.averageActionsPerVisit.toFixed(1)} ${t('analytics.perVisit')}`,
      },
      {
        title: t('analytics.photosTaken'),
        value: safeActionStats.photoCount,
        icon: 'camera' as keyof typeof Ionicons.glyphMap,
        color: '#22c55e',
        subtitle: t('analytics.memoriesCaptured'),
      },
      {
        title: t('analytics.avgVisitDuration'),
        value: safeVisitStats.averageVisitDuration
          ? `${Math.round(safeVisitStats.averageVisitDuration / 60)}h`
          : 'N/A',
        icon: 'time' as keyof typeof Ionicons.glyphMap,
        color: '#facc15',
        subtitle: t('analytics.hoursPerVisit'),
      },
    ];
  }, [visitStats, actionStats, selectedPeriod, t]);

  // Pie chart data for park visits
  const parkVisitsData = useMemo((): SimplePieChartData[] => {
    if (!visitStats || typeof visitStats.totalVisits !== 'number') return [];

    const totalVisits = visitStats.totalVisits || 0;
    const landVisits = visitStats.landVisits || 0;
    const seaVisits = visitStats.seaVisits || 0;

    const data = [
      {
        label: t('home.tokyoDisneyland'),
        value: landVisits,
        color: colors.purple[500],
        percentage: totalVisits > 0 ? Math.round((landVisits / totalVisits) * 100 * 10) / 10 : 0,
      },
      {
        label: t('home.tokyoDisneysea'),
        value: seaVisits,
        color: '#06b6d4',
        percentage: totalVisits > 0 ? Math.round((seaVisits / totalVisits) * 100 * 10) / 10 : 0,
      },
    ];

    const filteredData = data.filter(item => item.value > 0);
    
    return filteredData;
  }, [visitStats]);

  // Action categories pie chart
  const actionCategoriesData = useMemo((): SimplePieChartData[] => {
    try {
      if (!actionStats || 
          !actionStats.actionsByCategory || 
          typeof actionStats.actionsByCategory !== 'object' ||
          actionStats.actionsByCategory === null) {
        return [];
      }

      const categoryColors = {
        [ActionCategory.ATTRACTION]: colors.purple[500],
        [ActionCategory.RESTAURANT]: '#22c55e',
        [ActionCategory.SHOW]: '#3b82f6',
        [ActionCategory.GREETING]: '#ec4899',
        [ActionCategory.SHOPPING]: '#facc15',
      };

      // Safely get entries with additional validation
      const entries = Object.entries(actionStats.actionsByCategory || {});
      if (!Array.isArray(entries) || entries.length === 0) {
        return [];
      }

      return entries
        .filter(([category, count]) => {
          return category && 
                 typeof category === 'string' && 
                 typeof count === 'number' && 
                 !isNaN(count) && 
                 count > 0;
        })
        .map(([category, count]) => {
          try {
            return {
              label: category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
              value: count as number,
              color: categoryColors[category as ActionCategory] || '#64748b',
            };
          } catch (error) {
            console.warn('Error processing category:', category, error);
            return null;
          }
        })
        .filter(Boolean) // Remove null entries
        .sort((a, b) => (b?.value || 0) - (a?.value || 0));
    } catch (error) {
      console.error('Error in actionCategoriesData:', error);
      return [];
    }
  }, [actionStats]);

  // Top attractions ranking
  const topAttractionsData = useMemo((): RankingItem[] => {
    try {
      if (!actionStats || 
          !actionStats.topAttractions || 
          !Array.isArray(actionStats.topAttractions) ||
          actionStats.topAttractions.length === 0) {
        return [];
      }

      return actionStats.topAttractions
        .filter(attraction => attraction && typeof attraction === 'object')
        .map((attraction: any, index: number) => {
          try {
            const waitTime = attraction?.averageWaitTime;
            return {
              id: attraction?.id || `attraction-${index}`,
              name: attraction?.locationName || 'Unknown',
              value: typeof attraction?.count === 'number' ? attraction.count : 0,
              subtitle: waitTime && typeof waitTime === 'number' && !isNaN(waitTime)
                ? `${Math.round(waitTime)}min avg wait`
                : undefined,
              color: colors.purple[500],
              trend: index < 3 ? 'up' : 'neutral' as const,
            };
          } catch (error) {
            console.warn('Error processing attraction:', attraction, error);
            return null;
          }
        })
        .filter(Boolean); // Remove null entries
    } catch (error) {
      console.error('Error in topAttractionsData:', error);
      return [];
    }
  }, [actionStats]);

  // Top restaurants ranking
  const topRestaurantsData = useMemo((): RankingItem[] => {
    try {
      if (!actionStats || 
          !actionStats.topRestaurants || 
          !Array.isArray(actionStats.topRestaurants) ||
          actionStats.topRestaurants.length === 0) {
        return [];
      }

      return actionStats.topRestaurants
        .filter(restaurant => restaurant && typeof restaurant === 'object')
        .map((restaurant: any, index: number) => {
          try {
            return {
              id: restaurant?.id || `restaurant-${index}`,
              name: restaurant?.locationName || 'Unknown',
              value: typeof restaurant?.count === 'number' ? restaurant.count : 0,
              subtitle: t('analytics.visits'),
              color: '#22c55e',
              trend: index < 3 ? 'up' : 'neutral' as const,
            };
          } catch (error) {
            console.warn('Error processing restaurant:', restaurant, error);
            return null;
          }
        })
        .filter(Boolean); // Remove null entries
    } catch (error) {
      console.error('Error in topRestaurantsData:', error);
      return [];
    }
  }, [actionStats, t]);

  // Area distribution bar chart
  const areaDistributionData = useMemo((): BarChartData[] => {
    if (!actionStats || !actionStats.areaDistribution || !Array.isArray(actionStats.areaDistribution)) {
      return [];
    }

    return actionStats.areaDistribution
      .slice(0, 10) // Top 10 areas
      .map((area: any) => ({
        label: area?.area ? area.area.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown',
        value: area?.visitCount || 0,
        description: area?.timeSpent ? `${Math.round(area.timeSpent / 60)}h spent` : undefined,
      }));
  }, [actionStats]);

  // Visits over time line chart
  const visitsTimelineData = useMemo((): LineChartData[] => {
    try {
      if (!visitStats || typeof visitStats !== 'object') return [];

      if (selectedPeriod === 'yearly' || selectedPeriod === 'all-time') {
        if (!visitStats.visitsByYear || !Array.isArray(visitStats.visitsByYear)) {
          return [];
        }
        return visitStats.visitsByYear
          .filter(item => item && typeof item === 'object')
          .map((item: any) => {
            try {
              return {
                x: item?.year?.toString() || '0',
                y: typeof item?.count === 'number' ? item.count : 0,
                label: item?.year?.toString() || '0',
              };
            } catch (error) {
              console.warn('Error processing year data:', item, error);
              return { x: '0', y: 0, label: '0' };
            }
          });
      } else {
        if (!visitStats.visitsByMonth || !Array.isArray(visitStats.visitsByMonth)) {
          return [];
        }
        return visitStats.visitsByMonth
          .filter(item => item && typeof item === 'object')
          .map((item: any) => {
            try {
              let label = '';
              if (item?.month && typeof item.month === 'string') {
                try {
                  label = new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                } catch (dateError) {
                  label = item.month;
                }
              }
              return {
                x: item?.month || '',
                y: typeof item?.count === 'number' ? item.count : 0,
                label,
              };
            } catch (error) {
              console.warn('Error processing month data:', item, error);
              return { x: '', y: 0, label: '' };
            }
          });
      }
    } catch (error) {
      console.error('Error in visitsTimelineData:', error);
      return [];
    }
  }, [visitStats, selectedPeriod]);

  // Heat map data for visit frequency
  const visitHeatMapData = useMemo((): HeatMapData[] => {
    if (!visits || !Array.isArray(visits)) {
      return [];
    }
    
    return visits.map(visit => ({
      date: new Date(visit?.date || new Date()),
      value: 1, // Each visit counts as 1
      label: `Visit to ${visit?.parkType === ParkType.LAND ? t('park.disneyland') : t('park.disneysea')}`,
      description: visit?.notes || undefined,
    }));
  }, [visits]);

  // Companion analysis
  const companionData = useMemo((): RankingItem[] => {
    if (!visitStats || !visitStats.favoriteCompanions || !Array.isArray(visitStats.favoriteCompanions)) {
      return [];
    }

    return visitStats.favoriteCompanions.map((item: any, index: number) => ({
      id: item?.companion?.id || `companion-${index}`,
      name: item?.companion?.name || 'Unknown',
      value: item?.visitCount || 0,
      subtitle: t('analytics.visitsTogether'),
      color: '#ec4899',
      trend: index < 3 ? 'up' : 'neutral' as const,
    }));
  }, [visitStats]);

  // Export functionality
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Create a simple analytics report
      const report = {
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        stats: {
          totalVisits: visitStats?.totalVisits || 0,
          totalActions: actionStats?.totalActions || 0,
          photoCount: actionStats?.photoCount || 0,
        },
        topAttractions: topAttractionsData.slice(0, 5),
        topRestaurants: topRestaurantsData.slice(0, 5),
      };

      // For now, just show the data in an alert
      const topAttraction = topAttractionsData.length > 0 ? topAttractionsData[0]?.name : 'None';
      const topRestaurant = topRestaurantsData.length > 0 ? topRestaurantsData[0]?.name : 'None';
      
      const summary = `${t('analytics.title')} (${selectedPeriod}):\n\n` +
        `• ${t('analytics.totalVisits')}: ${report.stats.totalVisits}\n` +
        `• ${t('analytics.totalActions')}: ${report.stats.totalActions}\n` +
        `• ${t('analytics.photosTaken')}: ${report.stats.photoCount}\n\n` +
        `${t('analytics.topAttractions')}: ${topAttraction}\n` +
        `${t('analytics.favoriteRestaurants')}: ${topRestaurant}`;
      
      Alert.alert(t('analytics.exportSuccess'), summary);
    } catch (error) {
      Alert.alert(t('analytics.exportError'), t('analytics.exportErrorMessage'));
    } finally {
      setIsExporting(false);
    }
  };

  // Render stat card
  const renderStatCard = (stat: any, index: number) => (
    <StatsCard
      key={index}
      title={stat.title}
      value={stat.value}
      icon={stat.icon}
      color={stat.color}
      subtitle={stat.subtitle}
      animationDelay={index * 100}
    />
  );

  // Render chart component
  const renderChart = (chart: any, index: number) => {
    // Additional safety checks for chart rendering
    if (!chart || typeof chart !== 'object') {
      return null;
    }

    switch (chart.type) {
      case 'pie':
        // Validate pie chart data before rendering
        if (!Array.isArray(chart.data) || chart.data.length === 0) {
          return null;
        }
        
        // Extra validation for PieChart data
        const validPieData = chart.data.filter(item => 
          item &&
          typeof item.value === 'number' &&
          !isNaN(item.value) &&
          item.value > 0 &&
          typeof item.label === 'string' &&
          typeof item.color === 'string'
        );
        
        if (validPieData.length === 0) {
          return null;
        }
        
        try {
          return (
            <SimplePieChart
              key={chart.key || `pie-${index}`}
              data={validPieData}
              title={chart.title || 'Chart'}
              size={isTabletOrLarger ? 280 : 250}
            />
          );
        } catch (error) {
          console.error('Error rendering SimplePieChart:', error);
          return null;
        }
      case 'line':
        return (
          <LineChart
            key={chart.key}
            data={chart.data}
            title={chart.title}
            color={chart.color}
            height={isTabletOrLarger ? 320 : 280}
            animationDelay={chart.delay}
          />
        );
      case 'bar':
        return (
          <BarChart
            key={chart.key}
            data={chart.data}
            title={chart.title}
            orientation="horizontal"
            height={isTabletOrLarger ? 360 : 300}
            animationDelay={chart.delay}
          />
        );
      case 'heatmap':
        return (
          <HeatMap
            key={chart.key}
            data={chart.data}
            title={chart.title}
            color={chart.color}
            animationDelay={chart.delay}
          />
        );
      default:
        return null;
    }
  };

  // Prepare charts data for grid rendering
  const chartsData = useMemo(() => {
    const charts = [];
    
    // Validate and sanitize park visits data before adding to charts
    if (Array.isArray(parkVisitsData) && parkVisitsData.length > 0) {
      const validParkData = parkVisitsData.filter(item => 
        item && 
        typeof item === 'object' && 
        typeof item.value === 'number' && 
        !isNaN(item.value) && 
        item.value > 0 &&
        typeof item.label === 'string' &&
        typeof item.color === 'string'
      );
      
      if (validParkData.length > 0) {
        charts.push({
          key: 'park-visits',
          type: 'pie',
          data: validParkData,
          title: t('analytics.parkVisitsDistribution'),
          delay: 400,
        });
      }
    }
    
    // Validate and sanitize action categories data before adding to charts
    if (Array.isArray(actionCategoriesData) && actionCategoriesData.length > 0) {
      const validActionData = actionCategoriesData.filter(item => 
        item && 
        typeof item === 'object' && 
        typeof item.value === 'number' && 
        !isNaN(item.value) && 
        item.value > 0 &&
        typeof item.label === 'string' &&
        typeof item.color === 'string'
      );
      
      if (validActionData.length > 0) {
        charts.push({
          key: 'action-categories',
          type: 'pie',
          data: validActionData,
          title: t('analytics.activityBreakdown'),
          delay: 600,
        });
      }
    }
    
    if (visitsTimelineData.length > 0) {
      charts.push({
        key: 'visits-timeline',
        type: 'line',
        data: visitsTimelineData,
        title: t('analytics.visitsOverTime'),
        color: colors.purple[500],
        delay: 800,
      });
    }
    
    if (areaDistributionData.length > 0) {
      charts.push({
        key: 'area-distribution',
        type: 'bar',
        data: areaDistributionData,
        title: t('analytics.popularAreas'),
        delay: 1000,
      });
    }
    
    if (visitHeatMapData.length > 0) {
      charts.push({
        key: 'visit-heatmap',
        type: 'heatmap',
        data: visitHeatMapData,
        title: t('analytics.visitCalendar'),
        color: colors.purple[500],
        delay: 1200,
      });
    }
    
    return charts;
  }, [parkVisitsData, actionCategoriesData, visitsTimelineData, areaDistributionData, visitHeatMapData]);

  // Handle error state
  if (hasError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: theme.colors.text.primary, fontSize: 18, marginBottom: 10 }}>
          {t('analytics.error') || 'エラーが発生しました'}
        </Text>
        <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 20 }}>
          {t('analytics.errorMessage') || '分析データの読み込みに失敗しました'}
        </Text>
        <TouchableOpacity
          style={{ 
            backgroundColor: colors.purple[500], 
            paddingHorizontal: 20, 
            paddingVertical: 10, 
            borderRadius: 8 
          }}
          onPress={() => setHasError(false)}
        >
          <Text style={{ color: 'white' }}>
            {t('common.retry') || '再試行'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Early return if necessary dependencies are missing
  if (!t) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <View style={styles.container}>
        <Header 
          title={t('nav.analytics')} 
          onMenuOpen={() => setMenuVisible(true)}
          rightComponent={
            <TouchableOpacity
              onPress={handleExport}
              style={[
                styles.exportButton,
                {
                  backgroundColor: colors.purple.bright + '15',
                  padding: rSpacing(12),
                  borderRadius: rSpacing(12),
                  borderWidth: 1,
                  borderColor: colors.purple.bright + '30',
                }
              ]}
              disabled={isExporting || isLoading}
            >
              <Ionicons
                name={isExporting ? 'hourglass' : 'download'}
                size={20}
                color={colors.purple.bright}
              />
            </TouchableOpacity>
          }
        />
        
        <ResponsiveContainer
          padding={false}
          style={styles.scrollableContent}
        >

      {/* Period Selector */}
      <ResponsiveSection spacing="lg" style={{ marginTop: rSpacing(24) }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: rSpacing(20) }}
        >
          <View style={[styles.periodButtons, { gap: rSpacing(12) }]}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                onPress={() => {
                  setSelectedPeriod(period.key);
                  if (period.key === 'monthly') {
                    setSpecificPeriod({ type: 'month', value: new Date().getFullYear() * 100 + new Date().getMonth() });
                  } else if (period.key === 'yearly') {
                    setSpecificPeriod({ type: 'year', value: new Date().getFullYear() });
                  }
                }}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive,
                  {
                    minWidth: isTabletOrLarger ? 120 : 100,
                    borderRadius: rSpacing(24),
                  }
                ]}
              >
                <LinearGradient
                  colors={
                    selectedPeriod === period.key
                      ? ['#a855f7', '#9333ea']
                      : ['transparent', 'transparent']
                  }
                  style={[
                    styles.periodGradient,
                    {
                      paddingVertical: rSpacing(12),
                      paddingHorizontal: rSpacing(16),
                    }
                  ]}
                >
                  <Ionicons
                    name={period.icon}
                    size={16}
                    color={
                      selectedPeriod === period.key
                        ? colors.text.dark.primary
                        : theme.colors.text.secondary
                    }
                    style={{ marginRight: rSpacing(4) }}
                  />
                  <Text
                    style={[
                      styles.periodText,
                      {
                        color:
                          selectedPeriod === period.key
                            ? colors.text.dark.primary
                            : theme.colors.text.secondary,
                        fontSize: rFontSize(14),
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        {/* Specific Period Selector */}
        {(selectedPeriod === 'monthly' || selectedPeriod === 'yearly') && (
          <View style={[styles.specificPeriodContainer, { paddingHorizontal: rSpacing(20), marginTop: rSpacing(20) }]}>
            {selectedPeriod === 'yearly' && (
              <View style={styles.yearSelector}>
                <TouchableOpacity
                  onPress={() => setSpecificPeriod(prev => ({ ...prev, value: prev.value - 1 }))}
                  style={[styles.periodArrow, { backgroundColor: theme.colors.background.elevated }]}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                
                <View style={[styles.periodDisplay, { backgroundColor: theme.colors.background.elevated }]}>
                  <Text style={[styles.periodDisplayText, { color: theme.colors.text.primary }]}>
                    {specificPeriod.value}年
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => setSpecificPeriod(prev => ({ ...prev, value: prev.value + 1 }))}
                  style={[styles.periodArrow, { backgroundColor: theme.colors.background.elevated }]}
                  disabled={specificPeriod.value >= new Date().getFullYear()}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={specificPeriod.value >= new Date().getFullYear() ? theme.colors.text.disabled : theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              </View>
            )}
            
            {selectedPeriod === 'monthly' && (
              <View style={styles.monthSelector}>
                <TouchableOpacity
                  onPress={() => {
                    const currentYear = Math.floor(specificPeriod.value / 100);
                    const currentMonth = specificPeriod.value % 100;
                    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    setSpecificPeriod({ type: 'month', value: newYear * 100 + newMonth });
                  }}
                  style={[styles.periodArrow, { backgroundColor: theme.colors.background.elevated }]}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                
                <View style={[styles.periodDisplay, { backgroundColor: theme.colors.background.elevated }]}>
                  <Text style={[styles.periodDisplayText, { color: theme.colors.text.primary }]}>
                    {Math.floor(specificPeriod.value / 100)}年{(specificPeriod.value % 100) + 1}月
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => {
                    const currentYear = Math.floor(specificPeriod.value / 100);
                    const currentMonth = specificPeriod.value % 100;
                    const now = new Date();
                    const isCurrentOrFuture = currentYear > now.getFullYear() || 
                      (currentYear === now.getFullYear() && currentMonth >= now.getMonth());
                    
                    if (!isCurrentOrFuture) {
                      const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                      const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                      setSpecificPeriod({ type: 'month', value: newYear * 100 + newMonth });
                    }
                  }}
                  style={[styles.periodArrow, { backgroundColor: theme.colors.background.elevated }]}
                  disabled={(() => {
                    const currentYear = Math.floor(specificPeriod.value / 100);
                    const currentMonth = specificPeriod.value % 100;
                    const now = new Date();
                    return currentYear > now.getFullYear() || 
                      (currentYear === now.getFullYear() && currentMonth >= now.getMonth());
                  })()}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={(() => {
                      const currentYear = Math.floor(specificPeriod.value / 100);
                      const currentMonth = specificPeriod.value % 100;
                      const now = new Date();
                      const isDisabled = currentYear > now.getFullYear() || 
                        (currentYear === now.getFullYear() && currentMonth >= now.getMonth());
                      return isDisabled ? theme.colors.text.disabled : theme.colors.text.secondary;
                    })()}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ResponsiveSection>

      {/* Loading State */}
      {isLoading ? (
        <View style={[styles.loadingContainer, { padding: rSpacing(32) }]}>
          <Text style={[
            styles.loadingText, 
            { 
              color: theme.colors.text.secondary,
              fontSize: rFontSize(16),
            }
          ]}>
            {t('analytics.loading')}
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Cards */}
          <ResponsiveSection spacing="lg">
            <View style={[styles.statsGrid, { paddingHorizontal: rSpacing(20) }]}>
              {statsCards.map((stat, index) => {
                // Safe width calculation with fallbacks
                const safeStatsColumns = Math.max(1, statsColumns || 2);
                const safeDimensionsWidth = Math.max(300, dimensions?.width || 300);
                const safeSpacing = rSpacing ? rSpacing(52) : 52;
                const cardWidth = Math.max(100, (safeDimensionsWidth - safeSpacing) / safeStatsColumns);
                
                // Additional validation
                const finalCardWidth = isNaN(cardWidth) ? 150 : cardWidth;
                
                return (
                  <View key={index} style={[styles.statCardWrapper, { width: finalCardWidth }]}>
                    {renderStatCard(stat, index)}
                  </View>
                );
              })}
            </View>
          </ResponsiveSection>

          {/* Charts Section */}
          <ResponsiveSection spacing="lg">
            <View style={[styles.chartsSection, { paddingHorizontal: rSpacing(20) }]}>
              {chartsData.length > 0 ? (
                chartsData.map((chart, index) => renderChart(chart, index))
              ) : (
                <View style={{ padding: rSpacing(32), alignItems: 'center' }}>
                  <Text style={[{ color: theme.colors.text.secondary, fontSize: rFontSize(16) }]}>
                    {t('analytics.loading')}
                  </Text>
                </View>
              )}
            </View>
          </ResponsiveSection>

          {/* Rankings Section */}
          <ResponsiveSection spacing="lg">
            <View style={[styles.rankingsSection, { paddingHorizontal: rSpacing(20) }]}>
              {/* Top Attractions */}
              {Array.isArray(topAttractionsData) && topAttractionsData.length > 0 && (
                <TopRankingList
                  data={topAttractionsData}
                  title={t('analytics.topAttractions')}
                  limit={10}
                  animationDelay={1400}
                />
              )}

              {/* Top Restaurants */}
              {Array.isArray(topRestaurantsData) && topRestaurantsData.length > 0 && (
                <TopRankingList
                  data={topRestaurantsData}
                  title={t('analytics.favoriteRestaurants')}
                  limit={8}
                  animationDelay={1600}
                />
              )}

              {/* Favorite Companions */}
              {Array.isArray(companionData) && companionData.length > 0 && (
                <TopRankingList
                  data={companionData}
                  title={t('analytics.favoriteCompanions')}
                  limit={6}
                  animationDelay={1800}
                />
              )}
              
              {/* Show message if no ranking data */}
              {(!Array.isArray(topAttractionsData) || topAttractionsData.length === 0) && 
               (!Array.isArray(topRestaurantsData) || topRestaurantsData.length === 0) && 
               (!Array.isArray(companionData) || companionData.length === 0) && (
                <View style={{ padding: rSpacing(32), alignItems: 'center' }}>
                  <Text style={[{ color: theme.colors.text.secondary, fontSize: rFontSize(16) }]}>
                    {t('analytics.loading')}
                  </Text>
                </View>
              )}
            </View>
          </ResponsiveSection>
        </>
      )}

        {/* Bottom spacing */}
        <View style={{ height: rSpacing(100) }} />
        </ResponsiveContainer>
      </View>
      
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </SwipeableScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  exportButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtons: {
    flexDirection: 'row',
  },
  periodButton: {
    overflow: 'hidden',
  },
  periodButtonActive: {
  },
  periodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardWrapper: {
    // Width calculated dynamically
  },
  chartsSection: {
    gap: 24,
  },
  rankingsSection: {
    gap: 24,
  },
  specificPeriodContainer: {
    alignItems: 'center',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  periodArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  periodDisplayText: {
    fontSize: 16,
    fontWeight: '600',
  },
});