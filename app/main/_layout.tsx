import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

export default function JananiMainLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.roseDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.askIcon, focused && styles.askIconFocused]}>
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={22}
                color={focused ? colors.surface : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
  tabBar: {
    minHeight: 70,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  askIcon: {
    width: 38,
    height: 38,
    marginTop: -6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askIconFocused: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
});
