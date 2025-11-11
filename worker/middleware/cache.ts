/**
 * Cache control headers based on file type
 */

export function getCacheControl(pathname: string): string {
  // HTML files: no cache (always fresh)
  if (pathname.endsWith('.html') || pathname === '/') {
    return 'no-cache, no-store, must-revalidate';
  }

  // Hashed assets (Vite generates these): immutable, cache forever
  if (/\/assets\/.*-[a-f0-9]{8,}\.(js|css)$/i.test(pathname)) {
    return 'public, max-age=31536000, immutable';
  }

  // Fonts: cache for 1 year
  if (/\.(woff|woff2|ttf|eot)$/i.test(pathname)) {
    return 'public, max-age=31536000, immutable';
  }

  // Images: cache for 1 day
  if (/\.(svg|png|jpg|jpeg|gif|webp)$/i.test(pathname)) {
    return 'public, max-age=86400';
  }

  // Other files: cache for 1 hour
  return 'public, max-age=3600';
}
