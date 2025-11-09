/**
 * Utility function to introduce a delay
 *
 * This is useful for simulating network latency in mock streams
 * and for controlling the timing of asynchronous operations in tests.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * console.log('1 second has passed');
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a delay function with a specific duration
 *
 * Useful for creating reusable delay functions with preset durations.
 *
 * @param ms - Default milliseconds to delay
 * @returns A function that delays by the specified duration
 *
 * @example
 * ```typescript
 * const wait100ms = createDelay(100);
 * await wait100ms(); // Waits 100ms
 * ```
 */
export function createDelay(ms: number): () => Promise<void> {
  return () => delay(ms);
}
