import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import "./app/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker in production so Arc is installable as a
// standalone app and loads instantly / works offline for the app shell.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore registration failures — the app still works without it
    });
  });
}

