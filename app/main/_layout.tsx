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
        tabBarItemStyle: styles.item,
        tabBarStyle: styles.tabBar,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="health" options={{ title: 'Health', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} /> }} />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.askIcon, focused && styles.askIconFocused]}>
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={focused ? colors.surface : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="journey" options={{ title: 'Journey', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
  tabBar: {
    minHeight: 74,
    paddingTop: 8,
    paddingBottom: 9,
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    paddingVertical: 2,
  },
  label: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: '800',
  },
  askIcon: {
    width: 42,
    height: 42,
    marginTop: -9,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rosePale,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askIconFocused: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
});
