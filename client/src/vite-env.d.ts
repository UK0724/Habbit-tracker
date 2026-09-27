/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AD_PROVIDER?: string;
  readonly VITE_GOOGLE_AD_CLIENT?: string;
  readonly VITE_GOOGLE_AD_SLOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export interface DesktopApi {
  platform: string;
  version: string;
  minimize?: () => Promise<boolean>;
  maximize?: () => Promise<boolean>;
  close?: () => Promise<boolean>;
  isMaximized?: () => Promise<boolean>;
  onMaximizedChange?: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    desktopApi?: DesktopApi;
  }
}
