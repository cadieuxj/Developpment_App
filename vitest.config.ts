import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/app/**/*.test.*',
        'src/**/*.d.ts',
        'src/lib/db/index.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 40,
      },
    },
    include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/test/e2e/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
