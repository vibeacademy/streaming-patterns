import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest Configuration for BDD Specs
 *
 * This configuration is specifically for running Cucumber BDD specs
 * with Vitest as the test runner.
 *
 * Separate from the main Vitest config to allow different settings
 * for BDD specs vs unit tests.
 */

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup
    globals: true,
    setupFiles: ['./support/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: '../coverage/specs',
      include: ['../src/**/*.{ts,tsx}'],
      exclude: [
        '../src/**/*.test.{ts,tsx}',
        '../src/**/*.spec.{ts,tsx}',
        '../src/**/*.stories.{ts,tsx}',
        '../src/**/types.ts',
        '../src/main.tsx',
      ],
      // Coverage thresholds based on DDD-WORKUP.md requirements
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Test matching patterns
    include: [
      '**/*.steps.ts',
      '**/*.step.ts',
    ],

    // Timeouts
    testTimeout: 10000, // 10 seconds for scenarios
    hookTimeout: 5000,  // 5 seconds for hooks

    // Parallel execution
    threads: true,
    maxThreads: 4,

    // Reporter
    reporters: [
      'default',
      'verbose',
    ],

    // Retry failed tests
    retry: 0, // Don't retry by default (can enable for flaky tests)

    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Resolve aliases to match main app
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@/components': resolve(__dirname, '../src/components'),
      '@/lib': resolve(__dirname, '../src/lib'),
      '@/patterns': resolve(__dirname, '../src/patterns'),
      '@/fixtures': resolve(__dirname, '../src/fixtures'),
      '@/types': resolve(__dirname, '../src/types'),
      '@/specs': resolve(__dirname, '.'),
    },
  },
});
