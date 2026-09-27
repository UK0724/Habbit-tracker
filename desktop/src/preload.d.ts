export interface DesktopApi {
  platform: NodeJS.Platform;
  version: string;
  minimize: () => Promise<boolean>;
  maximize: () => Promise<boolean>;
  close: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    desktopApi: DesktopApi;
  }
}
