import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { delay, createDelay } from './delay';

/**
 * Test suite for delay utility functions
 *
 * These tests verify the timing utilities used throughout the streaming patterns
 * for simulating network latency and controlling async operations.
 */
describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve after specified milliseconds', async () => {
    const delayPromise = delay(1000);

    // Fast-forward time by 1000ms
    vi.advanceTimersByTime(1000);

    // Promise should resolve
    await expect(delayPromise).resolves.toBeUndefined();
  });

  it('should not resolve before specified time', async () => {
    const callback = vi.fn();
    const delayPromise = delay(1000).then(callback);

    // Fast-forward time by only 500ms
    vi.advanceTimersByTime(500);

    // Callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward the remaining time
    vi.advanceTimersByTime(500);

    await delayPromise;

    // Now callback should have been called
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle zero delay', async () => {
    const delayPromise = delay(0);

    vi.advanceTimersByTime(0);

    await expect(delayPromise).resolves.toBeUndefined();
  });
});

describe('createDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a delay function with preset duration', async () => {
    const wait500ms = createDelay(500);

    const delayPromise = wait500ms();

    vi.advanceTimersByTime(500);

    await expect(delayPromise).resolves.toBeUndefined();
  });

  it('should allow reusing the same delay function', async () => {
    const wait100ms = createDelay(100);

    // First call
    const firstDelay = wait100ms();
    vi.advanceTimersByTime(100);
    await expect(firstDelay).resolves.toBeUndefined();

    // Second call
    const secondDelay = wait100ms();
    vi.advanceTimersByTime(100);
    await expect(secondDelay).resolves.toBeUndefined();
  });

  it('should create independent delay functions', async () => {
    const wait100ms = createDelay(100);
    const wait200ms = createDelay(200);

    const callback100 = vi.fn();
    const callback200 = vi.fn();

    const delay100 = wait100ms().then(callback100);
    const delay200 = wait200ms().then(callback200);

    // After 100ms, only first callback should fire
    vi.advanceTimersByTime(100);
    await Promise.resolve(); // Flush promises
    expect(callback100).toHaveBeenCalledTimes(1);
    expect(callback200).not.toHaveBeenCalled();

    // After another 100ms (200ms total), second callback should fire
    vi.advanceTimersByTime(100);
    await Promise.all([delay100, delay200]);
    expect(callback200).toHaveBeenCalledTimes(1);
  });
});
