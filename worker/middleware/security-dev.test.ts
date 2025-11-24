/**
 * Security Headers Tests - Development Environment
 *
 * Verifies that development environment has relaxed CSP for Vite HMR
 */

import { describe, it, expect } from 'vitest';
import { securityHeaders } from './security';

describe('Security Headers - Development Environment', () => {
  const headers = securityHeaders({ environment: 'development' });

  describe('Content-Security-Policy (Development)', () => {
    const csp = headers['Content-Security-Policy'];

    it('should allow unsafe-inline for Vite HMR', () => {
      expect(csp).toContain("'unsafe-inline'");
    });

    it('should allow unsafe-eval for Vite HMR', () => {
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should still have strict base directives', () => {
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
    });
  });

  describe('Other Security Headers (Development)', () => {
    it('should maintain same strict headers as production', () => {
      const prodHeaders = securityHeaders({ environment: 'production' });

      expect(headers['X-Content-Type-Options']).toBe(prodHeaders['X-Content-Type-Options']);
      expect(headers['X-Frame-Options']).toBe(prodHeaders['X-Frame-Options']);
      expect(headers['X-XSS-Protection']).toBe(prodHeaders['X-XSS-Protection']);
      expect(headers['Referrer-Policy']).toBe(prodHeaders['Referrer-Policy']);
      expect(headers['Permissions-Policy']).toBe(prodHeaders['Permissions-Policy']);
      expect(headers['Strict-Transport-Security']).toBe(prodHeaders['Strict-Transport-Security']);
    });
  });
});

describe('Security Headers - Preview Environment', () => {
  const headers = securityHeaders({ environment: 'preview' });

  describe('Content-Security-Policy (Preview)', () => {
    const csp = headers['Content-Security-Policy'];

    it('should allow unsafe-inline for PR previews', () => {
      expect(csp).toContain("'unsafe-inline'");
    });

    it('should allow unsafe-eval for PR previews', () => {
      expect(csp).toContain("'unsafe-eval'");
    });
  });
});

describe('Security Headers - Environment Comparison', () => {
  const prodHeaders = securityHeaders({ environment: 'production' });
  const devHeaders = securityHeaders({ environment: 'development' });
  const previewHeaders = securityHeaders({ environment: 'preview' });

  it('should have different CSP for production vs development', () => {
    expect(prodHeaders['Content-Security-Policy']).not.toBe(devHeaders['Content-Security-Policy']);
  });

  it('should have same non-CSP headers across all environments', () => {
    const nonCspHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security',
    ];

    nonCspHeaders.forEach(header => {
      expect(prodHeaders[header]).toBe(devHeaders[header]);
      expect(prodHeaders[header]).toBe(previewHeaders[header]);
    });
  });

  it('should have production CSP stricter than development CSP', () => {
    const prodCsp = prodHeaders['Content-Security-Policy'];
    const devCsp = devHeaders['Content-Security-Policy'];

    // Production should not have unsafe directives
    expect(prodCsp).not.toContain("'unsafe-inline'");
    expect(prodCsp).not.toContain("'unsafe-eval'");

    // Development should have unsafe directives
    expect(devCsp).toContain("'unsafe-inline'");
    expect(devCsp).toContain("'unsafe-eval'");
  });
});
