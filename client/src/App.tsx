import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { config, isApiConfigured } from './config';
import { Notice } from './components/molecules/Notice';
import { LoadingState } from './components/molecules/StateViews';
import { ScreenTemplate } from './components/templates/ScreenTemplate';
import { RootNavigator } from './navigation/RootNavigator';
import { RequiredUpdateScreen } from './screens/RequiredUpdateScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { AuthProvider, useAuth } from './state/AuthContext';
import { UpdateProvider, useUpdates } from './state/UpdateContext';
import { t } from './strings';
import { useTheme } from './theme';

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(
    () => NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false)),
    [],
  );
  if (!offline) return null;
  return (
    <SafeAreaView edges={['top']}>
      <View style={{ padding: 8 }}>
        <Notice icon="wifi-off" message={t.errors.offlineBanner} />
      </View>
    </SafeAreaView>
  );
}

function Gate() {
  const { status } = useAuth();
  const { required, recheck } = useUpdates();
  const colors = useTheme();
  const scheme = useColorScheme();

  // A known unsupported version blocks everything, signed in or not.
  if (required) return <RequiredUpdateScreen policy={required} onRecheck={() => void recheck()} />;

  if (!isApiConfigured) {
    return (
      <ScreenTemplate edges={['top', 'bottom', 'left', 'right']}>
        <Notice icon="settings" message={t.errors.notConfigured(config.variant)} />
      </ScreenTemplate>
    );
  }

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <LoadingState />
      </View>
    );
  }

  if (status === 'signedOut') return <WelcomeScreen />;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      theme={{
        ...base,
        colors: { ...base.colors, background: colors.background, card: colors.background, text: colors.text, border: colors.border, primary: colors.accentText },
      }}
    >
      <OfflineBanner />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <UpdateProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </UpdateProvider>
    </SafeAreaProvider>
  );
}
