/**
 * Security Headers Tests
 *
 * Verifies that all required security headers are configured correctly
 * and meet production-grade security standards.
 */

import { describe, it, expect } from 'vitest';
import { securityHeaders } from './security';

describe('Security Headers', () => {
  describe('Default (Production) Configuration', () => {
    const headers = securityHeaders();

  describe('X-Content-Type-Options', () => {
    it('should prevent MIME sniffing', () => {
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });
  });

  describe('X-Frame-Options', () => {
    it('should prevent clickjacking', () => {
      expect(headers['X-Frame-Options']).toBe('DENY');
    });
  });

  describe('X-XSS-Protection', () => {
    it('should enable XSS protection', () => {
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    });
  });

  describe('Referrer-Policy', () => {
    it('should use strict-origin-when-cross-origin', () => {
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Permissions-Policy', () => {
    it('should disable unnecessary browser features', () => {
      const policy = headers['Permissions-Policy'];
      expect(policy).toContain('accelerometer=()');
      expect(policy).toContain('camera=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('payment=()');
    });
  });

  describe('Content-Security-Policy', () => {
    const csp = headers['Content-Security-Policy'];

    it('should have default-src self', () => {
      expect(csp).toContain("default-src 'self'");
    });

    it('should configure script-src', () => {
      expect(csp).toContain('script-src');
      expect(csp).toContain("'self'");
    });

    it('should configure style-src', () => {
      expect(csp).toContain('style-src');
      expect(csp).toContain("'self'");
    });

    it('should prevent framing with frame-ancestors none', () => {
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should restrict base-uri', () => {
      expect(csp).toContain("base-uri 'self'");
    });

    it('should restrict form-action', () => {
      expect(csp).toContain("form-action 'self'");
    });

    it('should allow Cloudflare Insights for analytics', () => {
      expect(csp).toContain('https://static.cloudflareinsights.com');
    });

    it('should NOT use unsafe-inline in production', () => {
      expect(csp).not.toContain("'unsafe-inline'");
    });

    it('should NOT use unsafe-eval in production', () => {
      expect(csp).not.toContain("'unsafe-eval'");
    });

    it('should include object-src none', () => {
      expect(csp).toContain("object-src 'none'");
    });

    it('should upgrade insecure requests', () => {
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should block all mixed content', () => {
      expect(csp).toContain('block-all-mixed-content');
    });

    it('should restrict img-src to self and data URIs only', () => {
      expect(csp).toContain("img-src 'self' data:");
      expect(csp).not.toContain('img-src \'self\' data: https:');
    });
  });

  describe('Strict-Transport-Security (HSTS)', () => {
    it('should enforce HTTPS for 1 year', () => {
      const hsts = headers['Strict-Transport-Security'];
      expect(hsts).toContain('max-age=31536000');
    });

    it('should include subdomains', () => {
      const hsts = headers['Strict-Transport-Security'];
      expect(hsts).toContain('includeSubDomains');
    });

    it('should be eligible for preload', () => {
      const hsts = headers['Strict-Transport-Security'];
      expect(hsts).toContain('preload');
    });
  });

  describe('Complete Header Set', () => {
    it('should have all required security headers', () => {
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
        'Content-Security-Policy',
        'Strict-Transport-Security',
      ];

      requiredHeaders.forEach(header => {
        expect(headers).toHaveProperty(header);
        expect(headers[header]).toBeTruthy();
      });
    });

    it('should return headers as a record of strings', () => {
      Object.entries(headers).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });
  });
});
