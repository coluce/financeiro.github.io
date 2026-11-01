import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { COLORS } from "@/lib/budget-store";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.moss,
        tabBarInactiveTintColor: COLORS.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
        tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: COLORS.paper, borderTopColor: COLORS.line, borderTopWidth: 1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Visão geral", tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="transactions" options={{ title: "Movimentações", tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="budgets" options={{ title: "Orçamentos", tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes", tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
