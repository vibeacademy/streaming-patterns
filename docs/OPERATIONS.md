# Operations Runbook

## Overview
This document provides operational procedures for monitoring, troubleshooting, and maintaining the Streaming Patterns production application.

**Last Updated**: November 25, 2025
**Production URL**: https://streamingpatterns.com
**Deployment Platform**: Cloudflare Pages + Workers

---

## Table of Contents
1. [Monitoring Dashboard](#monitoring-dashboard)
2. [Incident Response](#incident-response)
3. [Common Issues & Fixes](#common-issues--fixes)
4. [Deployment Procedures](#deployment-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Performance Monitoring](#performance-monitoring)
7. [Error Tracking](#error-tracking)
8. [Uptime Monitoring](#uptime-monitoring)
9. [SLOs & SLIs](#slos--slis)
10. [On-Call Guide](#on-call-guide)
11. [Escalation Paths](#escalation-paths)

---

## Monitoring Dashboard

### Access All Monitoring Tools

#### Cloudflare Dashboard
- **URL**: https://dash.cloudflare.com
- **Location**: vibeacademy account → Pages → streaming-patterns
- **Metrics Available**:
  - Request volume
  - Bandwidth usage
  - Build success/failure rates
  - Deployment history

#### Cloudflare Workers Analytics
- **URL**: https://dash.cloudflare.com → Workers & Pages → streaming-patterns → Analytics
- **Metrics Available**:
  - Requests per second
  - CPU time per request
  - Error rates
  - Request duration (p50, p95, p99)
  - Worker quota usage

#### Cloudflare Web Analytics
- **URL**: https://dash.cloudflare.com → Analytics & Logs → Web Analytics
- **Metrics Available**:
  - Page views
  - Unique visitors
  - Top pages
  - Traffic sources
  - Geographic distribution
  - Device types

#### GitHub Actions
- **URL**: https://github.com/vibeacademy/streaming-patterns/actions
- **Monitors**:
  - CI/CD pipeline status
  - Test results
  - Build status
  - Lighthouse CI scores
  - Deployment status

#### Lighthouse CI Results
- **Location**: GitHub Actions artifacts
- **Access**: Actions tab → Lighthouse CI workflow → Download artifacts
- **Metrics**:
  - Performance scores
  - Core Web Vitals (LCP, FID, CLS)
  - Accessibility scores
  - Best practices scores
  - SEO scores

---

## Incident Response

### Incident Severity Levels

#### P0 - Critical
- **Definition**: Complete service outage, all users affected
- **Examples**: Site down, DNS failure, Cloudflare outage
- **Response Time**: Immediate
- **Resolution Target**: <1 hour

#### P1 - High
- **Definition**: Major functionality broken, significant user impact
- **Examples**: Pattern demos not loading, broken navigation, high error rate
- **Response Time**: <15 minutes
- **Resolution Target**: <4 hours

#### P2 - Medium
- **Definition**: Minor functionality broken, limited user impact
- **Examples**: Network inspector issues, styling bugs, slow performance
- **Response Time**: <1 hour
- **Resolution Target**: <24 hours

#### P3 - Low
- **Definition**: Cosmetic issues, no user impact
- **Examples**: Typos, minor UI glitches
- **Response Time**: Next business day
- **Resolution Target**: <1 week

### Incident Response Process

#### Step 1: Detection & Assessment (0-5 minutes)
1. **Receive Alert** (from uptime monitor, user report, or automated monitoring)
2. **Verify Issue**:
   ```bash
   # Check if site is accessible
   curl -I https://streamingpatterns.com

   # Check specific pattern
   curl -I https://streamingpatterns.com/patterns/chain-of-reasoning
   ```
3. **Determine Severity** (P0, P1, P2, P3)
4. **Create Incident Channel** (Slack #incidents or GitHub issue)

#### Step 2: Mitigation (5-15 minutes)
1. **Quick Fixes**:
   - If deployment caused issue → **Rollback immediately** (see Rollback Procedures)
   - If DNS issue → Check Cloudflare DNS settings
   - If quota exceeded → Upgrade Cloudflare plan or wait for reset
2. **Communicate Status**:
   - Post to status page (if available)
   - Update incident channel
   - Notify stakeholders

#### Step 3: Investigation (15-60 minutes)
1. **Check Logs**:
   ```bash
   # Real-time Worker logs
   cd streaming-patterns
   npm run worker:tail

   # Filter for errors
   npm run worker:tail | grep ERROR
   ```
2. **Check Cloudflare Dashboard**:
   - Recent deployments
   - Error rates
   - Traffic patterns
3. **Check GitHub Actions**:
   - Recent workflow runs
   - Test failures
   - Build errors
4. **Check Browser Console** (for client-side errors):
   - Open https://streamingpatterns.com
   - Open DevTools → Console
   - Look for JavaScript errors

#### Step 4: Resolution
1. **Fix Root Cause**:
   - Deploy hotfix (see Deployment Procedures)
   - Revert configuration change
   - Scale resources if needed
2. **Verify Fix**:
   ```bash
   # Test production site
   curl https://streamingpatterns.com

   # Test pattern demos
   curl https://streamingpatterns.com/patterns/chain-of-reasoning
   ```
3. **Monitor for 30 minutes** to ensure stability

#### Step 5: Post-Incident Review
1. **Document Incident**:
   - What happened?
   - When did it happen?
   - How was it detected?
   - What was the impact?
   - How was it resolved?
   - How long did it take?
2. **Root Cause Analysis**:
   - What was the underlying cause?
   - Why did it happen?
   - How can we prevent it?
3. **Action Items**:
   - Create GitHub issues for preventive measures
   - Update runbook with lessons learned
   - Improve monitoring/alerting

---

## Common Issues & Fixes

### Issue: Site Returns 404 for All Routes

**Symptoms**:
- Homepage loads but pattern routes return 404
- Deployment succeeded but routes broken

**Cause**: Cloudflare Pages routing configuration missing or incorrect

**Fix**:
1. Check `_routes.json` exists in `dist/` after build
2. Verify `_routes.json` includes all pattern routes:
   ```bash
   cat dist/_routes.json
   ```
3. If missing, verify build script generates it:
   ```bash
   npm run build
   ls -la dist/_routes.json
   ```
4. Redeploy if needed

**Prevention**:
- Add test to CI that verifies `_routes.json` exists
- Add smoke test that checks pattern routes

---

### Issue: High Error Rate in Workers Analytics

**Symptoms**:
- Workers Analytics shows >1% error rate
- Users report errors loading site

**Cause**: JavaScript errors, API failures, or Worker script errors

**Investigation**:
1. Check real-time logs:
   ```bash
   npm run worker:tail
   ```
2. Look for error patterns in Cloudflare dashboard
3. Check browser console for client-side errors
4. Review recent deployments

**Fix**:
- If recent deployment caused it → **Rollback**
- If specific route causes errors → Disable/fix that route
- If Worker quota exceeded → Upgrade plan

---

### Issue: Slow Performance (LCP > 2.5s)

**Symptoms**:
- Lighthouse CI fails performance checks
- Users report slow page loads
- Web Vitals show poor LCP

**Investigation**:
1. Check Lighthouse CI results in GitHub Actions
2. Check Web Vitals metrics in Cloudflare Analytics
3. Test locally:
   ```bash
   npm run build
   npm run preview
   # Test in browser DevTools → Performance tab
   ```

**Causes & Fixes**:
- **Large bundle size**:
  ```bash
  npm run build
  ls -lh dist/assets/*.js
  # If bundles >500KB, investigate code splitting
  ```
- **Missing lazy loading**: Add React.lazy() for pattern routes
- **Unoptimized images**: Convert to WebP, add lazy loading
- **Blocking resources**: Defer non-critical scripts

---

### Issue: Deployment Fails in CI

**Symptoms**:
- GitHub Actions workflow fails
- Build or test errors

**Investigation**:
1. Check GitHub Actions logs
2. Common failures:
   - **Linting errors**: `npm run lint`
   - **Type errors**: `npm run type-check`
   - **Test failures**: `npm test`
   - **Build errors**: `npm run build`

**Fix**:
```bash
# Run checks locally
npm run lint
npm run type-check
npm test
npm run build

# Fix issues and commit
git add .
git commit -m "fix: resolve CI errors"
git push
```

---

### Issue: Cloudflare Web Analytics Not Tracking

**Symptoms**:
- Zero page views in Cloudflare Web Analytics
- Analytics dashboard shows no data

**Cause**: Analytics beacon not installed or blocked

**Investigation**:
1. Check `index.html` contains analytics script:
   ```bash
   grep "cloudflareinsights" index.html
   ```
2. Check browser DevTools → Network tab for beacon requests
3. Check if ad blocker is blocking beacon

**Fix**:
1. Verify analytics token is correct in `index.html`
2. Ensure script is before `</head>` tag
3. Test with ad blocker disabled

---

## Deployment Procedures

### Standard Deployment (via Pull Request)

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes & Test**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Create Pull Request** targeting `main`

4. **Wait for CI** to pass:
   - ✅ Linting
   - ✅ Type checking
   - ✅ Tests
   - ✅ Build
   - ✅ Lighthouse CI (optional: review performance scores)

5. **Merge PR** → Triggers automatic deployment to production

6. **Verify Deployment**:
   ```bash
   # Wait 2-3 minutes for deployment
   curl -I https://streamingpatterns.com

   # Check deployment status
   # Visit: https://dash.cloudflare.com → Pages → streaming-patterns
   ```

7. **Monitor for 30 minutes**:
   - Check error rates in Workers Analytics
   - Check Web Vitals
   - Test pattern demos manually

### Hotfix Deployment

For critical production issues requiring immediate fix:

1. **Create Hotfix Branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. **Make Minimal Fix** (only what's needed)

3. **Test Locally**:
   ```bash
   npm test
   npm run build
   npm run preview
   ```

4. **Push & Create PR** with "[HOTFIX]" prefix:
   ```bash
   git commit -m "[HOTFIX] Fix critical issue"
   git push origin hotfix/critical-fix
   ```

5. **Fast-Track Review**:
   - Label PR as "urgent"
   - Tag reviewer for immediate attention
   - Skip non-critical checks if needed

6. **Merge & Deploy** (production deployment happens automatically)

7. **Verify Fix**:
   ```bash
   curl https://streamingpatterns.com
   # Test affected feature
   ```

8. **Monitor Closely** for 1 hour

---

## Rollback Procedures

### Scenario 1: Rollback via Cloudflare Dashboard (Fastest)

**When to Use**: Latest deployment broke production, need immediate rollback

**Steps**:
1. Go to https://dash.cloudflare.com
2. Navigate to **Pages** → **streaming-patterns**
3. Click **View Builds** tab
4. Find last known-good deployment
5. Click **...** (three dots) → **Rollback to this deployment**
6. Confirm rollback
7. Wait 1-2 minutes for rollback to complete
8. **Verify**:
   ```bash
   curl -I https://streamingpatterns.com
   ```

**Time**: ~3-5 minutes

---

### Scenario 2: Rollback via Git Revert

**When to Use**: Need to revert specific changes and redeploy

**Steps**:
1. **Identify Bad Commit**:
   ```bash
   git log --oneline -10
   ```

2. **Revert Commit**:
   ```bash
   git revert <bad-commit-sha>
   # Example: git revert abc1234
   ```

3. **Push Revert**:
   ```bash
   git push origin main
   ```

4. **Wait for Auto-Deploy** (GitHub Actions will trigger deployment)

5. **Verify**:
   ```bash
   curl https://streamingpatterns.com
   ```

**Time**: ~5-10 minutes (includes build time)

---

### Scenario 3: Emergency Rollback with Force Push

**When to Use**: ONLY in extreme emergencies, multiple bad commits

**WARNING**: This rewrites history. Coordinate with team first.

**Steps**:
1. **Find Last Good Commit**:
   ```bash
   git log --oneline -20
   ```

2. **Create Backup Branch**:
   ```bash
   git branch backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **Hard Reset to Good Commit**:
   ```bash
   git reset --hard <good-commit-sha>
   ```

4. **Force Push** (⚠️ DANGEROUS):
   ```bash
   git push origin main --force-with-lease
   ```

5. **Verify Deployment**

**Time**: ~5-10 minutes

---

## Performance Monitoring

### Core Web Vitals Tracking

**Client-Side Tracking**:
- Web Vitals are tracked automatically via `src/lib/monitoring/webVitals.ts`
- Metrics logged to console in development
- Production: metrics sent to Cloudflare Analytics (future)

**Monitored Metrics**:
- **LCP** (Largest Contentful Paint): <2.5s goal
- **FID** (First Input Delay): <100ms goal
- **CLS** (Cumulative Layout Shift): <0.1 goal
- **INP** (Interaction to Next Paint): <200ms goal
- **TTFB** (Time to First Byte): <800ms goal
- **FCP** (First Contentful Paint): <1.8s goal

**How to Check**:
1. Open https://streamingpatterns.com
2. Open DevTools → Console
3. Look for `[Web Vitals]` logs

**Lighthouse CI**:
- Runs automatically on every PR
- Results available in GitHub Actions artifacts
- Performance budgets defined in `lighthouserc.json`

---

## Error Tracking

### Client-Side Error Tracking

**Automatic Tracking**:
- All JavaScript errors tracked via `src/lib/monitoring/errorTracking.ts`
- React errors caught by ErrorBoundary
- Unhandled promise rejections tracked

**Error Tracking Features**:
- Error name, message, and stack trace
- Component stack (for React errors)
- URL where error occurred
- User agent
- Timestamp

**How to View Errors**:
1. **Development**: Check browser console
2. **Production**: Currently logged to console (future: external service)

**Testing Error Tracking**:
```javascript
// In browser console
throw new Error('Test error');

// Or trigger React error
// (Add a button that throws in a component)
```

---

## Uptime Monitoring

### Recommended Setup

We recommend using a third-party uptime monitoring service:

#### Option 1: UptimeRobot (Free Tier)
1. Create account at https://uptimerobot.com
2. Add monitor:
   - **Type**: HTTP(s)
   - **URL**: https://streamingpatterns.com
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Your email
3. Add secondary monitor for pattern demo:
   - **URL**: https://streamingpatterns.com/patterns/chain-of-reasoning

#### Option 2: Pingdom (Paid)
- More features, detailed reports
- https://www.pingdom.com

#### Option 3: Cloudflare Health Checks (Paid)
- Integrated with Cloudflare dashboard
- https://developers.cloudflare.com/health-checks/

### Alert Channels
- **Email**: Immediate notification for downtime
- **Slack**: Optional integration for team awareness
- **SMS**: For critical P0 incidents (optional)

---

## SLOs & SLIs

### Service Level Objectives (SLOs)

#### Availability
- **Target**: 99.9% uptime
- **Measurement Window**: 30 days
- **Allowed Downtime**: ~43 minutes/month

#### Performance
- **LCP**: <2.5s for 90% of page loads
- **FID**: <100ms for 95% of interactions
- **CLS**: <0.1 for 95% of page views

#### Error Rate
- **Client Errors**: <0.1% of page views
- **Worker Errors**: <0.5% of requests

#### Latency
- **TTFB**: <800ms for 95% of requests
- **Page Load**: <3s for 90% of page loads

### Service Level Indicators (SLIs)

#### How to Measure

**Availability**:
- Uptime monitor dashboard
- Cloudflare Pages uptime percentage

**Performance**:
- Lighthouse CI results (automated)
- Web Vitals metrics (real user monitoring)
- Cloudflare Workers Analytics (request duration)

**Error Rate**:
- Error tracking console logs
- Cloudflare Workers Analytics (error %)
- GitHub Actions test failure rate

**Latency**:
- Cloudflare Workers Analytics (p50, p95, p99)
- Web Vitals TTFB metric

### Review Cadence
- **Daily**: Check Cloudflare dashboard for anomalies
- **Weekly**: Review SLI trends, identify degradations
- **Monthly**: Full SLO review, identify improvements

---

## On-Call Guide

### On-Call Responsibilities

- **Monitor**: Check dashboards at start and end of shift
- **Respond**: React to alerts within SLA (see Incident Response)
- **Escalate**: If issue exceeds expertise, escalate immediately
- **Document**: Log all incidents and actions taken

### On-Call Rotation
- **Duration**: 1 week per rotation
- **Handoff**: Monday 9am
- **Backup**: Always have a backup on-call

### Required Access
- Cloudflare account access
- GitHub repository access (admin)
- Alert notification channels (email, Slack)
- VPN/SSH access (if applicable)

### On-Call Checklist

**Start of Shift**:
- [ ] Verify you're receiving alerts (test)
- [ ] Check all dashboards for current status
- [ ] Review recent deployments and incidents
- [ ] Ensure you have access to all tools

**During Shift**:
- [ ] Check dashboards at least twice daily
- [ ] Respond to alerts within SLA
- [ ] Document all incidents in GitHub issues
- [ ] Escalate if needed

**End of Shift**:
- [ ] Handoff notes to next on-call
- [ ] Document any ongoing issues
- [ ] Ensure next on-call has access

### On-Call Runbook Quick Reference

**Production Down (P0)**:
1. Verify issue (curl + Cloudflare dashboard)
2. Check recent deployments → Rollback if needed
3. Post to #incidents
4. Investigate root cause
5. Document incident

**High Error Rate (P1)**:
1. Check Worker logs: `npm run worker:tail`
2. Check Cloudflare dashboard error %
3. Identify pattern (specific route? all traffic?)
4. Rollback if recent deployment
5. Fix and deploy hotfix if needed

**Performance Degradation (P2)**:
1. Check Lighthouse CI results
2. Check Web Vitals metrics
3. Check Cloudflare dashboard (traffic spike?)
4. Identify bottleneck
5. Create issue for follow-up

---

## Escalation Paths

### Level 1: On-Call Engineer (You)
- **Scope**: All incidents
- **Response Time**: Per SLA (P0: immediate, P1: 15min, etc.)
- **Escalate If**: Issue exceeds 1 hour or expertise

### Level 2: Tech Lead
- **Contact**: [Tech Lead Name/Email]
- **Scope**: Complex technical issues, architecture decisions
- **Escalate If**: Issue requires code changes beyond hotfix scope

### Level 3: Engineering Manager
- **Contact**: [Manager Name/Email]
- **Scope**: Business impact decisions, resource allocation
- **Escalate If**: Issue impacts SLOs, requires management decision

### Level 4: Cloudflare Support
- **Contact**: https://dash.cloudflare.com → Support
- **Scope**: Cloudflare platform issues (Pages, Workers, DNS)
- **Escalate If**: Cloudflare service outage or platform issue

### External Escalations

**DNS/Domain Issues**:
- Domain registrar support
- Cloudflare DNS support

**Third-Party Service Outages**:
- Check status pages: https://www.cloudflarestatus.com

---

## Appendix: Useful Commands

### Local Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment & Monitoring
```bash
# View real-time Worker logs
npm run worker:tail

# Deploy Workers (if needed)
npm run worker:deploy

# Check deployment status
curl -I https://streamingpatterns.com

# Check specific pattern
curl https://streamingpatterns.com/patterns/chain-of-reasoning
```

### Git Operations
```bash
# Check recent deployments
git log --oneline -10

# Revert a commit
git revert <commit-sha>

# Create hotfix branch
git checkout -b hotfix/issue-name

# View deployment history
git log --all --graph --decorate --oneline
```

---

## Contact Information

**Repository**: https://github.com/vibeacademy/streaming-patterns
**Production URL**: https://streamingpatterns.com
**Cloudflare Dashboard**: https://dash.cloudflare.com
**GitHub Actions**: https://github.com/vibeacademy/streaming-patterns/actions

**Team**:
- Tech Lead: [Name/Email]
- DevOps: [Name/Email]
- On-Call Schedule: [Link to schedule]

**External Support**:
- Cloudflare Support: https://dash.cloudflare.com → Support
- GitHub Support: https://support.github.com

---

**Document Version**: 1.0
**Last Updated**: November 25, 2025
**Next Review**: December 25, 2025
