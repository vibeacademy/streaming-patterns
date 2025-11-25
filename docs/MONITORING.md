# Monitoring & Observability Guide

## Overview
This document describes the monitoring and observability infrastructure for the Streaming Patterns application, including how to access dashboards, interpret metrics, and set up alerts.

**Last Updated**: November 25, 2025

---

## Table of Contents
1. [Monitoring Architecture](#monitoring-architecture)
2. [Cloudflare Web Analytics](#cloudflare-web-analytics)
3. [Cloudflare Workers Analytics](#cloudflare-workers-analytics)
4. [Error Tracking](#error-tracking)
5. [Performance Monitoring](#performance-monitoring)
6. [Uptime Monitoring](#uptime-monitoring)
7. [Real-Time Logs](#real-time-logs)
8. [Alerts & Notifications](#alerts--notifications)
9. [Dashboards](#dashboards)
10. [Metrics Reference](#metrics-reference)

---

## Monitoring Architecture

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Application                   │
│              https://streamingpatterns.com                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┬──────────────┐
        │                          │              │
        ▼                          ▼              ▼
┌───────────────┐      ┌────────────────┐  ┌──────────────┐
│   Cloudflare  │      │  Client-Side   │  │   Cloudflare │
│ Web Analytics │      │ Error Tracking │  │   Workers    │
│   (Beacon)    │      │  (JavaScript)  │  │  Analytics   │
└───────────────┘      └────────────────┘  └──────────────┘
        │                      │                    │
        └──────────┬───────────┴───────┬────────────┘
                   │                   │
                   ▼                   ▼
        ┌─────────────────┐  ┌──────────────────┐
        │  Cloudflare     │  │  Lighthouse CI   │
        │  Dashboard      │  │  (GitHub Actions)│
        └─────────────────┘  └──────────────────┘
```

### Monitoring Layers

1. **User Analytics**: Cloudflare Web Analytics
2. **Application Performance**: Web Vitals, Lighthouse CI
3. **Error Tracking**: JavaScript error tracking, ErrorBoundary
4. **Infrastructure**: Cloudflare Workers Analytics
5. **Uptime**: External uptime monitor (recommended)

---

## Cloudflare Web Analytics

### Overview
Cloudflare Web Analytics provides privacy-first analytics without cookies or tracking user behavior.

### Access
- **URL**: https://dash.cloudflare.com → Analytics & Logs → Web Analytics
- **Account**: vibeacademy
- **Site**: streamingpatterns.com

### Setup

#### 1. Verify Beacon Installation

Check that `index.html` includes the analytics beacon:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

#### 2. Get Token

If token is not set up:
1. Go to Cloudflare dashboard
2. Analytics & Logs → Web Analytics
3. Click "Add a site" (if not already added)
4. Copy the beacon script with token
5. Update `index.html` with correct token
6. Commit and deploy

### Metrics Available

#### Traffic Metrics
- **Page Views**: Total number of pages viewed
- **Unique Visitors**: Number of distinct visitors (privacy-preserving)
- **Visits**: Number of sessions

#### Engagement Metrics
- **Time on Site**: Average time users spend on site
- **Page Load Time**: Average page load duration
- **Core Web Vitals**: LCP, FID, CLS (aggregate)

#### Content Metrics
- **Top Pages**: Most viewed pages/patterns
- **Top Referrers**: Traffic sources
- **Top Countries**: Geographic distribution

#### Device Metrics
- **Browser Distribution**: Chrome, Firefox, Safari, etc.
- **OS Distribution**: Windows, macOS, Linux, etc.
- **Device Type**: Desktop, Mobile, Tablet

### How to Use

#### Check Daily Traffic
1. Go to Cloudflare dashboard → Web Analytics
2. Select last 24 hours
3. Review:
   - ✅ Page views trending up?
   - ✅ Unique visitors growing?
   - ⚠️ Any anomalies (sudden spikes/drops)?

#### Identify Popular Patterns
1. Click "Page Views" tab
2. Sort by "Views"
3. See which patterns users prefer
4. Use data to prioritize future patterns

#### Detect Performance Issues
1. Check "Core Web Vitals" section
2. Look for:
   - LCP >2.5s (poor)
   - FID >100ms (poor)
   - CLS >0.1 (poor)
3. If poor metrics → investigate (see Performance Monitoring)

### Troubleshooting

#### No Data Showing
- **Cause**: Beacon not installed or token incorrect
- **Fix**:
  1. Check Network tab in browser DevTools
  2. Look for request to `static.cloudflareinsights.com`
  3. If missing, verify beacon script in `index.html`
  4. Verify token is correct

#### Data Delayed
- **Cause**: Analytics data has ~5-10 minute delay
- **Expected**: Not real-time, wait 10-15 minutes

---

## Cloudflare Workers Analytics

### Overview
Cloudflare Workers Analytics provides request-level metrics for the Workers runtime.

### Access
- **URL**: https://dash.cloudflare.com → Workers & Pages → streaming-patterns → Analytics
- **Scope**: Worker requests, CPU time, errors

### Metrics Available

#### Request Metrics
- **Requests per Second**: Current request rate
- **Total Requests**: Total requests in selected time period
- **Request Duration**: p50, p95, p99 latency

#### Performance Metrics
- **CPU Time**: Average CPU time per request
- **Wall Clock Time**: Total request duration
- **Memory Usage**: Not directly shown (inferred from performance)

#### Error Metrics
- **Error Rate**: % of requests that errored
- **Errors by Status Code**: 4xx, 5xx breakdown

#### Quota Metrics
- **Requests Used**: Toward daily quota
- **CPU Time Used**: Toward daily CPU quota

### How to Use

#### Check Performance Baselines
1. Go to Workers Analytics
2. Select "Last 7 days"
3. Note baseline metrics:
   - Average requests/second
   - p95 latency
   - Error rate
4. Use as comparison for anomaly detection

#### Detect Quota Issues
1. Check "Requests" graph
2. If approaching quota limit:
   - ⚠️ Consider upgrading plan
   - ⚠️ Optimize Worker code
   - ⚠️ Add caching

#### Investigate Errors
1. Check "Errors" graph
2. If error rate >1%:
   - ⚠️ Check real-time logs (see Real-Time Logs)
   - ⚠️ Look for patterns (specific routes?)
   - ⚠️ Check recent deployments

### Limits & Quotas

#### Free Plan
- 100,000 requests/day
- 10ms CPU time/request
- No Workers KV (not used currently)

#### Paid Plans
- More requests
- Higher CPU limits
- See: https://developers.cloudflare.com/workers/platform/pricing

---

## Error Tracking

### Client-Side Error Tracking

#### Architecture
All JavaScript errors are automatically captured via `src/lib/monitoring/errorTracking.ts`:

- **Global Errors**: Uncaught exceptions
- **Promise Rejections**: Unhandled promise rejections
- **React Errors**: Caught by ErrorBoundary

#### Error Data Captured
```typescript
{
  message: string;           // Error message
  stack: string;             // Stack trace
  name: string;              // Error type
  severity: 'error' | 'fatal'; // Severity level
  timestamp: number;         // When it occurred
  url: string;               // Page URL
  userAgent: string;         // Browser info
  componentStack?: string;   // React component stack (if applicable)
  context?: {                // Additional context
    component?: string;
    action?: string;
  }
}
```

#### How to View Errors

**Development Mode**:
1. Open browser DevTools → Console
2. Errors logged as `[Error Tracking] { ... }`

**Production Mode**:
- Currently logged to browser console
- Future: Send to external service (Sentry, etc.)

#### Testing Error Tracking

```javascript
// Test global error
throw new Error('Test error');

// Test unhandled promise rejection
Promise.reject(new Error('Test rejection'));

// Test React error
// (Add a button that throws in a component)
```

### ErrorBoundary Integration

The `ErrorBoundary` component automatically reports all React rendering errors:

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Features:
- Catches all React errors in child tree
- Displays fallback UI to user
- Reports error to error tracking service
- Provides "Try Again" functionality

### Future: External Error Tracking

For production, consider integrating an external service:

#### Option 1: Sentry
```typescript
// In src/lib/monitoring/errorTracking.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_DSN_HERE',
  environment: process.env.NODE_ENV,
  sampleRate: 1.0
});

// In reportToService()
Sentry.captureException(error);
```

#### Option 2: Cloudflare Workers Analytics Logs
- Send errors to Worker endpoint
- Store in Workers KV or Durable Objects
- Query via dashboard

---

## Performance Monitoring

### Web Vitals (Real User Monitoring)

#### Architecture
Web Vitals are tracked client-side via `src/lib/monitoring/webVitals.ts`.

#### Metrics Tracked

1. **LCP (Largest Contentful Paint)**
   - **Definition**: Time for largest content element to render
   - **Goal**: <2.5s
   - **Poor**: >4.0s

2. **FID (First Input Delay)**
   - **Definition**: Time from first interaction to browser response
   - **Goal**: <100ms
   - **Poor**: >300ms

3. **CLS (Cumulative Layout Shift)**
   - **Definition**: Visual stability score (0 = no shifts)
   - **Goal**: <0.1
   - **Poor**: >0.25

4. **INP (Interaction to Next Paint)**
   - **Definition**: Responsiveness to user interactions
   - **Goal**: <200ms
   - **Poor**: >500ms

5. **TTFB (Time to First Byte)**
   - **Definition**: Server response time
   - **Goal**: <800ms
   - **Poor**: >1800ms

6. **FCP (First Contentful Paint)**
   - **Definition**: Time for first content to render
   - **Goal**: <1.8s
   - **Poor**: >3.0s

#### How to View Metrics

**Development Mode**:
1. Open browser console
2. Navigate to homepage
3. Look for logs: `[Web Vitals] LCP: 1200.50ms (good)`

**Production Mode**:
- Aggregate data shown in Cloudflare Web Analytics
- Individual metrics logged to console (future: send to analytics service)

#### Interpreting Metrics

**Good Performance**:
```
[Web Vitals] LCP: 1800ms (good)
[Web Vitals] FID: 50ms (good)
[Web Vitals] CLS: 0.05 (good)
```

**Poor Performance**:
```
[Web Vitals] LCP: 4500ms (poor)  ⚠️ Investigate!
[Web Vitals] CLS: 0.3 (poor)     ⚠️ Layout shifts!
```

### Lighthouse CI

#### Overview
Lighthouse CI runs automated performance audits on every PR and production deployment.

#### Access
- **GitHub Actions**: https://github.com/vibeacademy/streaming-patterns/actions
- **Workflow**: "Lighthouse CI"
- **Results**: Download artifacts from workflow runs

#### Performance Budgets

Defined in `lighthouserc.json`:

```json
{
  "categories:performance": 90,        // Performance score ≥90
  "first-contentful-paint": 2000,      // FCP <2s
  "largest-contentful-paint": 2500,    // LCP <2.5s
  "cumulative-layout-shift": 0.1,      // CLS <0.1
  "total-blocking-time": 300,          // TBT <300ms
  "speed-index": 3000                  // Speed Index <3s
}
```

#### How to Use

**Check PR Performance**:
1. Open PR in GitHub
2. Scroll to checks
3. Look for "Lighthouse CI" check
4. If ❌ failed → performance regression detected
5. Download artifacts to see detailed report

**Fix Performance Regressions**:
1. Download Lighthouse HTML report
2. Open in browser
3. Review "Opportunities" and "Diagnostics" sections
4. Fix issues
5. Re-run CI

---

## Uptime Monitoring

### Recommended Setup

We recommend setting up external uptime monitoring:

### UptimeRobot Setup (Free)

1. **Create Account**: https://uptimerobot.com
2. **Add Monitor**:
   - Monitor Type: HTTP(s)
   - URL: `https://streamingpatterns.com`
   - Friendly Name: "Streaming Patterns - Homepage"
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email

3. **Add Pattern Demo Monitor**:
   - URL: `https://streamingpatterns.com/patterns/chain-of-reasoning`
   - Friendly Name: "Streaming Patterns - Chain of Reasoning Demo"

4. **Configure Alerts**:
   - Email: Immediate notification
   - Slack (optional): Integration for team awareness

### Interpreting Uptime Data

**Healthy Status**:
- ✅ "Up" status
- Response time <500ms
- 100% uptime over last 24h

**Degraded Status**:
- ⚠️ Response time >1000ms
- ⚠️ Uptime <99.9% over last 30 days
- Action: Investigate performance (see Performance Monitoring)

**Down Status**:
- ❌ "Down" status
- Action: **IMMEDIATE** investigation (see Operations Runbook)

---

## Real-Time Logs

### Cloudflare Workers Logs

#### Access via Wrangler

```bash
# Install wrangler (if not installed)
npm install -g wrangler

# Authenticate (first time only)
wrangler login

# Tail logs in real-time
cd streaming-patterns
npm run worker:tail
```

#### Filter Logs

```bash
# Filter for errors only
npm run worker:tail | grep ERROR

# Filter for specific route
npm run worker:tail | grep "/patterns/chain-of-reasoning"

# Save logs to file
npm run worker:tail > logs/$(date +%Y%m%d-%H%M%S).log
```

#### Log Format

```
[2025-11-25 13:00:00] INFO: Request to /patterns/chain-of-reasoning
[2025-11-25 13:00:01] DEBUG: Rendering pattern demo
[2025-11-25 13:00:02] ERROR: Failed to load fixture data
```

### When to Use Real-Time Logs

- ✅ Investigating production errors
- ✅ Debugging deployment issues
- ✅ Monitoring high-traffic events
- ❌ General monitoring (use dashboards instead)

---

## Alerts & Notifications

### Alert Types

#### Critical Alerts (P0)
- **Site Down**: Uptime monitor detects downtime
- **High Error Rate**: Workers error rate >5%
- **Quota Exceeded**: Cloudflare quota limit reached

#### Warning Alerts (P1)
- **Performance Degradation**: LCP >4s
- **Error Rate Elevated**: Workers error rate >1%
- **Quota Approaching**: 80% of quota used

### Alert Channels

#### Email
- Primary channel for all alerts
- Fastest notification
- Configure in uptime monitor settings

#### Slack (Optional)
- Team awareness
- Integration with UptimeRobot or custom webhooks

#### SMS (Optional)
- Critical P0 alerts only
- Available in paid uptime monitor plans

### Alert Configuration

**UptimeRobot Email Alerts**:
1. Settings → Alert Contacts
2. Add email addresses
3. Enable "Send alerts even when down for a short time"
4. Set cool-down period: 5 minutes

**Slack Integration** (optional):
1. Create Slack webhook URL
2. UptimeRobot → Integrations → Slack
3. Add webhook URL
4. Test integration

---

## Dashboards

### Single Pane of Glass

Since we use multiple monitoring tools, create a central dashboard page:

#### Recommended Tools
- **Grafana**: Aggregate metrics from multiple sources
- **Simple HTML Dashboard**: Links to all monitoring tools

#### Dashboard Links

```html
<!DOCTYPE html>
<html>
<head>
  <title>Streaming Patterns - Monitoring Dashboard</title>
</head>
<body>
  <h1>Streaming Patterns Monitoring</h1>

  <h2>Quick Links</h2>
  <ul>
    <li><a href="https://streamingpatterns.com">Production Site</a></li>
    <li><a href="https://dash.cloudflare.com">Cloudflare Dashboard</a></li>
    <li><a href="https://github.com/vibeacademy/streaming-patterns/actions">GitHub Actions</a></li>
    <li><a href="https://uptimerobot.com/dashboard">Uptime Monitor</a></li>
  </ul>

  <h2>Metrics</h2>
  <iframe src="https://dash.cloudflare.com/..." width="100%" height="600"></iframe>
</body>
</html>
```

---

## Metrics Reference

### Key Performance Indicators (KPIs)

| Metric | Target | Warning | Critical | Source |
|--------|--------|---------|----------|--------|
| **Availability** | 99.9% | <99.5% | <99.0% | Uptime Monitor |
| **LCP** | <2.5s | 2.5-4s | >4s | Web Vitals |
| **FID** | <100ms | 100-300ms | >300ms | Web Vitals |
| **CLS** | <0.1 | 0.1-0.25 | >0.25 | Web Vitals |
| **TTFB** | <800ms | 800-1800ms | >1800ms | Web Vitals / Workers Analytics |
| **Error Rate** | <0.1% | 0.1-1% | >1% | Error Tracking / Workers Analytics |
| **Requests/sec** | Baseline | 2x baseline | 5x baseline | Workers Analytics |

### Metric Glossary

**Availability**: Percentage of time the site is accessible (200 OK responses)

**LCP (Largest Contentful Paint)**: Time for the largest visible element to load

**FID (First Input Delay)**: Time from first user interaction to browser response

**CLS (Cumulative Layout Shift)**: Visual stability score (how much content shifts)

**TTFB (Time to First Byte)**: Server response time

**Error Rate**: Percentage of requests that result in errors

**Requests/sec**: Number of HTTP requests per second

---

## Monitoring Checklist

### Daily
- [ ] Check Cloudflare Web Analytics for anomalies
- [ ] Review error logs (if any errors reported)
- [ ] Verify uptime monitor shows "Up"

### Weekly
- [ ] Review Lighthouse CI results from recent PRs
- [ ] Check Web Vitals trends
- [ ] Review error rate trends
- [ ] Check Workers Analytics quota usage

### Monthly
- [ ] Full SLO review (availability, performance, error rate)
- [ ] Review alert effectiveness (false positives?)
- [ ] Update performance budgets if needed
- [ ] Audit monitoring coverage (are we tracking what matters?)

---

## Troubleshooting Common Monitoring Issues

### Issue: Web Vitals Not Tracking

**Symptoms**: No Web Vitals logs in console

**Cause**: PerformanceObserver API not available (old browser) or tracking not initialized

**Fix**:
1. Check `src/main.tsx` calls `initWebVitals()`
2. Test in modern browser (Chrome, Firefox, Safari)
3. Check browser console for errors

---

### Issue: Lighthouse CI Failing

**Symptoms**: Lighthouse CI check fails in GitHub Actions

**Cause**: Performance regression or budget threshold too strict

**Fix**:
1. Download Lighthouse artifacts
2. Review detailed report
3. Fix performance issues OR adjust budgets in `lighthouserc.json`

---

### Issue: High Error Rate in Workers

**Symptoms**: Workers Analytics shows elevated error rate

**Cause**: Application errors, Worker script errors, or quota exceeded

**Fix**:
1. Check real-time logs: `npm run worker:tail`
2. Look for error patterns
3. Check recent deployments (rollback if needed)
4. Check quota usage

---

## Additional Resources

- **Cloudflare Analytics Docs**: https://developers.cloudflare.com/analytics/
- **Web Vitals Guide**: https://web.dev/vitals/
- **Lighthouse Docs**: https://developer.chrome.com/docs/lighthouse/
- **Workers Analytics**: https://developers.cloudflare.com/workers/observability/
- **Error Tracking Best Practices**: https://docs.sentry.io/platforms/javascript/

---

**Document Version**: 1.0
**Last Updated**: November 25, 2025
**Next Review**: December 25, 2025
