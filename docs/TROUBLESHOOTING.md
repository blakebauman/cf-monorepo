# Troubleshooting Guide

Common issues and solutions for the Cloudflare Workers monorepo.

## Setup Issues

### Issue: `pnpm install` fails

**Symptoms**: Package installation errors, dependency conflicts

**Solutions**:
1. Clear cache: `pnpm store prune`
2. Delete `node_modules` and `pnpm-lock.yaml`
3. Reinstall: `pnpm install`
4. Check Node.js version: `node --version` (should be >= 20.0.0)

### Issue: TypeScript errors after installation

**Symptoms**: Type errors, missing type definitions

**Solutions**:
1. Run type check: `pnpm type-check`
2. Rebuild packages: `pnpm build`
3. Check `tsconfig.json` extends `tsconfig.base.json`

## Development Issues

### Issue: Worker won't start (`wrangler dev` fails)

**Symptoms**: Error starting development server

**Solutions**:
1. Check `.dev.vars` exists and is configured
2. Verify `wrangler.jsonc` syntax is correct
3. Check Cloudflare credentials: `wrangler whoami`
4. Ensure port 8787 is not in use

### Issue: Database connection errors

**Symptoms**: "Connection refused" or "Connection timeout"

**Solutions**:
1. Verify `DATABASE_URL` in `.dev.vars`
2. Check database is accessible from your IP
3. For Neon: Check connection pooling settings
4. Verify Hyperdrive binding is configured in `wrangler.jsonc`

### Issue: Better Auth errors

**Symptoms**: Authentication not working, session errors

**Solutions**:
1. Verify `BETTER_AUTH_SECRET` is 32+ characters
2. Check `BETTER_AUTH_URL` matches your worker URL
3. Ensure database schema is migrated: `pnpm db:migrate`
4. Check auth routes are properly configured

## Build Issues

### Issue: Build fails with type errors

**Symptoms**: TypeScript compilation errors

**Solutions**:
1. Run `pnpm type-check` to see all errors
2. Check workspace dependencies use `workspace:*`
3. Rebuild shared packages: `pnpm --filter "@repo/*" build`
4. Clear Turbo cache: `pnpm clean && pnpm build`

### Issue: Turborepo cache issues

**Symptoms**: Stale builds, incorrect cache hits

**Solutions**:
1. Clear cache: `pnpm clean`
2. Force rebuild: `pnpm build --force`
3. Check `turbo.json` inputs/outputs are correct

## Testing Issues

### Issue: Tests fail with Workers runtime errors

**Symptoms**: "ReferenceError: process is not defined"

**Solutions**:
1. Ensure using `@cloudflare/vitest-pool-workers`
2. Check `vitest.config.ts` uses `defineWorkersConfig`
3. Verify test files are in correct workspace configuration
4. Use `createMockEnv()` from `@repo/testing`

### Issue: Tests timeout

**Symptoms**: Tests hang or timeout

**Solutions**:
1. Increase timeout in test: `test.setTimeout(10000)`
2. Check for unclosed connections or promises
3. Verify mocks are properly reset between tests

## Deployment Issues

### Issue: Deployment fails with authentication error

**Symptoms**: "Authentication error" during `wrangler deploy`

**Solutions**:
1. Login: `wrangler login`
2. Verify API token: `wrangler whoami`
3. Check account ID in `wrangler.jsonc`
4. Verify secrets are set: `wrangler secret list`

### Issue: Worker deployed but returns errors

**Symptoms**: 500 errors, runtime exceptions

**Solutions**:
1. Check Cloudflare dashboard logs
2. Verify environment variables are set as secrets
3. Check database connection string
4. Verify Hyperdrive binding is configured
5. Test locally first: `wrangler dev`

### Issue: CORS errors in production

**Symptoms**: CORS preflight failures

**Solutions**:
1. Check CORS configuration in middleware
2. Verify allowed origins in `@repo/config`
3. Check `OPTIONS` requests are handled
4. Review browser console for specific CORS errors

## Database Issues

### Issue: Migration fails

**Symptoms**: "Migration failed" or "Table already exists"

**Solutions**:
1. Check database connection: `pnpm db:studio`
2. Verify migration files are correct
3. Check for conflicting migrations
4. Manually review database state

### Issue: Drizzle Studio won't open

**Symptoms**: Studio fails to start

**Solutions**:
1. Verify `DATABASE_URL` is set
2. Check database is accessible
3. Try different port: `pnpm db:studio --port 4983`
4. Check for port conflicts

## Performance Issues

### Issue: Slow response times

**Symptoms**: High latency, slow API responses

**Solutions**:
1. Check database query performance
2. Review middleware chain (remove unnecessary middleware)
3. Check bundle size: `wrangler deploy --dry-run`
4. Review Cloudflare dashboard analytics
5. Consider caching with KV storage

### Issue: High bundle size

**Symptoms**: Bundle exceeds limits, slow cold starts

**Solutions**:
1. Analyze bundle: Check what's included
2. Remove unused dependencies
3. Use dynamic imports for large libraries
4. Check for duplicate dependencies: `pnpm list --depth=0`

## Environment-Specific Issues

### Issue: Works locally but fails in staging/production

**Symptoms**: Environment-specific failures

**Solutions**:
1. Compare environment variables
2. Check Cloudflare bindings are configured
3. Verify secrets are set correctly
4. Check environment-specific configuration in `@repo/config`
5. Review deployment logs

### Issue: Different behavior between environments

**Symptoms**: Inconsistent behavior

**Solutions**:
1. Check `ENVIRONMENT` variable is set correctly
2. Review environment-specific configs
3. Verify feature flags are correct
4. Check logging levels match expectations

## Getting Help

### Debug Steps

1. **Check logs**: Cloudflare dashboard → Workers → Logs
2. **Local testing**: `wrangler dev` with verbose logging
3. **Type checking**: `pnpm type-check`
4. **Linting**: `pnpm lint`
5. **Tests**: `pnpm test`

### Useful Commands

```bash
# Check environment
wrangler whoami
wrangler secret list

# Database
pnpm db:studio
pnpm db:migrate

# Development
pnpm dev
pnpm type-check
pnpm lint

# Testing
pnpm test
pnpm test:watch
pnpm test:coverage

# Deployment
wrangler deploy --dry-run
wrangler deploy --env staging
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `Module not found` | Check workspace dependencies, run `pnpm install` |
| `Type error` | Run `pnpm type-check`, check TypeScript config |
| `Connection refused` | Check database URL, verify network access |
| `Authentication failed` | Verify secrets, check Better Auth config |
| `CORS error` | Check CORS middleware configuration |
| `Rate limit exceeded` | Review rate limiter configuration |

## Still Stuck?

1. Check the [Architecture Documentation](./ARCHITECTURE.md)
2. Review [Database Setup Guide](../DATABASE_SETUP.md)
3. Check Cloudflare Workers documentation
4. Review package-specific README files
5. Check GitHub Issues for similar problems

