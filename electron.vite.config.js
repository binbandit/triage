import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      rollupOptions: {
        external: ["electron"],
      },
    },
  },
  preload: {
    build: {
      outDir: "out/preload",
      rollupOptions: {
        external: ["electron"],
      },
    },
  },
  renderer: {
    root: "src/renderer",
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        input: "src/renderer/index.html",
      },
    },
    plugins: [tailwindcss(), react()],
  },
});
