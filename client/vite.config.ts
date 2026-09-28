import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";

export default defineConfig({
  base: "/",
  // Keep hashed chunks available to tabs opened before a preview rebuild.
  // CI starts from a clean checkout; clean local dist only with preview stopped.
  build: { emptyOutDir: false },
  resolve: {
    // Shared workspace packages must use the web app's React instance.
    dedupe: ["react", "react-dom"]
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET || "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  plugins: [react(), {
    name: "preview-asset-recovery",
    configurePreviewServer(server) {
      const output = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        const apk = /^\/downloads\/([a-zA-Z0-9._-]+\.apk)$/.exec(pathname);
        const apkFilename = apk?.[1];
        if (apkFilename && (request.method === "GET" || request.method === "HEAD")) {
          const file = resolve(output, "downloads", apkFilename);
          if (!existsSync(file) || !statSync(file).isFile()) {
            response.statusCode = 404;
            response.setHeader("Content-Type", "text/plain; charset=utf-8");
            response.end("APK not found");
            return;
          }
          response.setHeader("Content-Type", "application/vnd.android.package-archive");
          response.setHeader("Content-Disposition", `attachment; filename="${apkFilename}"`);
          response.setHeader("X-Content-Type-Options", "nosniff");
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("Content-Length", statSync(file).size);
          if (request.method === "HEAD") { response.end(); return; }
          const stream = createReadStream(file);
          stream.on("error", () => response.destroy());
          response.on("close", () => stream.destroy());
          stream.pipe(response);
          return;
        }
        if (pathname.startsWith("/assets/")) {
          let file: string;
          try { file = resolve(output, `.${decodeURIComponent(pathname)}`); }
          catch { response.statusCode = 400; response.end(); return; }
          if (!file.startsWith(output + sep) || !existsSync(file)) {
            response.statusCode = 404;
            response.setHeader("Content-Type", "text/plain; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end("This app asset is no longer available. Reload the page.");
            return;
          }
        } else if (!pathname.startsWith("/api/")) {
          response.setHeader("Cache-Control", "no-cache");
        }
        next();
      });
    }
  }]
});
