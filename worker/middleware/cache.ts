/**
 * Cache control headers based on file type
 *
 * Strategy:
 * - HTML: No cache (always fetch fresh for SPA routing)
 * - Hashed assets: Immutable, cache forever (content-addressed)
 * - Fonts: Long-term cache (rarely change)
 * - Images: Medium-term cache
 * - Other: Short-term cache
 */

export function getCacheControl(pathname: string): string {
  // HTML files: no cache (always fresh for SPA routing)
  if (pathname.endsWith('.html') || pathname === '/') {
    return 'no-cache, no-store, must-revalidate';
  }

  // Hashed assets (Vite generates content-addressed filenames): immutable, cache forever
  // Matches: /assets/**/*-{hash}.{ext}
  if (/\/assets\/.*-[a-f0-9]{8,}\.(js|css)$/i.test(pathname)) {
    return 'public, max-age=31536000, immutable';
  }

  // Fonts with content hash: immutable, cache forever
  if (/\/assets\/fonts\/.*-[a-f0-9]{8,}\.(woff2?|ttf|otf|eot)$/i.test(pathname)) {
    return 'public, max-age=31536000, immutable';
  }

  // Images with content hash: immutable, cache for 1 year
  if (/\/assets\/images\/.*-[a-f0-9]{8,}\.(svg|png|jpe?g|gif|webp|avif)$/i.test(pathname)) {
    return 'public, max-age=31536000, immutable';
  }

  // Static images without hash (like logo): cache for 1 week
  if (/\.(svg|png|jpe?g|gif|webp|avif|ico)$/i.test(pathname)) {
    return 'public, max-age=604800, stale-while-revalidate=86400';
  }

  // Source maps: short cache (for debugging)
  if (pathname.endsWith('.map')) {
    return 'public, max-age=3600';
  }

  // Other files: cache for 1 hour
  return 'public, max-age=3600';
}
