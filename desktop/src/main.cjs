const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

let mainWindow = null;

const isDev = Boolean(
  process.env.VITE_DEV_SERVER_URL ||
  process.env.NODE_ENV === "development" ||
  (!app.isPackaged && process.env.NODE_ENV !== "production")
);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f172a",
    title: "Character",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Gracefully show window when content is loaded to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Notify renderer of maximize and unmaximize state changes
  mainWindow.on("maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window:maximized-change", true);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window:maximized-change", false);
    }
  });

  // Safely open external web links in the default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith("http:") || targetUrl.startsWith("https:")) {
      shell.openExternal(targetUrl);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    loadDevServer(mainWindow, devServerUrl);
  } else {
    const candidates = [
      path.join(app.getAppPath(), "client/dist/index.html"),
      path.join(__dirname, "../client/dist/index.html"),
      path.resolve(__dirname, "../../client/dist/index.html")
    ];
    let loaded = false;
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        mainWindow.loadURL(url.pathToFileURL(candidate).href);
        loaded = true;
        break;
      }
    }
    if (!loaded) {
      console.error("Could not find client/dist/index.html:", candidates);
      mainWindow.loadURL(url.pathToFileURL(candidates[0]).href);
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function loadDevServer(win, targetUrl, retries = 30) {
  win.loadURL(targetUrl).catch((err) => {
    if (retries > 0 && !win.isDestroyed()) {
      setTimeout(() => {
        if (!win.isDestroyed()) {
          loadDevServer(win, targetUrl, retries - 1);
        }
      }, 1000);
    } else {
      console.error(`Failed to connect to dev server at ${targetUrl}:`, err);
    }
  });
}

// Window control IPC handlers
ipcMain.handle("window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
    return true;
  }
  return false;
});

ipcMain.handle("window:maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return win.isMaximized();
  }
  return false;
});

ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
    return true;
  }
  return false;
});

ipcMain.handle("window:isMaximized", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isMaximized() : false;
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    // macOS re-create window on dock click
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

// Exit on all windows closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
