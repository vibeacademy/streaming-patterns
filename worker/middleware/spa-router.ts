/**
 * SPA routing handler
 * Serves index.html for all non-asset routes
 */

import type { Env } from '../index';

export async function handleSPARouting(request: Request, env: Env): Promise<Response> {
  // Create a new request for the root path
  // Note: Assets binding serves index.html for '/' but not '/index.html'
  const url = new URL(request.url);
  url.pathname = '/';

  const indexRequest = new Request(url.toString(), request);

  // Fetch index.html from Assets
  const response = await env.ASSETS.fetch(indexRequest);

  // Return with 200 status (not 404)
  // This allows React Router to handle the route client-side
  return new Response(response.body, {
    status: 200,
    headers: response.headers,
  });
}
