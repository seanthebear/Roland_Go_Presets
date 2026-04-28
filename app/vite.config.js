import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',   // bind to all interfaces so a custom hostname resolves
    port: 5173,
    strictPort: true,   // fail fast rather than silently picking another port
  },
});
