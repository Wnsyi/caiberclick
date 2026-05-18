/// <reference types="vite/client" />

interface CapacitorBridge {
  isNativePlatform(): boolean;
  isNative?: boolean;
  getPlatform(): 'android' | 'ios' | 'web';
}

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}
