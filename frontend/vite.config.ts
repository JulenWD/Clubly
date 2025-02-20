import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite";
import * as path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss()
  ],
    resolve: {
        alias: {
            '../../node_modules': path.resolve(__dirname, 'node_modules'),
        },
    },
})
