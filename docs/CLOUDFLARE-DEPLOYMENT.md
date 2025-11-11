# Cloudflare Workers Deployment Plan - Streaming Patterns Library

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Wrangler Configuration](#wrangler-configuration)
4. [GitHub Actions Workflows](#github-actions-workflows)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Environment Management](#environment-management)
7. [Step-by-Step Implementation](#step-by-step-implementation)
8. [Security Considerations](#security-considerations)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Cost Estimate](#cost-estimate)
11. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### Overview
This document provides a complete deployment strategy for the Streaming Patterns Library using **Cloudflare Workers**, with automatic ephemeral preview environments for pull requests and production deployment at `streamingpatterns.com`.

**Key Features:**
- **Production Deployment**: Main branch → `https://streamingpatterns.com`
- **Ephemeral Preview Environments**: Each PR → unique URL (`https://pr-{number}.streamingpatterns.com`)
- **Automatic Cleanup**: Preview environments deleted when PR is closed/merged
- **Zero Downtime**: Rolling deployments with instant rollback capability
- **Global Edge Network**: 300+ data centers worldwide

### Why Cloudflare Workers Over Pages?

| Aspect | Workers | Pages (Deprecated) | Decision |
|--------|---------|-------------------|----------|
| Static Site Hosting | ✅ Via Assets binding | ✅ Native | ✅ Workers (more control) |
| Ephemeral Environments | ✅ Full control | ⚠️ Limited cleanup | ✅ Workers |
| Custom Headers | ✅ Programmatic control | ✅ Via `_headers` | ✅ Workers (flexible) |
| SPA Routing | ✅ Custom middleware | ✅ Via `_redirects` | ✅ Workers (explicit) |
| Future Extensibility | ✅ Full compute power | ❌ Limited | ✅ Workers |
| Cost (Free Tier) | 100K requests/day | Unlimited | ✅ Both adequate |

**Verdict**: Cloudflare Workers provides superior control for ephemeral environments and future extensibility.

### Technology Stack

**Deployment Infrastructure:**
- **Cloudflare Workers**: Edge compute platform
- **Wrangler CLI**: Cloudflare's deployment tool
- **GitHub Actions**: CI/CD automation
- **Cloudflare KV**: Environment metadata storage (optional)

**Application Stack:**
- React 18 + Vite 5 + TypeScript
- Build output: `dist/` directory
- Client-side routing: React Router 6

### Timeline and Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Initial Setup | 2 hours | Medium |
| Wrangler Configuration | 1 hour | Low |
| GitHub Actions Workflows | 2 hours | Medium |
| Custom Domain Setup | 30 minutes | Low |
| Testing & Verification | 1 hour | Low |
| **Total** | **6-7 hours** | **Medium** |

---

## Architecture Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                   (streamingpatterns.com)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (TLS 1.3)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE NETWORK                    │
│                  (300+ Global Data Centers)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │          Cloudflare Workers Router                   │     │
│  │  - Subdomain detection (pr-42.streamingpatterns.com) │     │
│  │  - Environment selection (production vs preview)     │     │
│  │  - Security headers injection                        │     │
│  │  - SPA routing (serve index.html for all routes)    │     │
│  └──────────────────────────────────────────────────────┘     │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────┐     │
│  │           Workers Assets Binding                     │     │
│  │  - Static file serving                              │     │
│  │  - Automatic caching                                │     │
│  │  - Brotli compression                               │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Deployment Trigger
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB REPOSITORY                          │
│                 yourorg/streaming-patterns                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Branch: main (Production)                          │     │
│  │  → Worker: streaming-patterns-production            │     │
│  │  → URL: https://streamingpatterns.com              │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  PR #42 (Ephemeral Preview)                        │     │
│  │  → Worker: streaming-patterns-pr-42                │     │
│  │  → URL: https://pr-42.streamingpatterns.com        │     │
│  │  → Cleanup: Auto-delete on PR close                │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  GitHub Actions (CI/CD)                             │     │
│  │  - Lint, Test, Build                                │     │
│  │  - Deploy to Cloudflare Workers                     │     │
│  │  - Manage preview environments                      │     │
│  │  - Cleanup on PR close                              │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Worker Script Architecture

The Cloudflare Worker acts as a static file server with intelligent routing:

```typescript
// Worker Request Flow
Request → Worker Script
  ├─ Is asset request? (/assets/*, *.svg, *.png)
  │   └─ Serve from Assets binding (with cache headers)
  │
  ├─ Is API route? (future: /api/*)
  │   └─ Handle server-side logic
  │
  └─ All other routes (SPA routes)
      └─ Serve index.html (with 200 status)
          └─ React Router handles client-side routing
```

### Environment Isolation

**Production Environment:**
- **Worker Name**: `streaming-patterns-production`
- **Custom Domain**: `streamingpatterns.com`
- **Trigger**: Push to `main` branch
- **Retention**: Permanent

**Preview Environments:**
- **Worker Name**: `streaming-patterns-pr-{number}`
- **Custom Domain**: `pr-{number}.streamingpatterns.com` (wildcard subdomain)
- **Trigger**: PR opened/updated
- **Retention**: Auto-deleted on PR close/merge
- **Isolation**: Complete separation (separate Worker instance per PR)

---

## Wrangler Configuration

### Project Structure

```
streaming-patterns/
├── wrangler.toml                 # Production configuration
├── wrangler.preview.toml         # Preview template (not used directly)
├── worker/                       # Worker script
│   ├── index.ts                  # Main Worker script
│   └── middleware/
│       ├── security.ts           # Security headers
│       ├── spa-router.ts         # SPA routing logic
│       └── cache.ts              # Cache control
├── dist/                         # Build output (Vite)
├── .github/
│   └── workflows/
│       ├── deploy-production.yml
│       ├── deploy-preview.yml
│       └── cleanup-preview.yml
└── package.json
```

### Production Configuration (wrangler.toml)

Create `/wrangler.toml`:

```toml
# Cloudflare Workers configuration for Streaming Patterns Library
# Environment: Production

name = "streaming-patterns-production"
main = "worker/index.ts"
compatibility_date = "2024-11-11"

# Account details (replace with your values)
account_id = "${CLOUDFLARE_ACCOUNT_ID}"

# Workers configuration
workers_dev = false  # Don't deploy to workers.dev subdomain

# Routes - bind to custom domain
routes = [
  { pattern = "streamingpatterns.com/*", zone_name = "streamingpatterns.com" },
  { pattern = "www.streamingpatterns.com/*", zone_name = "streamingpatterns.com" }
]

# Assets binding (serves static files from dist/)
[assets]
directory = "./dist"
binding = "ASSETS"

# Custom settings
[build]
command = "npm run build"

[build.upload]
format = "service-worker"

# Environment variables (optional)
[vars]
ENVIRONMENT = "production"
```

### Preview Configuration Template

The preview configuration is generated dynamically per PR. Template:

```toml
# Generated for PR #{PR_NUMBER}
# This file is created by GitHub Actions

name = "streaming-patterns-pr-{PR_NUMBER}"
main = "worker/index.ts"
compatibility_date = "2024-11-11"

account_id = "${CLOUDFLARE_ACCOUNT_ID}"

workers_dev = false

# Routes - bind to PR subdomain
routes = [
  { pattern = "pr-{PR_NUMBER}.streamingpatterns.com/*", zone_name = "streamingpatterns.com" }
]

[assets]
directory = "./dist"
binding = "ASSETS"

[vars]
ENVIRONMENT = "preview"
PR_NUMBER = "{PR_NUMBER}"
```

### Worker Script (worker/index.ts)

Create `/worker/index.ts`:

```typescript
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
```

### Security Middleware (worker/middleware/security.ts)

Create `/worker/middleware/security.ts`:

```typescript
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
```

### SPA Router Middleware (worker/middleware/spa-router.ts)

Create `/worker/middleware/spa-router.ts`:

```typescript
/**
 * SPA routing handler
 * Serves index.html for all non-asset routes
 */

import type { Env } from '../index';

export async function handleSPARouting(request: Request, env: Env): Promise<Response> {
  // Create a new request for index.html
  const url = new URL(request.url);
  url.pathname = '/index.html';

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
```

### Cache Control Middleware (worker/middleware/cache.ts)

Create `/worker/middleware/cache.ts`:

```typescript
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
```

---

## GitHub Actions Workflows

### Workflow 1: Production Deployment

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Build and Deploy to Production
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:run

      - name: Build project
        run: npm run build
        env:
          NODE_ENV: production

      - name: Verify build output
        run: |
          echo "Checking build output..."
          ls -la dist/
          du -sh dist/
          echo "Build verification complete"

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --config wrangler.toml

      - name: Create deployment notification
        run: |
          echo "✅ Production deployment successful!"
          echo "URL: https://streamingpatterns.com"
          echo "Environment: production"
          echo "Commit: ${{ github.sha }}"
```

### Workflow 2: Preview Deployment (PR Opened/Updated)

Create `.github/workflows/deploy-preview.yml`:

```yaml
name: Deploy Preview Environment

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main

jobs:
  deploy-preview:
    name: Build and Deploy Preview
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:run

      - name: Build project
        run: npm run build
        env:
          NODE_ENV: production

      - name: Generate preview wrangler.toml
        run: |
          cat > wrangler.preview.toml << EOF
          name = "streaming-patterns-pr-${{ github.event.pull_request.number }}"
          main = "worker/index.ts"
          compatibility_date = "2024-11-11"

          account_id = "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}"

          workers_dev = false

          routes = [
            { pattern = "pr-${{ github.event.pull_request.number }}.streamingpatterns.com/*", zone_name = "streamingpatterns.com" }
          ]

          [assets]
          directory = "./dist"
          binding = "ASSETS"

          [vars]
          ENVIRONMENT = "preview"
          PR_NUMBER = "${{ github.event.pull_request.number }}"
          EOF

          echo "Generated wrangler.preview.toml:"
          cat wrangler.preview.toml

      - name: Deploy preview to Cloudflare Workers
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --config wrangler.preview.toml

      - name: Add DNS record for preview subdomain
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = context.payload.pull_request.number;
            const subdomain = `pr-${prNumber}`;

            console.log(`Setting up DNS for ${subdomain}.streamingpatterns.com`);

            // Note: DNS wildcard record should already exist (*.streamingpatterns.com)
            // This step is for documentation purposes
            // Actual DNS setup is one-time in Cloudflare Dashboard

      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = context.payload.pull_request.number;
            const previewUrl = `https://pr-${prNumber}.streamingpatterns.com`;

            const comment = `## 🚀 Preview Deployment Ready!

            Your changes have been deployed to a preview environment.

            **Preview URL**: [${previewUrl}](${previewUrl})

            **Environment**: Preview (ephemeral)
            **PR**: #${prNumber}
            **Commit**: \`${context.sha.substring(0, 7)}\`
            **Branch**: \`${context.payload.pull_request.head.ref}\`

            ---

            ### Testing Checklist
            - [ ] Home page loads correctly
            - [ ] Pattern demos work as expected
            - [ ] Network inspector captures events
            - [ ] Dark/light theme toggle works
            - [ ] Client-side routing works (refresh any page)

            ---

            ⚠️ **Note**: This preview environment will be automatically deleted when the PR is closed or merged.

            *Powered by Cloudflare Workers*`;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: prNumber,
              body: comment
            });
```

### Workflow 3: Cleanup Preview (PR Closed)

Create `.github/workflows/cleanup-preview.yml`:

```yaml
name: Cleanup Preview Environment

on:
  pull_request:
    types: [closed]
    branches:
      - main

jobs:
  cleanup:
    name: Delete Preview Environment
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Delete Cloudflare Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: delete --name streaming-patterns-pr-${{ github.event.pull_request.number }} --force
        continue-on-error: true  # Don't fail if Worker doesn't exist

      - name: Comment PR with cleanup confirmation
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = context.payload.pull_request.number;
            const previewUrl = `https://pr-${prNumber}.streamingpatterns.com`;

            const comment = `## 🧹 Preview Environment Cleaned Up

            The preview environment for this PR has been automatically deleted.

            **Deleted URL**: ~~${previewUrl}~~
            **PR**: #${prNumber}
            **Status**: ${context.payload.pull_request.merged ? 'Merged' : 'Closed'}

            All associated Cloudflare Workers resources have been removed.

            ---

            *Automated cleanup by GitHub Actions*`;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: prNumber,
              body: comment
            });

      - name: Cleanup summary
        run: |
          echo "✅ Preview environment deleted"
          echo "PR: #${{ github.event.pull_request.number }}"
          echo "Worker: streaming-patterns-pr-${{ github.event.pull_request.number }}"
          echo "URL: https://pr-${{ github.event.pull_request.number }}.streamingpatterns.com (now inactive)"
```

---

## Custom Domain Setup

### Step 1: Configure Wildcard DNS

To support dynamic PR preview subdomains (`pr-42.streamingpatterns.com`, `pr-43.streamingpatterns.com`, etc.), we need a wildcard DNS record.

**In Cloudflare Dashboard:**

1. Navigate to: **DNS** → **Records**
2. Add the following DNS records:

```
Type    Name    Target                                  Proxy Status
────────────────────────────────────────────────────────────────────
A       @       192.0.2.1 (Cloudflare proxy IP)        Proxied ☁️
AAAA    @       2606:4700::1 (Cloudflare IPv6)         Proxied ☁️
CNAME   www     streamingpatterns.com                   Proxied ☁️
CNAME   *       streamingpatterns.com                   Proxied ☁️ (WILDCARD)
```

**Important Notes:**
- The wildcard record (`*`) must be **Proxied** (orange cloud enabled)
- This allows any subdomain (e.g., `pr-42.streamingpatterns.com`) to route through Cloudflare
- Actual routing to specific Workers is configured in `wrangler.toml` routes

### Step 2: Configure Worker Routes

Worker routes are defined in `wrangler.toml` and dynamically generated for previews.

**Production Routes (in wrangler.toml):**
```toml
routes = [
  { pattern = "streamingpatterns.com/*", zone_name = "streamingpatterns.com" },
  { pattern = "www.streamingpatterns.com/*", zone_name = "streamingpatterns.com" }
]
```

**Preview Routes (generated per PR):**
```toml
routes = [
  { pattern = "pr-{number}.streamingpatterns.com/*", zone_name = "streamingpatterns.com" }
]
```

### Step 3: SSL Certificate

**Automatic SSL:**
- Cloudflare automatically provisions SSL certificates for:
  - `streamingpatterns.com`
  - `www.streamingpatterns.com`
  - `*.streamingpatterns.com` (wildcard certificate for all subdomains)

**Configuration:**
1. Go to: **SSL/TLS** → **Overview**
2. Set encryption mode: **Full (Strict)**
3. Certificate type: **Universal SSL** (free, auto-renewing)
4. Wait 5-15 minutes for certificate issuance

**Enable HSTS:**
1. Go to: **SSL/TLS** → **Edge Certificates**
2. Enable **HTTP Strict Transport Security (HSTS)**:
   - Max-Age: 12 months (31536000 seconds)
   - Include subdomains: ✅ Yes
   - Preload: ✅ Yes

### Step 4: Redirect www to Apex (Optional)

**Option 1: Using Page Rules (Recommended)**

1. Go to: **Rules** → **Page Rules**
2. Create rule:
   ```
   URL: www.streamingpatterns.com/*
   Setting: Forwarding URL
   Status Code: 301 (Permanent Redirect)
   Destination: https://streamingpatterns.com/$1
   ```

**Option 2: In Worker Script**

Add to `worker/index.ts`:
```typescript
// Redirect www to apex domain
if (url.hostname === 'www.streamingpatterns.com') {
  const redirectUrl = new URL(request.url);
  redirectUrl.hostname = 'streamingpatterns.com';
  return Response.redirect(redirectUrl.toString(), 301);
}
```

---

## Environment Management

### Environment Variables

**Required GitHub Secrets:**

1. Go to: **Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `CLOUDFLARE_API_TOKEN` | API token | Dashboard → **My Profile** → **API Tokens** → Create (see below) |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | Dashboard → **Workers & Pages** → Copy from right sidebar |

**Creating Cloudflare API Token:**

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Permissions:
   - Account | Workers Scripts | Edit
   - Account | Account Settings | Read
   - Zone | DNS | Edit (for wildcard DNS)
   - Zone | Workers Routes | Edit
5. Account Resources:
   - Include | Your Account
6. Zone Resources:
   - Include | Specific zone | `streamingpatterns.com`
7. Click **Continue to summary** → **Create Token**
8. **Copy token** (shown only once!) and add to GitHub Secrets

### Environment Detection in Worker

The Worker can detect its environment via the `ENVIRONMENT` variable:

```typescript
// In worker/index.ts
export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT: string;  // "production" or "preview"
  PR_NUMBER?: string;   // Only set for preview environments
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Different behavior based on environment
    if (env.ENVIRONMENT === 'production') {
      // Production-specific logic
    } else if (env.ENVIRONMENT === 'preview') {
      // Preview-specific logic (e.g., add banner)
      console.log(`Preview environment for PR #${env.PR_NUMBER}`);
    }

    // ... rest of Worker logic
  }
};
```

### Optional: Preview Environment Banner

Add a visual indicator in preview environments:

```typescript
// In worker/middleware/spa-router.ts
export async function handleSPARouting(request: Request, env: Env): Promise<Response> {
  // ... fetch index.html ...

  if (env.ENVIRONMENT === 'preview') {
    // Inject preview banner into HTML
    let html = await response.text();
    const banner = `
      <div style="position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#000;padding:8px;text-align:center;z-index:9999;font-family:system-ui;">
        🚧 Preview Environment (PR #${env.PR_NUMBER}) - Not Production
      </div>
    `;
    html = html.replace('<body>', `<body>${banner}`);

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return response;
}
```

---

## Step-by-Step Implementation

### Prerequisites Checklist

- [x] Domain `streamingpatterns.com` owned and on Cloudflare
- [x] Cloudflare account created
- [x] GitHub repository set up
- [x] Node.js 20+ installed locally
- [x] Git configured

### Phase 1: Initial Setup (1 hour)

**Step 1: Install Wrangler CLI**

```bash
# Install globally
npm install -g wrangler

# Or add to project
npm install --save-dev wrangler

# Verify installation
wrangler --version
```

**Step 2: Authenticate Wrangler**

```bash
# Login to Cloudflare
wrangler login

# This opens browser for OAuth authentication
# Follow prompts to authorize Wrangler
```

**Step 3: Get Account ID**

```bash
# List accounts
wrangler whoami

# Copy your Account ID
# Or get from Dashboard → Workers & Pages → Account ID
```

### Phase 2: Project Configuration (1 hour)

**Step 1: Create Worker Script Structure**

```bash
# Create directories
mkdir -p worker/middleware

# Create Worker files
touch worker/index.ts
touch worker/middleware/security.ts
touch worker/middleware/spa-router.ts
touch worker/middleware/cache.ts
```

**Step 2: Copy Worker Code**

Copy the Worker scripts from the [Wrangler Configuration](#wrangler-configuration) section above into the respective files.

**Step 3: Create Production Configuration**

Copy the production `wrangler.toml` from above, replacing:
- `${CLOUDFLARE_ACCOUNT_ID}` with your actual Account ID (for local testing)
- Or use environment variable: `account_id = "$CLOUDFLARE_ACCOUNT_ID"`

**Step 4: Update package.json**

Add Wrangler scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "worker:dev": "wrangler dev",
    "worker:deploy": "wrangler deploy",
    "worker:tail": "wrangler tail",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "wrangler": "^3.78.0"
  }
}
```

**Step 5: Install Wrangler**

```bash
npm install --save-dev wrangler
```

### Phase 3: Local Testing (30 minutes)

**Step 1: Test Local Build**

```bash
# Build the React app
npm run build

# Verify dist/ output
ls -la dist/
```

**Step 2: Test Worker Locally**

```bash
# Start local Worker dev server
npm run worker:dev

# This starts a local server at http://localhost:8787
```

**Step 3: Verify Local Functionality**

1. Open: `http://localhost:8787`
2. Test:
   - [ ] Home page loads
   - [ ] Navigate to pattern: `/patterns/chain-of-reasoning`
   - [ ] Refresh page (should not 404)
   - [ ] Check security headers: `curl -I http://localhost:8787`
   - [ ] Test asset loading: Check network tab for CSS/JS

### Phase 4: Production Deployment (30 minutes)

**Step 1: Setup DNS (Wildcard Record)**

1. Cloudflare Dashboard → **DNS** → **Records**
2. Add wildcard CNAME:
   ```
   Type: CNAME
   Name: *
   Target: streamingpatterns.com
   Proxy status: Proxied ☁️
   ```

**Step 2: Deploy Production Worker (Manual First)**

```bash
# Deploy to production
wrangler deploy --config wrangler.toml

# Expected output:
# ✨ Deployment complete!
# Worker: streaming-patterns-production
# Routes:
#   - streamingpatterns.com/*
#   - www.streamingpatterns.com/*
```

**Step 3: Verify Production Deployment**

```bash
# Test production URL
curl -I https://streamingpatterns.com

# Expected: 200 OK with security headers

# Test SPA routing
curl -I https://streamingpatterns.com/patterns/chain-of-reasoning

# Expected: 200 OK (not 404)
```

**Step 4: Test in Browser**

1. Visit: `https://streamingpatterns.com`
2. Verify:
   - [ ] Site loads correctly
   - [ ] HTTPS lock icon shows (valid SSL)
   - [ ] Theme toggle works
   - [ ] Pattern demos load
   - [ ] Client-side routing works (no 404 on refresh)

### Phase 5: GitHub Actions Setup (2 hours)

**Step 1: Add GitHub Secrets**

1. Go to: `https://github.com/{your-org}/streaming-patterns/settings/secrets/actions`
2. Add secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

**Step 2: Create Workflow Files**

Copy all three workflows from [GitHub Actions Workflows](#github-actions-workflows):
- `deploy-production.yml`
- `deploy-preview.yml`
- `cleanup-preview.yml`

```bash
mkdir -p .github/workflows
# Copy workflow files
```

**Step 3: Commit and Push**

```bash
git add .github/workflows/ worker/ wrangler.toml
git commit -m "[#deploy] Add Cloudflare Workers deployment configuration"
git push origin main
```

**Step 4: Verify Production Workflow**

1. Go to: `https://github.com/{your-org}/streaming-patterns/actions`
2. Wait for "Deploy to Production" workflow to complete
3. Verify:
   - [ ] Lint passes
   - [ ] Type check passes
   - [ ] Tests pass
   - [ ] Build succeeds
   - [ ] Deploy succeeds
4. Check production site: `https://streamingpatterns.com`

### Phase 6: Preview Environment Testing (1 hour)

**Step 1: Create Test PR**

```bash
git checkout -b test/preview-deployment
echo "# Test preview deployment" >> README.md
git add README.md
git commit -m "Test: Preview deployment workflow"
git push origin test/preview-deployment
```

**Step 2: Create Pull Request**

1. Go to: `https://github.com/{your-org}/streaming-patterns/pulls`
2. Click **New pull request**
3. Base: `main` ← Compare: `test/preview-deployment`
4. Create PR

**Step 3: Wait for Preview Deployment**

1. Watch GitHub Actions workflow
2. Wait for "Deploy Preview Environment" to complete
3. Look for PR comment with preview URL

**Step 4: Test Preview Environment**

1. Click preview URL: `https://pr-{number}.streamingpatterns.com`
2. Verify:
   - [ ] Site loads correctly
   - [ ] Shows preview banner (if implemented)
   - [ ] Pattern demos work
   - [ ] Isolated from production (different URL)

**Step 5: Test Cleanup**

1. Close or merge the PR
2. Watch "Cleanup Preview Environment" workflow
3. Verify:
   - [ ] Workflow completes successfully
   - [ ] PR gets cleanup comment
   - [ ] Preview URL no longer accessible (404 or error)

---

## Security Considerations

### HTTPS Enforcement

**Automatic (Cloudflare):**
- ✅ HTTP → HTTPS redirect (automatic)
- ✅ TLS 1.2+ enforcement (configurable)
- ✅ HSTS headers (configured in Worker)

**Manual Verification:**
```bash
curl -I http://streamingpatterns.com
# Should return 301 redirect to https://
```

### Security Headers

All security headers are configured in `worker/middleware/security.ts`:

| Header | Purpose | Value |
|--------|---------|-------|
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `X-Frame-Options` | Prevent clickjacking | `DENY` |
| `X-XSS-Protection` | XSS filter | `1; mode=block` |
| `Referrer-Policy` | Control referrer | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disable features | `accelerometer=(), camera=(), ...` |
| `Content-Security-Policy` | Resource restrictions | See configuration |
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000; includeSubDomains; preload` |

**CSP Explanation:**
```
default-src 'self'                    # Default: same origin only
script-src 'self' 'unsafe-inline' 'unsafe-eval'  # React needs inline scripts
style-src 'self' 'unsafe-inline'      # Allow inline styles
img-src 'self' data: https:           # Images from same origin, data URIs, HTTPS
connect-src 'self'                    # Fetch/XHR to same origin only
frame-ancestors 'none'                # No iframe embedding
```

**Note**: `unsafe-inline` and `unsafe-eval` are required for React. For stricter CSP, consider using nonces (future enhancement).

### API Token Security

**Best Practices:**
- ✅ Use scoped API tokens (not Global API Key)
- ✅ Store tokens in GitHub Secrets (never commit)
- ✅ Limit token permissions (Workers only)
- ✅ Rotate tokens quarterly
- ✅ Use separate tokens for CI/CD vs local development

**Token Permissions Checklist:**
- [x] Workers Scripts: Edit
- [x] Workers Routes: Edit
- [x] Account Settings: Read
- [x] Zone DNS: Edit (for wildcard DNS)
- [ ] Zone Settings: Edit (not needed)
- [ ] Zone Page Rules: Edit (not needed)

### DDoS Protection

**Cloudflare Built-in:**
- ✅ Layer 3/4 DDoS protection (network layer)
- ✅ Layer 7 DDoS protection (application layer)
- ✅ Rate limiting (configurable)

**Additional Protection:**

1. **Rate Limiting Rules:**
   - Dashboard → **Security** → **WAF** → **Rate limiting rules**
   - Create rule:
     ```
     Rule name: General rate limit
     Expression: (http.request.uri.path contains "/")
     Action: Block
     Requests: 100 requests per 10 seconds
     ```

2. **Bot Fight Mode:**
   - Dashboard → **Security** → **Bots** → Enable

### Preview Environment Isolation

**Security Measures:**
- Each preview environment is a separate Worker instance
- No shared state between preview and production
- Preview URLs are unpredictable (`pr-42.streamingpatterns.com`)
- Automatic cleanup prevents orphaned environments

**Potential Risks:**
- Preview environments are publicly accessible
- Anyone with the URL can access (no authentication)

**Mitigations:**
- Preview URLs are only shared in PR comments (GitHub access required)
- Short-lived (deleted on PR close)
- No production data or API keys

---

## Monitoring and Logging

### Cloudflare Analytics (Built-in)

**Enable Web Analytics:**

1. Dashboard → **Analytics & Logs** → **Web Analytics**
2. Click **Add a site** → Enter `streamingpatterns.com`
3. Copy beacon script

**Add to `index.html`:**
```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

**Metrics Available:**
- Page views
- Unique visitors
- Bounce rate
- Time on site
- Top pages
- Referrers
- Countries/devices/browsers

### Workers Analytics

**View Worker Metrics:**

1. Dashboard → **Workers & Pages** → **streaming-patterns-production**
2. Click **Metrics**

**Available Metrics:**
- Requests per second
- Request status codes (200, 404, 500, etc.)
- CPU time
- Errors and exceptions
- Invocation count

### Real-Time Logs (Wrangler Tail)

**Stream live logs from Worker:**

```bash
# Tail production Worker
wrangler tail --name streaming-patterns-production

# Tail preview Worker
wrangler tail --name streaming-patterns-pr-42

# Filter errors only
wrangler tail --name streaming-patterns-production --status error
```

**Example log output:**
```
[2024-11-11T10:30:45.123Z] GET https://streamingpatterns.com/ - 200 OK (15ms)
[2024-11-11T10:30:46.456Z] GET https://streamingpatterns.com/assets/index-abc123.js - 200 OK (5ms)
```

### Error Tracking with Sentry (Optional)

**Install Sentry:**
```bash
npm install @sentry/browser @sentry/vite-plugin
```

**Configure in Worker:**
```typescript
// worker/index.ts
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: env.ENVIRONMENT,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: env.ENVIRONMENT === 'production' ? 0.1 : 1.0,
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
};
```

### Uptime Monitoring (External)

**Recommended: UptimeRobot (Free)**

1. Sign up: https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://streamingpatterns.com`
   - Interval: 5 minutes
   - Alert: Email on downtime

**Alternative: Pingdom, StatusCake**

### Lighthouse CI (Performance Monitoring)

**Add to `.github/workflows/deploy-production.yml`:**

```yaml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://streamingpatterns.com
      https://streamingpatterns.com/patterns/chain-of-reasoning
    uploadArtifacts: true
    temporaryPublicStorage: true
    runs: 3
    budgetPath: .lighthouserc.json
```

**Create `.lighthouserc.json`:**
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

---

## Cost Estimate

### Cloudflare Workers - FREE Tier

| Resource | Free Tier Limit | Estimated Usage | Cost |
|----------|----------------|-----------------|------|
| Requests | 100,000/day | ~500-5,000/day | $0 |
| CPU Time | 10ms per request | ~5ms average | $0 |
| Duration | No limit | N/A | $0 |
| Workers | Unlimited | 1 production + ~5 previews | $0 |
| **Subtotal** | | | **$0/month** |

**Note**: Educational site with mock data easily fits free tier.

**If Exceeding Free Tier (unlikely):**
- Workers Paid: $5/month (10M requests)
- Additional requests: $0.50 per million

### Domain Costs

| Item | Cost | Frequency |
|------|------|-----------|
| `streamingpatterns.com` registration | $12-15 | Annual |
| Domain renewal | $12-15 | Annual |
| WHOIS privacy | Included free with Cloudflare | N/A |
| **Subtotal** | **$12-15/year** | **Annual** |

### Optional Services

| Service | Purpose | Cost |
|---------|---------|------|
| Cloudflare Pro | Advanced analytics, Page Rules | $20/month |
| Sentry (Error tracking) | 5K events/month (free tier) | $0-26/month |
| UptimeRobot | Uptime monitoring (free tier) | $0 |
| **Subtotal (optional)** | | **$0-46/month** |

### Total Cost Estimate

**Recommended (MVP):**
- Workers: $0/month
- Domain: ~$1.25/month ($15/year)
- **Total: ~$1.25/month or $15/year**

**With Optional Services:**
- Cloudflare Pro: $20/month
- Sentry: $26/month
- **Total: ~$47/month**

**Recommendation**: Stick with free tier. **Total cost: $15/year (domain only).**

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Worker Deployment Fails

**Symptom:**
```bash
wrangler deploy
# Error: Authentication error
```

**Cause:**
- Invalid API token
- Incorrect account ID
- Token permissions insufficient

**Solution:**

1. Verify token:
   ```bash
   curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. Check token permissions:
   - Dashboard → **My Profile** → **API Tokens**
   - Verify: Workers Scripts (Edit), Workers Routes (Edit)

3. Update account ID in `wrangler.toml`

4. Re-authenticate:
   ```bash
   wrangler logout
   wrangler login
   ```

#### 2. Preview Environment Not Creating

**Symptom:**
- PR created but no preview deployment
- Workflow succeeds but Worker not deployed

**Cause:**
- GitHub Secret missing/invalid
- DNS wildcard not configured
- Route conflict

**Solution:**

1. Verify GitHub Secrets exist:
   - Settings → Secrets → Actions
   - Check: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

2. Check DNS wildcard:
   ```bash
   dig pr-42.streamingpatterns.com
   # Should resolve to Cloudflare proxy
   ```

3. Verify workflow logs:
   - Actions → Failed workflow → View logs

4. Test manual deployment:
   ```bash
   wrangler deploy --config wrangler.preview.toml
   ```

#### 3. Preview Cleanup Doesn't Delete Worker

**Symptom:**
- PR closed but Worker still exists
- Cleanup workflow succeeds but preview URL still works

**Cause:**
- Worker name mismatch
- API token lacks delete permissions
- Force flag missing

**Solution:**

1. List all Workers:
   ```bash
   wrangler list
   ```

2. Manually delete Worker:
   ```bash
   wrangler delete --name streaming-patterns-pr-42 --force
   ```

3. Verify deletion:
   ```bash
   curl -I https://pr-42.streamingpatterns.com
   # Should return error (Worker not found)
   ```

4. Update cleanup workflow to use `--force` flag

#### 4. SPA Routing 404 Errors

**Symptom:**
- Home page works: `https://streamingpatterns.com` ✅
- Direct pattern URL fails: `https://streamingpatterns.com/patterns/chain-of-reasoning` ❌ 404

**Cause:**
- Worker not serving `index.html` for non-asset routes
- Assets binding misconfigured

**Solution:**

1. Check Worker logs:
   ```bash
   wrangler tail --name streaming-patterns-production
   ```

2. Verify `handleSPARouting` function:
   ```typescript
   // Should return 200, not 404
   return new Response(response.body, {
     status: 200,  // Important!
     headers: response.headers,
   });
   ```

3. Test locally:
   ```bash
   wrangler dev
   # Visit http://localhost:8787/patterns/chain-of-reasoning
   ```

4. Check `isAssetRequest` function includes all asset patterns

#### 5. Security Headers Not Applied

**Symptom:**
```bash
curl -I https://streamingpatterns.com | grep X-Frame-Options
# No output (header missing)
```

**Cause:**
- Worker not calling `addSecurityHeaders`
- Headers overwritten by later middleware

**Solution:**

1. Verify Worker calls security middleware:
   ```typescript
   addSecurityHeaders(response);
   ```

2. Check header order (security headers should be last)

3. Test with curl:
   ```bash
   curl -I https://streamingpatterns.com
   # Should show all security headers
   ```

4. Clear Cloudflare cache:
   - Dashboard → **Caching** → **Purge Everything**

#### 6. Build Output Not Found

**Symptom:**
```
Error: Could not find directory: ./dist
```

**Cause:**
- Build not run before deployment
- Incorrect build output directory
- GitHub Actions missing build step

**Solution:**

1. Run build locally:
   ```bash
   npm run build
   ls -la dist/
   ```

2. Verify `wrangler.toml` points to correct directory:
   ```toml
   [assets]
   directory = "./dist"  # Must match Vite output
   ```

3. Update GitHub workflow to build before deploy:
   ```yaml
   - name: Build project
     run: npm run build

   - name: Deploy to Cloudflare Workers
     uses: cloudflare/wrangler-action@v3
   ```

#### 7. High CPU Time (Quota Exceeded)

**Symptom:**
- Worker returning 500 errors during high traffic
- Dashboard shows CPU time limit exceeded

**Cause:**
- Inefficient Worker code (synchronous loops, heavy processing)
- Too many requests

**Solution:**

1. Optimize Worker code:
   ```typescript
   // Avoid synchronous loops
   // Use efficient regex patterns
   // Cache responses where possible
   ```

2. Monitor CPU time:
   - Dashboard → Workers → Metrics → CPU Time

3. Upgrade to Workers Paid ($5/month) if needed

4. Implement caching:
   ```typescript
   const cache = caches.default;
   const cacheKey = new Request(url.toString(), request);
   let response = await cache.match(cacheKey);

   if (!response) {
     response = await fetch(request);
     ctx.waitUntil(cache.put(cacheKey, response.clone()));
   }
   ```

#### 8. Wildcard DNS Not Resolving

**Symptom:**
```bash
dig pr-42.streamingpatterns.com
# No CNAME record found
```

**Cause:**
- Wildcard DNS record not created
- Not proxied through Cloudflare

**Solution:**

1. Add wildcard CNAME:
   - Dashboard → DNS → Records → Add
   - Type: CNAME
   - Name: `*`
   - Target: `streamingpatterns.com`
   - Proxy: Enabled ☁️

2. Wait for DNS propagation (5-30 minutes)

3. Test:
   ```bash
   dig pr-99.streamingpatterns.com
   # Should return Cloudflare proxy IP
   ```

#### 9. Preview URL Shows Production Content

**Symptom:**
- Preview URL loads but shows production content
- Environment variable not set correctly

**Cause:**
- Worker route conflict
- Preview Worker not deployed
- DNS routing to wrong Worker

**Solution:**

1. Verify Worker exists:
   ```bash
   wrangler list | grep pr-42
   ```

2. Check route configuration:
   ```bash
   wrangler routes list
   ```

3. Verify environment variable in Worker:
   ```typescript
   response.headers.set('X-Environment', env.ENVIRONMENT);
   response.headers.set('X-PR-Number', env.PR_NUMBER || 'none');
   ```

4. Test with curl:
   ```bash
   curl -I https://pr-42.streamingpatterns.com | grep X-PR
   # Should show: X-PR-Number: 42
   ```

#### 10. SSL Certificate Not Issued for Wildcard

**Symptom:**
```bash
curl https://pr-42.streamingpatterns.com
# SSL certificate error
```

**Cause:**
- Wildcard SSL certificate not provisioned
- Waiting for certificate issuance

**Solution:**

1. Check certificate status:
   - Dashboard → SSL/TLS → Edge Certificates
   - Verify: Universal SSL covers `*.streamingpatterns.com`

2. Wait 15-30 minutes for certificate issuance

3. If failed, check CAA records:
   ```bash
   dig CAA streamingpatterns.com
   ```

4. Remove blocking CAA records or add Cloudflare:
   ```
   0 issue "comodoca.com"
   0 issue "digicert.com"
   0 issue "letsencrypt.org"
   ```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev                    # Start Vite dev server
npm run build                  # Build React app
npm run preview                # Preview production build

# Worker Development
npm run worker:dev             # Start local Worker dev server
npm run worker:deploy          # Deploy Worker to production
npm run worker:tail            # Stream live Worker logs

# Testing
npm run test                   # Run tests in watch mode
npm run test:run               # Run tests once (CI)

# Deployment
git push origin main           # Auto-deploy to production
# Create PR → Auto-deploy preview
# Close PR → Auto-cleanup preview

# Wrangler Commands
wrangler deploy                # Deploy Worker
wrangler delete --name X       # Delete Worker
wrangler tail --name X         # Stream logs
wrangler list                  # List all Workers
wrangler routes list           # List Worker routes
```

### Important URLs

| Purpose | URL |
|---------|-----|
| **Production** | https://streamingpatterns.com |
| **Preview (PR #42)** | https://pr-42.streamingpatterns.com |
| **Cloudflare Dashboard** | https://dash.cloudflare.com |
| **GitHub Repository** | https://github.com/{your-org}/streaming-patterns |
| **GitHub Actions** | https://github.com/{your-org}/streaming-patterns/actions |
| **Workers Dashboard** | https://dash.cloudflare.com/workers |

### Support Resources

| Resource | URL |
|----------|-----|
| **Cloudflare Workers Docs** | https://developers.cloudflare.com/workers/ |
| **Wrangler Docs** | https://developers.cloudflare.com/workers/wrangler/ |
| **Cloudflare Community** | https://community.cloudflare.com/ |
| **Workers Examples** | https://developers.cloudflare.com/workers/examples/ |

---

## Conclusion

This deployment plan provides a production-ready strategy for deploying the Streaming Patterns Library using **Cloudflare Workers** with full ephemeral preview environment support.

**Key Achievements:**
✅ Zero-cost hosting (free tier adequate)
✅ Global CDN (300+ locations)
✅ Automatic HTTPS with wildcard SSL
✅ CI/CD with GitHub Actions
✅ Ephemeral preview environments per PR
✅ Automatic cleanup on PR close
✅ Security headers and DDoS protection
✅ Custom domain with wildcard subdomains
✅ Performance optimization
✅ Real-time monitoring and logging
✅ Complete control over routing and middleware

**Advantages Over Cloudflare Pages:**
- ✅ Full control over preview environment lifecycle
- ✅ Programmatic environment cleanup
- ✅ Flexible middleware (future SSE simulation at edge)
- ✅ Better observability (Worker logs)
- ✅ Extensibility (add API routes, edge logic)

**Timeline:**
- Initial setup: 6-7 hours
- Maintenance: < 1 hour/month

**Total Cost:**
- **$15/year** (domain only, Workers free tier)

**Next Steps:**
1. Complete [Step-by-Step Implementation](#step-by-step-implementation)
2. Test preview environments thoroughly
3. Monitor Worker performance and quotas
4. Iterate and enhance

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or open a GitHub issue.

---

**Document Version**: 2.0.0 (Cloudflare Workers)
**Last Updated**: November 11, 2024
**Author**: System Architect (Claude)
**Review Status**: Ready for Implementation
