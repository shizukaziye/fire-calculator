import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// React + Tailwind v4 (via the official Vite plugin — no PostCSS config needed).
// `base` is set for the production build only so assets resolve under the
// GitHub Pages project path (username.github.io/fire-calculator/). The dev
// server stays at "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fire-calculator/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    strictPort: true,
  },
}));
