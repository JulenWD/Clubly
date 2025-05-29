import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from "node:path";
export default defineConfig({
  plugins: [
      react()
  ],
  css: {
    postcss: './postcss.config.cjs',
  },
  resolve: {
      alias: {
          '../../node_modules': path.resolve(__dirname, 'node_modules'),
      },
  },
  server: {
    port: 5173
  }
})
