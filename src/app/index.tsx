import { useWdkApp } from '@tetherto/wdk-react-native-core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { pricingService } from '../services/pricing-service';
import { colors } from '@/constants/colors';

export default function Index() {
  const { state } = useWdkApp();
  const [isPricingReady, setIsPricingReady] = useState(false);

  useEffect(() => {
    pricingService
      .initialize()
      .catch(console.error)
      .finally(() => setIsPricingReady(true));
  }, []);

  if (state.status === 'INITIALIZING' || !isPricingReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  switch (state.status) {
    case 'NO_WALLET':
      return <Redirect href="/onboarding" />;
    case 'LOCKED':
      return <Redirect href="/authorize" />;
    case 'READY':
      return <Redirect href="/wallet" />;
    case 'ERROR':
      // On error fall through to onboarding so user can recover
      return <Redirect href="/onboarding" />;
    default:
      return <Redirect href="/onboarding" />;
  }
}
