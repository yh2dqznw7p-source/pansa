import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Each Tauri app has its own `index.html` in its crate directory, with
// `frontendDist` pointing to `../dist/<name>`. We build both via `--app` env.

type AppName = "client" | "support";

function configFor(app: AppName) {
  const port = app === "client" ? 1420 : 1421;
  return defineConfig({
    root: resolve(__dirname, app),
    publicDir: false,
    plugins: [react()],
    clearScreen: false,
    server: {
      port,
      strictPort: true,
      watch: { ignored: ["**/client/src-tauri/**", "**/support/src-tauri/**", "**/target/**"] },
    },
    build: {
      outDir: resolve(__dirname, `dist/${app}`),
      emptyOutDir: true,
      target: "chrome110",
      minify: "esbuild",
    },
  });
}

const app = (process.env.APP as AppName) || "client";
export default configFor(app);
