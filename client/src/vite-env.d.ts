/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
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
    desktopApi?: DesktopApi;
  }
}
