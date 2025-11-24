/**
 * Security headers for Streaming Patterns Library
 *
 * @param environment - The deployment environment (production, preview, or development)
 */

export interface SecurityHeadersOptions {
  environment?: 'production' | 'preview' | 'development';
}

export function securityHeaders(options: SecurityHeadersOptions = {}): Record<string, string> {
  const { environment = 'production' } = options;

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

    // Content Security Policy (environment-specific)
    'Content-Security-Policy': getContentSecurityPolicy(environment),

    // HSTS (HTTP Strict Transport Security)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

/**
 * Get Content Security Policy based on environment
 *
 * Production: Strict CSP without unsafe-inline or unsafe-eval
 * Development/Preview: Relaxed CSP for Vite HMR
 */
function getContentSecurityPolicy(environment: string): string {
  const baseDirectives = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (environment === 'production') {
    // Production: Strict CSP without unsafe directives
    return [
      ...baseDirectives,
      "script-src 'self' https://static.cloudflareinsights.com",
      "style-src 'self'",
    ].join('; ');
  } else {
    // Development/Preview: Relaxed for Vite HMR
    return [
      ...baseDirectives,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
    ].join('; ');
  }
}
