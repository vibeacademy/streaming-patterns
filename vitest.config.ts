import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom environment for React component testing (50-70% less memory than jsdom)
    environment: 'happy-dom',

    // Global test setup file
    setupFiles: ['./tests/setup.ts'],

    // Enable globals like describe, it, expect without imports
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      // Coverage thresholds (80% as per CLAUDE.md standards)
      // Disabled in CI when using test sharding, as each shard only covers a subset
      thresholds: process.env.CI ? undefined : {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },

      // Exclude common directories from coverage
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'specs/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        'src/types/**/*.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/main.tsx',
      ],
    },

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],

    // Watch mode settings
    watch: false,

    // Test timeout (5 seconds)
    testTimeout: 5000,
  },

  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/patterns': path.resolve(__dirname, './src/patterns'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/fixtures': path.resolve(__dirname, './src/fixtures'),
    },
  },
});
