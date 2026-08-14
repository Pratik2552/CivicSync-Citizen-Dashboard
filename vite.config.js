import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: [
      'mcqkl-2402-8100-23c5-78fe-e0f4-677-72d4-6539.run.pinggy-free.link',
      // Or you can simply use 'all' to allow any tunnel domain:
      // 'all'
    ],
    host: true, // Enables listening on local IP / localhost
    hmr: {
      host: 'localhost',
      port: 5174,
    },
  },
});
