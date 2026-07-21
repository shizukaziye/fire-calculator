import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// React + Tailwind v4 (via the official Vite plugin — no PostCSS config needed).
// `base` is RELATIVE ('./') for production builds so the same bundle resolves
// its assets whether it's served at a root domain (fire.loseii.com/) or under
// a project subpath (username.github.io/fire-calculator/). The dev server
// stays at "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    strictPort: true,
  },
}));
