/**
 * Security headers for Streaming Patterns Library
 */

export function securityHeaders(): Record<string, string> {
  return {
    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // XSS Protection (legacy, but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (disable unnecessary features)
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // HSTS (HTTP Strict Transport Security)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}
