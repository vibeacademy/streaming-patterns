# Production Deployment Checklist

**Last Updated**: November 24, 2025
**Status**: Ready for custom domain setup

---

## Table of Contents

1. [Domain & DNS Setup](#1-domain--dns-setup)
2. [Cloudflare Configuration](#2-cloudflare-configuration)
3. [SEO Updates](#3-seo-updates)
4. [Security Verification](#4-security-verification)
5. [Analytics & Monitoring](#5-analytics--monitoring)
6. [Final Testing](#6-final-testing)
7. [Post-Launch Tasks](#7-post-launch-tasks)

---

## 1. Domain & DNS Setup

### Prerequisites
- [ ] Purchase domain (recommendation: `streamingpatterns.dev` or `streamingpatterns.com`)
- [ ] Have domain registrar credentials ready
- [ ] Know your Cloudflare account ID

### DNS Configuration

**Option A: Domain registered with Cloudflare**
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to "Websites" → Add your domain
3. Cloudflare will automatically configure DNS
4. Skip to [Cloudflare Configuration](#2-cloudflare-configuration)

**Option B: Domain registered elsewhere (Namecheap, GoDaddy, etc.)**

1. **Add domain to Cloudflare**:
   ```
   https://dash.cloudflare.com
   → Websites
   → Add a site
   → Enter domain name
   → Select Free plan
   ```

2. **Update nameservers at your registrar**:
   - Cloudflare will provide 2 nameservers (e.g., `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Find DNS/Nameserver settings
   - Replace existing nameservers with Cloudflare's nameservers
   - Wait 24-48 hours for propagation (usually faster)

3. **Verify DNS is active**:
   ```bash
   dig +short NS yourdomain.com
   # Should show Cloudflare nameservers
   ```

---

## 2. Cloudflare Configuration

### Step 1: Update wrangler.toml

Replace `streaming-patterns.example.com` with your actual domain:

```toml
# wrangler.toml
name = "streaming-patterns-production"
main = "worker/index.ts"
compatibility_date = "2024-11-11"

# Set to false once custom domain is configured
workers_dev = false

# Configure custom domain routes
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" },
  { pattern = "www.yourdomain.com/*", zone_name = "yourdomain.com" }
]

[assets]
directory = "./dist"
binding = "ASSETS"

[vars]
ENVIRONMENT = "production"
```

### Step 2: Add DNS Records in Cloudflare

Go to your domain in Cloudflare Dashboard → DNS → Records:

**Required Records**:

| Type  | Name | Content | Proxy Status | TTL  |
|-------|------|---------|--------------|------|
| CNAME | @    | streaming-patterns-production.teddy1340.workers.dev | Proxied (Orange) | Auto |
| CNAME | www  | streaming-patterns-production.teddy1340.workers.dev | Proxied (Orange) | Auto |

**Why CNAME?** Cloudflare Workers Assets requires CNAME records pointing to your worker's subdomain.

### Step 3: Deploy to Custom Domain

```bash
# Build and deploy
npm run build
wrangler deploy

# Verify deployment
curl -I https://yourdomain.com
# Should return 200 OK
```

### Step 4: Test Both Domains

```bash
# Test apex domain
curl -I https://yourdomain.com

# Test www subdomain
curl -I https://www.yourdomain.com

# Test specific route
curl -I https://yourdomain.com/patterns/chain-of-reasoning
```

---

## 3. SEO Updates

### Update Meta Tags in index.html

Replace all instances of `streaming-patterns.example.com` with your real domain:

```bash
# Open index.html
vim index.html

# Find and replace (or use sed):
# OLD: https://streaming-patterns.example.com
# NEW: https://yourdomain.com
```

**Files to update**:

1. **`/index.html`** (lines 23, 32, 35, 38, 58):
   ```html
   <!-- Open Graph -->
   <meta property="og:url" content="https://yourdomain.com/" />
   <meta property="og:image" content="https://yourdomain.com/streamflow-logo.svg" />

   <!-- Twitter Card -->
   <meta name="twitter:url" content="https://yourdomain.com/" />
   <meta name="twitter:image" content="https://yourdomain.com/streamflow-logo.svg" />

   <!-- Canonical -->
   <link rel="canonical" href="https://yourdomain.com/" />

   <!-- JSON-LD -->
   "url": "https://yourdomain.com"
   ```

2. **`/public/robots.txt`** (line 8):
   ```txt
   Sitemap: https://yourdomain.com/sitemap.xml
   ```

3. **`/public/sitemap.xml`** (lines 9, 17, 25):
   ```xml
   <loc>https://yourdomain.com/</loc>
   <loc>https://yourdomain.com/patterns</loc>
   <loc>https://yourdomain.com/patterns/chain-of-reasoning</loc>
   ```

**One-liner to update all files**:
```bash
# Replace all instances (review changes before committing!)
find . -type f \( -name "*.html" -o -name "*.txt" -o -name "*.xml" \) \
  -exec sed -i '' 's|streaming-patterns\.example\.com|yourdomain.com|g' {} +

# Verify changes
git diff
```

### Rebuild and Deploy

```bash
npm run build
wrangler deploy
```

---

## 4. Security Verification

### SSL/TLS Check

```bash
# Check SSL certificate
curl -vI https://yourdomain.com 2>&1 | grep -E "(SSL|TLS|certificate)"

# Verify HTTPS redirect
curl -I http://yourdomain.com
# Should return 301 redirect to https://
```

### Security Headers Check

```bash
# Verify security headers are present
curl -I https://yourdomain.com | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"
```

**Expected headers**:
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Cache Headers Check

```bash
# HTML should have no-cache
curl -I https://yourdomain.com | grep "Cache-Control"
# Should return: Cache-Control: no-cache, no-store, must-revalidate

# JS bundles should have immutable cache
curl -I https://yourdomain.com/assets/vendor-wGySg1uH.js | grep "Cache-Control"
# Should return: Cache-Control: public, max-age=31536000, immutable
```

---

## 5. Analytics & Monitoring

### Google Search Console

1. **Add property**:
   ```
   https://search.google.com/search-console
   → Add Property
   → URL prefix: https://yourdomain.com
   ```

2. **Verify ownership** (choose one):
   - **HTML file upload**: Download verification file, add to `/public/`, rebuild and deploy
   - **HTML tag**: Add meta tag to `index.html`
   - **DNS TXT record**: Add TXT record in Cloudflare DNS

3. **Submit sitemap**:
   ```
   Sitemaps → Add new sitemap
   URL: https://yourdomain.com/sitemap.xml
   → Submit
   ```

4. **Request indexing** for key pages:
   - Homepage: `https://yourdomain.com/`
   - Patterns directory: `https://yourdomain.com/patterns`
   - Chain-of-Reasoning: `https://yourdomain.com/patterns/chain-of-reasoning`

### Optional: Google Analytics

If you want usage analytics:

1. **Create GA4 property**: https://analytics.google.com
2. **Get Measurement ID**: (e.g., `G-XXXXXXXXXX`)
3. **Add to index.html** (before `</head>`):
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

### Optional: Cloudflare Web Analytics

Free, privacy-friendly alternative to Google Analytics:

1. **Enable in Cloudflare**:
   ```
   Cloudflare Dashboard → Your domain → Analytics → Web Analytics
   → Enable
   → Copy JavaScript snippet
   ```

2. **Add to index.html** (before `</body>`):
   ```html
   <!-- Cloudflare Web Analytics -->
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "your-token-here"}'></script>
   ```

---

## 6. Final Testing

### Functional Testing

- [ ] **Homepage loads**: `https://yourdomain.com/`
- [ ] **Patterns page loads**: `https://yourdomain.com/patterns`
- [ ] **Chain-of-Reasoning demo works**: `https://yourdomain.com/patterns/chain-of-reasoning`
  - [ ] Reasoning steps populate correctly
  - [ ] Network Inspector shows events
  - [ ] Speed controls work (Fast/Normal/Slow)
  - [ ] Reset button works
  - [ ] Error simulation works
- [ ] **Navigation works** (React Router client-side routing)
- [ ] **Assets load** (JS, CSS, images)

### Cross-Browser Testing

Test on:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)

### Performance Testing

```bash
# Lighthouse audit
npx lighthouse https://yourdomain.com --view

# Check Core Web Vitals
# Should score 90+ on:
# - Performance
# - Accessibility
# - Best Practices
# - SEO
```

### Social Media Preview Testing

1. **Facebook Sharing Debugger**:
   ```
   https://developers.facebook.com/tools/debug/
   → Enter URL: https://yourdomain.com
   → Scrape Again (if previously cached)
   ```

   **Expected**:
   - Title: "Streaming Patterns - Educational Library for AI/LLM UX"
   - Description: "Learn production-ready streaming interface patterns..."
   - Image: StreamFlow PM logo

2. **Twitter Card Validator**:
   ```
   https://cards-dev.twitter.com/validator
   → Enter URL: https://yourdomain.com
   ```

   **Expected**:
   - Card type: Summary with Large Image
   - Title and description display correctly

3. **LinkedIn Post Inspector**:
   ```
   https://www.linkedin.com/post-inspector/
   → Enter URL: https://yourdomain.com
   ```

### Accessibility Testing

```bash
# Run axe accessibility audit
npm install -g @axe-core/cli
axe https://yourdomain.com

# Should have 0 violations
```

---

## 7. Post-Launch Tasks

### Update Documentation

- [ ] Update README.md with real domain URL
- [ ] Update CONTRIBUTING.md with deployment instructions
- [ ] Update package.json `homepage` field

**Example**:
```json
{
  "name": "streaming-patterns",
  "version": "0.1.0",
  "homepage": "https://yourdomain.com",
  ...
}
```

### Monitoring Setup

Add domain to monitoring services:

1. **Uptime monitoring**: Use UptimeRobot, Pingdom, or Cloudflare monitoring
2. **Error tracking**: Optional - Sentry, Rollbar, or Cloudflare Workers Analytics

### Social Media Announcements

Prepare launch announcements:

- [ ] Twitter/X post with demo link
- [ ] LinkedIn post with explanation
- [ ] Dev.to / Medium article (optional)
- [ ] Hacker News "Show HN" post (optional)

**Template**:
```
🚀 Launching Streaming Patterns - an educational library for AI/LLM UX!

Learn production-ready streaming interface patterns with:
✅ Interactive demos
✅ Mock streaming infrastructure
✅ Annotated source code
✅ Real-world PM scenarios

Check it out: https://yourdomain.com

Built with React, TypeScript, Cloudflare Workers
```

### Cleanup Old Workers.dev URL

Once custom domain is working:

1. **Disable workers.dev**:
   ```toml
   # wrangler.toml
   workers_dev = false
   ```

2. **Deploy**:
   ```bash
   wrangler deploy
   ```

3. **Verify old URL is disabled**:
   ```bash
   curl -I https://streaming-patterns-production.teddy1340.workers.dev
   # Should return 403 or redirect
   ```

---

## Quick Reference: Deployment Commands

```bash
# Full deployment pipeline
npm run build          # Build production assets
npm test              # Run tests
npm run perf:check    # Check bundle sizes
wrangler deploy       # Deploy to Cloudflare

# Or use combined command
npm run build:check && wrangler deploy
```

---

## Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN" Error

**Cause**: DNS not propagated yet
**Solution**: Wait 24-48 hours, or check nameservers:
```bash
dig +short NS yourdomain.com
```

### "ERR_TOO_MANY_REDIRECTS" Error

**Cause**: SSL/TLS mode incorrect
**Solution**: Set to "Full (strict)" in Cloudflare:
```
Cloudflare Dashboard → SSL/TLS → Overview → Full (strict)
```

### Assets Not Loading (404 errors)

**Cause**: Routes not configured correctly
**Solution**: Verify routes in `wrangler.toml` match your domain

### Old Content Showing

**Cause**: Browser cache
**Solution**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

---

## Checklist Summary

### Pre-Deployment
- [ ] Domain purchased and added to Cloudflare
- [ ] DNS nameservers updated at registrar
- [ ] DNS records configured in Cloudflare
- [ ] `wrangler.toml` updated with custom domain
- [ ] All SEO URLs updated (index.html, robots.txt, sitemap.xml)

### Deployment
- [ ] Run `npm run build`
- [ ] Run `npm test` (all passing)
- [ ] Run `wrangler deploy`
- [ ] Verify deployment on custom domain

### Post-Deployment
- [ ] SSL/TLS verified
- [ ] Security headers verified
- [ ] Google Search Console set up
- [ ] Sitemap submitted
- [ ] Social media previews tested
- [ ] Cross-browser testing complete
- [ ] Performance audit passed (90+ Lighthouse score)
- [ ] Documentation updated
- [ ] Workers.dev URL disabled

---

**Status**: Ready for custom domain configuration
**Next Step**: Purchase domain and follow Section 1 (Domain & DNS Setup)
