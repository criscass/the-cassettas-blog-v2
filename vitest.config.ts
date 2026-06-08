import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the `"@*": ["./src/*"]` tsconfig path alias (e.g. @lib/utils -> src/lib/utils).
    // Scoped to the local prefixes actually used so it doesn't shadow npm scopes like @astrojs/*.
    alias: [
      {
        find: /^@(components|consts|layouts|lib|types|assets|styles|db)(.*)/,
        replacement: path.resolve(__dirname, './src') + '/$1$2'
      }
    ]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
