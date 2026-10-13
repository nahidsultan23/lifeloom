import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AboutScreen } from '../screens/AboutScreen';
import { GoalDetailScreen } from '../screens/GoalDetailScreen';
import { GoalFormScreen } from '../screens/GoalFormScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LedgerScreen } from '../screens/LedgerScreen';
import { LetterDetailScreen, LetterFormScreen, LettersScreen } from '../screens/LetterScreens';
import { MemoryFormScreen } from '../screens/MemoryFormScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SnapshotScreen } from '../screens/SnapshotScreen';
import { WhatIfDetailScreen, WhatIfFormScreen, WhatIfListScreen } from '../screens/WhatIfScreens';
import { t } from '../strings';
import { useTheme } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Goals: 'target',
  Ledger: 'book-open',
  Letters: 'mail',
  Profile: 'user',
};

function Tabs() {
  const colors = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => <Feather name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.tabs.home }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: t.tabs.goals }} />
      <Tab.Screen name="Ledger" component={LedgerScreen} options={{ title: t.tabs.ledger }} />
      <Tab.Screen name="Letters" component={LettersScreen} options={{ title: t.tabs.letters }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.tabs.profile }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const colors = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="GoalForm" component={GoalFormScreen} options={{ title: t.titles.goalForm }} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: t.titles.goal }} />
      <Stack.Screen name="MemoryForm" component={MemoryFormScreen} options={{ title: t.titles.memoryForm }} />
      <Stack.Screen name="Snapshot" component={SnapshotScreen} options={{ title: t.titles.snapshot }} />
      <Stack.Screen name="WhatIfList" component={WhatIfListScreen} options={{ title: t.titles.whatIf }} />
      <Stack.Screen name="WhatIfForm" component={WhatIfFormScreen} options={{ title: t.titles.whatIfForm }} />
      <Stack.Screen name="WhatIfDetail" component={WhatIfDetailScreen} options={{ title: t.titles.whatIfPath }} />
      <Stack.Screen name="LetterForm" component={LetterFormScreen} options={{ title: t.titles.letterForm }} />
      <Stack.Screen name="LetterDetail" component={LetterDetailScreen} options={{ title: t.titles.letter }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t.titles.notifications }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: t.titles.privacy }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: t.titles.about }} />
    </Stack.Navigator>
  );
}
