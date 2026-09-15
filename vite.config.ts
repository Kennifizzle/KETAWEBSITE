// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load all env vars (including non-VITE_ server secrets) into process.env for server routes.
const serverEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

// The Lovable wrapper only types `preset` / `output` / `cloudflare`, but it spreads this
// object straight into `nitro()`, so additional Nitro options are forwarded at runtime.
// `inlineDynamicImports` turns the Nitro server build into a single file (rolldown maps it
// to `codeSplitting: false`), which removes the circular chunk pair that left
// `createMiddleware` uninitialized when TanStack Start built its CSRF middleware at module
// top level — surfacing as "TypeError: createMiddleware is not a function" at runtime.
const nitroOptions = {
  preset: "node-server",
  rollupConfig: {
    output: {
      inlineDynamicImports: true,
    },
  },
} as unknown as { preset: string };

export default defineConfig({
  nitro: nitroOptions,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
  },
});