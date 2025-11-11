/**
 * Cloudflare Worker for Streaming Patterns Library
 *
 * This Worker serves static files from the Assets binding and handles
 * SPA routing for React Router.
 */

import { securityHeaders } from './middleware/security';
import { handleSPARouting } from './middleware/spa-router';
import { getCacheControl } from './middleware/cache';

export interface Env {
  ASSETS: Fetcher;  // Static assets binding
  ENVIRONMENT: string;
  PR_NUMBER?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Try to serve static asset
      let response: Response;

      // Check if this is an asset request
      if (isAssetRequest(pathname)) {
        response = await env.ASSETS.fetch(request);
      } else {
        // SPA routing: serve index.html for all other routes
        response = await handleSPARouting(request, env);
      }

      // Clone response to make it mutable
      response = new Response(response.body, response);

      // Add security headers
      addSecurityHeaders(response);

      // Set cache control headers
      const cacheControl = getCacheControl(pathname);
      response.headers.set('Cache-Control', cacheControl);

      // Add environment info header (for debugging)
      response.headers.set('X-Environment', env.ENVIRONMENT);
      if (env.PR_NUMBER) {
        response.headers.set('X-PR-Number', env.PR_NUMBER);
      }

      return response;

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

/**
 * Check if request is for a static asset
 */
function isAssetRequest(pathname: string): boolean {
  const assetPatterns = [
    /^\/assets\//,        // Vite assets
    /\.(js|css|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$/i,
    /^\/streamflow-logo\.svg$/,
    /^\/favicon\.ico$/,
    /^\/robots\.txt$/,
    /^\/sitemap\.xml$/,
  ];

  return assetPatterns.some(pattern => pattern.test(pathname));
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: Response): void {
  const headers = securityHeaders();

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
}
