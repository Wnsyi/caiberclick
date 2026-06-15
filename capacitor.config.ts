import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caiberclick.hospital',
  appName: '开药吗',
  webDir: 'dist',
  server: {
    url: 'http://39.105.51.168:8081/',
    cleartext: true
  }
};

export default config;