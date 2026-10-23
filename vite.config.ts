import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
export default defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  plugins: [tanstackStart({ server: { entry: "server" } }), react(), tailwindcss(), ...(command === "build" ? [nitro({ preset: "node-server", noExternals: true })] : [])],
}));
