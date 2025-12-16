import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koala.ai',
  appName: 'Koala.ai',
  webDir: 'out',
  // Production - use Vercel deployment
  server: {
    url: 'https://koala-ai-client.vercel.app',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#6366f1',
    },
  },
  ios: {
    contentInset: 'never',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
