const { contextBridge, ipcRenderer } = require("electron");

// Safe IPC bridge exposing minimal necessary APIs to renderer
contextBridge.exposeInMainWorld("desktopApi", {
  platform: process.platform,
  version: process.version,
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizedChange: (callback) => {
    if (typeof callback !== "function") {
      return () => {};
    }
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("window:maximized-change", handler);
    return () => {
      ipcRenderer.removeListener("window:maximized-change", handler);
    };
  }
});
