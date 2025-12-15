import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koala.ai',
  appName: 'Koala.ai',
  webDir: 'out',
  // Enable for live development - point to your local dev server
  server: {
    url: 'http://10.200.1.145:3000',
    cleartext: true,
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
