import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { TabNavigator } from './TabNavigator';
import { VisitDetailScreen } from '../screens';
import { EditVisitScreen } from '../screens/EditVisitScreen';
import { colors } from '../styles/colors';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.purple[500],
          background: theme.colors.background.primary,
          card: theme.colors.background.card,
          text: theme.colors.text.primary,
          border: theme.colors.utility.borderLight,
          notification: colors.purple[500],
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: theme.colors.background.primary,
          },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
        <Stack.Screen name="EditVisit" component={EditVisitScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};