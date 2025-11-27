# Production Deployment Guide

Complete guide for deploying Cloudflare Workers to production with best practices and runbooks.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Process](#deployment-process)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Incident Response](#incident-response)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] Type checking passed (`pnpm type-check`)
- [ ] Linting passed (`pnpm check`)
- [ ] Code reviewed and approved
- [ ] Dependencies up to date (`pnpm outdated`)
- [ ] No security vulnerabilities (`pnpm audit`)

### Configuration

- [ ] Environment variables configured in Cloudflare
- [ ] Secrets set via `wrangler secret put`
- [ ] Database migrations applied
- [ ] `wrangler.jsonc` reviewed
- [ ] Bindings (KV, R2, D1, Hyperdrive) configured
- [ ] Routes configured correctly

### Documentation

- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] Known issues documented
- [ ] Rollback plan documented

### Testing

- [ ] Staging deployment successful
- [ ] Integration tests passed
- [ ] Load testing completed (if applicable)
- [ ] Security scan completed

---

## Environment Configuration

### Required Environment Variables

#### Development (`.dev.vars`)

```bash
# Application
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dev_db

# Authentication
BETTER_AUTH_SECRET=your-dev-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:8787

# Optional
DEBUG=true
LOG_LEVEL=debug
```

#### Production (Cloudflare Secrets)

Set via `wrangler secret put`:

```bash
# Set secrets
echo "your-production-secret" | wrangler secret put BETTER_AUTH_SECRET
echo "postgresql://..." | wrangler secret put DATABASE_URL

# List secrets
wrangler secret list

# Delete secret (if needed)
wrangler secret delete SECRET_NAME
```

### Cloudflare Bindings

Configure in `wrangler.jsonc`:

```jsonc
{
  "name": "your-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],

  // Environment variables (non-secret)
  "vars": {
    "ENVIRONMENT": "production"
  },

  // Hyperdrive (Postgres connection pooling)
  "hyperdrive": [{
    "binding": "HYPERDRIVE",
    "id": "your-hyperdrive-id"
  }],

  // KV (key-value storage)
  "kv_namespaces": [{
    "binding": "CACHE",
    "id": "your-kv-id"
  }],

  // R2 (object storage)
  "r2_buckets": [{
    "binding": "UPLOADS",
    "bucket_name": "your-bucket"
  }],

  // D1 (SQLite)
  "d1_databases": [{
    "binding": "D1",
    "database_id": "your-d1-id",
    "database_name": "your-database"
  }],

  // Rate Limiter
  "rate_limiting": {
    "enabled": true
  }
}
```

---

## Deployment Process

### Manual Deployment

#### 1. Pre-Deployment Checks

```bash
# Run all quality checks
just check

# Run tests
just test

# Type check
just typecheck

# Build (optional - wrangler builds automatically)
just build
```

#### 2. Database Migrations

**CRITICAL: Apply migrations before deploying code**

```bash
# Review pending migrations
pnpm db:studio

# Generate migrations if needed
pnpm db:generate

# Apply migrations to production
DATABASE_URL="postgresql://..." pnpm db:migrate

# Verify migrations
psql $DATABASE_URL -c "\dt"
```

#### 3. Deploy to Staging

```bash
# Deploy to staging environment
wrangler deploy --env staging

# Verify staging deployment
curl https://staging.example.com/health

# Run smoke tests against staging
pnpm test:e2e --env=staging
```

#### 4. Deploy to Production

```bash
# Deploy specific worker
pnpm --filter example-worker deploy

# Or deploy all workers
just deploy

# Or via wrangler directly
wrangler deploy --env production
```

#### 5. Verify Deployment

```bash
# Check deployment logs
wrangler tail

# Health check
curl https://api.example.com/health

# Check version
curl https://api.example.com/version
```

### CI/CD Deployment (Recommended)

Automated via GitHub Actions:

#### Staging Deployment (on push to `main`)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Deploy to staging
        run: pnpm deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### Production Deployment (on release)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  pre-deploy-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run all checks
        run: |
          pnpm install
          pnpm check
          pnpm type-check
          pnpm test
          pnpm audit --audit-level moderate

  deploy:
    needs: [pre-deploy-checks]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: pnpm deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Post-deployment verification
        run: |
          curl -f https://api.example.com/health || exit 1
```

---

## Post-Deployment Verification

### Automated Checks

```bash
#!/bin/bash
# scripts/verify-deployment.sh

PROD_URL="https://api.example.com"

echo "Verifying deployment..."

# Health check
if ! curl -f "$PROD_URL/health"; then
  echo "❌ Health check failed"
  exit 1
fi

# Check version
VERSION=$(curl -s "$PROD_URL/version" | jq -r '.version')
echo "✅ Deployed version: $VERSION"

# Test critical endpoints
curl -f "$PROD_URL/api/users" || { echo "❌ Users endpoint failed"; exit 1; }

echo "✅ All checks passed"
```

### Manual Verification

- [ ] Health endpoint returns 200
- [ ] Version endpoint shows correct version
- [ ] Critical API endpoints respond correctly
- [ ] Database queries execute successfully
- [ ] Authentication works
- [ ] No errors in logs (`wrangler tail`)
- [ ] Metrics look normal (Cloudflare dashboard)

### Monitoring Checklist

- [ ] Error rate within normal range
- [ ] Response times acceptable (< 500ms p95)
- [ ] CPU time within limits
- [ ] Request count as expected
- [ ] Database connection pool healthy

---

## Rollback Procedures

### Quick Rollback (Using Wrangler)

```bash
# List recent deployments
wrangler deployments list

# Output:
# Created    Version  Author       Source
# 2024-01-15 v1.2.3   user@email   main
# 2024-01-14 v1.2.2   user@email   main
# 2024-01-13 v1.2.1   user@email   main

# Rollback to previous version
wrangler rollback --message "Rollback due to [issue]"

# Or rollback to specific version
wrangler deployments rollback --version v1.2.2
```

### Emergency Rollback Procedure

**Time-sensitive: Execute within 5 minutes**

1. **Identify the issue:**
   ```bash
   # Check error logs
   wrangler tail --format=pretty

   # Check metrics
   # Visit: https://dash.cloudflare.com/workers
   ```

2. **Execute rollback:**
   ```bash
   # Rollback to last known good version
   wrangler rollback
   ```

3. **Verify rollback:**
   ```bash
   # Health check
   curl https://api.example.com/health

   # Check version
   curl https://api.example.com/version
   ```

4. **Notify team:**
   ```bash
   # Post in Slack/Discord
   "🚨 ROLLBACK: Worker rolled back to v1.2.2 due to [issue]"
   ```

5. **Document incident:**
   - Time of deployment
   - Time of rollback
   - Issue description
   - Root cause (if known)
   - Action items

### Database Rollback

**CRITICAL: Database rollbacks are complex - plan carefully**

```bash
# List migrations
pnpm db:studio

# Rollback last migration (if possible)
# Note: This is destructive - ensure you have backups!
pnpm drizzle-kit drop

# Or restore from backup
pg_restore -d $DATABASE_URL backup.sql
```

**Database Rollback Decision Matrix:**

| Situation | Action |
|-----------|--------|
| Schema change, no data loss | Rollback migration |
| Schema change, data added | Keep new schema, rollback code |
| Breaking change | Fix forward, don't rollback |
| Data corruption | Restore from backup |

---

## Monitoring & Alerting

### Key Metrics

#### Application Metrics

- **Error Rate**: < 1% of requests
- **Response Time**: p95 < 500ms, p99 < 1s
- **Availability**: > 99.9%
- **Success Rate**: > 99%

#### Resource Metrics

- **CPU Time**: < 50ms per request (Workers limit: 10ms free, 30s paid)
- **Memory Usage**: < 100MB (Workers limit: 128MB)
- **Database Connections**: < 80% of pool
- **KV Operations**: < 1000 per second

### Cloudflare Analytics

Access via: `https://dash.cloudflare.com/<account-id>/workers/analytics`

**Monitor:**
- Requests per second
- Error count
- Status code distribution (200, 400, 500)
- CPU time histogram
- Request duration

### Custom Logging

Add structured logging to track custom metrics:

```typescript
import { structuredLogger } from "@repo/middleware";

// Log with context
console.log(JSON.stringify({
  type: "metric",
  metric: "user_signup",
  value: 1,
  timestamp: new Date().toISOString(),
  userId: user.id,
}));
```

### Alerting Setup

#### Cloudflare Notifications

1. Go to: `Notifications` in Cloudflare dashboard
2. Create alert for:
   - Error rate > 5%
   - Worker CPU time > 20ms average
   - Request failures > 100/min

#### External Monitoring

**Recommended Tools:**
- **Sentry** - Error tracking
- **Axiom** - Log aggregation
- **Baselime** - Serverless observability
- **Better Uptime** - Uptime monitoring

**Setup Sentry:**

```typescript
import * as Sentry from "@sentry/cloudflare";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: env.ENVIRONMENT,
  tracesSampleRate: 1.0,
});
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0 - Critical** | Complete outage | < 5 min | Immediate |
| **P1 - High** | Major feature broken | < 15 min | Within 30 min |
| **P2 - Medium** | Minor feature broken | < 1 hour | Within 2 hours |
| **P3 - Low** | Cosmetic issue | < 1 day | Next business day |

### Response Runbook

#### P0 - Critical Outage

1. **Acknowledge** (< 1 min)
   - Acknowledge alert
   - Post in incident channel: `🚨 P0 INCIDENT: [description]`

2. **Assess** (< 3 min)
   ```bash
   # Check logs
   wrangler tail

   # Check metrics
   # Visit Cloudflare dashboard

   # Check recent deployments
   wrangler deployments list
   ```

3. **Mitigate** (< 5 min)
   - If recent deployment: `wrangler rollback`
   - If database issue: Check connection, restart if needed
   - If third-party: Switch to fallback/cached data

4. **Communicate**
   - Update status page
   - Notify customers (if customer-facing)
   - Provide ETAs

5. **Resolve**
   - Fix root cause
   - Verify fix in staging
   - Deploy to production
   - Monitor for 30 minutes

6. **Post-Mortem**
   - Document timeline
   - Root cause analysis
   - Action items to prevent recurrence

### Common Issues & Solutions

#### "Worker Exceeded CPU Time Limit"

**Symptoms:** 524 errors, timeouts

**Causes:**
- Infinite loops
- Large database queries
- Synchronous operations

**Solutions:**
```typescript
// ❌ Bad - blocks event loop
const users = await db.select().from(users).all();

// ✅ Good - paginate
const users = await db.select().from(users).limit(100);

// ❌ Bad - CPU-intensive
for (let i = 0; i < 1000000; i++) { /* ... */ }

// ✅ Good - use waitUntil for background work
ctx.waitUntil(processInBackground());
```

#### "Too Many Requests" (429)

**Symptoms:** Rate limit errors

**Solutions:**
- Increase rate limit in `wrangler.jsonc`
- Implement request batching
- Add caching layer
- Use exponential backoff in clients

#### "Database Connection Failed"

**Symptoms:** 500 errors, connection timeouts

**Solutions:**
```bash
# Check Hyperdrive status
wrangler hyperdrive list

# Verify database is accessible
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
# Via Neon/Postgres dashboard

# Restart Hyperdrive (if needed)
# Via Cloudflare dashboard
```

#### "Authentication Errors"

**Symptoms:** 401 errors, session issues

**Solutions:**
```bash
# Verify BETTER_AUTH_SECRET is set
wrangler secret list

# Check Better Auth configuration
# Ensure baseURL matches production URL

# Clear sessions if needed
# Via database or Better Auth API
```

---

## Troubleshooting

### Debugging Tools

#### Wrangler Tail

```bash
# Stream live logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST

# Format as JSON
wrangler tail --format=json
```

#### Wrangler Dev

```bash
# Test locally with remote bindings
wrangler dev --remote

# Test with local bindings
wrangler dev --local

# Test with specific port
wrangler dev --port 8788
```

#### Database Debugging

```bash
# Open Drizzle Studio
pnpm db:studio

# Run raw query
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 10;"

# Check active connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

### Performance Profiling

```typescript
// Add timing logs
const start = Date.now();
const result = await db.query.users.findMany();
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

### Common Deployment Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Bindings not found" | Missing binding config | Check `wrangler.jsonc` |
| "Secret not found" | Missing secret | `wrangler secret put` |
| "Compatibility date" | Old compat date | Update in wrangler.jsonc |
| "Module not found" | Build error | Check imports, run build |
| "Too large" | Bundle > 1MB | Optimize imports, tree-shake |

---

## Emergency Contacts

### Team

- **On-Call Engineer**: Check PagerDuty rotation
- **Database Admin**: [contact]
- **DevOps Lead**: [contact]
- **CTO**: [contact]

### External

- **Cloudflare Support**: support.cloudflare.com
- **Neon Support**: [if using Neon]
- **Better Auth Support**: [if using Better Auth]

---

## Deployment Checklist Template

```markdown
## Deployment: [Version] - [Date]

### Pre-Deployment
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Migrations prepared
- [ ] Secrets configured
- [ ] Staging deployed and tested

### Deployment
- [ ] Migrations applied
- [ ] Code deployed
- [ ] Health check passed
- [ ] Logs reviewed

### Post-Deployment
- [ ] Metrics normal
- [ ] No errors in logs
- [ ] Critical endpoints working
- [ ] Team notified

### Rollback Plan
- Last known good version: [version]
- Rollback command: `wrangler rollback`
- Database rollback: [strategy]
```

---

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Better Auth Documentation](https://better-auth.com/)
- [Monitoring Guide](./OBSERVABILITY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-27 | 1.0.0 | Claude | Initial deployment guide |
