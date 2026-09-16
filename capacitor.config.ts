import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tcpmaker.dkmanager25',
  appName: 'DKManager25',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
