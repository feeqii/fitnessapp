import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, MainTabParamList } from '../types';
import { colors } from '../constants/theme';

// Screens (will create these next)
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import PhotoPreviewScreen from '../screens/PhotoPreviewScreen';
import ProgressScreen from '../screens/ProgressScreen';
import TimelapseScreen from '../screens/TimelapseScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Timelapse') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[400],
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <MainTab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
      <MainTab.Screen 
        name="Camera" 
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            (navigation as any).navigate('Camera', { angle: 'front' });
          },
        })}
        options={{ 
          title: 'Camera',
          tabBarButton: (props) => (
            <TabBarCameraButton {...props} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Timelapse" 
        component={TimelapseScreen}
        options={{ title: 'Timelapse' }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </MainTab.Navigator>
  );
}

// Custom camera button component for the tab bar
function TabBarCameraButton({ onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        top: -10,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.primary[500],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Ionicons 
        name={focused ? 'camera' : 'camera-outline'} 
        size={30} 
        color="white" 
      />
    </TouchableOpacity>
  );
}

export default function AppNavigator() {
  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.primary[500],
            background: colors.background,
            card: colors.surface,
            text: colors.text.primary,
            border: colors.border,
            notification: colors.primary[500],
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: 'normal',
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500',
            },
            bold: {
              fontFamily: 'System',
              fontWeight: 'bold',
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '800',
            },
          },
        }}
      >
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: colors.background },
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          {/* TODO: Add conditional rendering based on onboarding status */}
          <RootStack.Screen name="Welcome" component={WelcomeScreen} />
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <RootStack.Screen 
            name="PhotoPreview" 
            component={PhotoPreviewScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <RootStack.Screen 
            name="Timelapse" 
            component={TimelapseScreen}
            options={{
              presentation: 'modal',
            }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </>
  );
}
