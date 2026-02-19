import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koala.ai',
  appName: 'Koala.ai',
  webDir: 'out',
  // Production: https://koala-ai-client.vercel.app
  // Development: http://10.200.1.147:3000
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
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'never',
    scheme: 'capacitor',
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
