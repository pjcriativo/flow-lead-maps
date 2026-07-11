import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// Config do Vite para o TanStack Start (sem dependências de terceiros).
// Replica o essencial: Tailwind v4, resolução de paths do tsconfig, TanStack
// Start (com entry SSR em src/server.ts), Nitro (build → Cloudflare) e React.
export default defineConfig(({ command }) => ({
  server: {
    host: true,
    port: 8080,
  },
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
    // Nitro só é necessário no build (gera a saída para Cloudflare).
    ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
    viteReact(),
  ],
}));
