# Observability Guide

Structured logging, monitoring, and debugging patterns for Cloudflare Workers.

## Logging

### Structured Logging

The monorepo uses structured logging via `@cf-monorepo/middleware`:

```typescript
import { structuredLogger } from "@cf-monorepo/middleware";

app.use("*", structuredLogger());
```

### Log Levels

Log levels are environment-aware:

- **Development**: `debug`, `info`, `warn`, `error`
- **Staging**: `info`, `warn`, `error`
- **Production**: `warn`, `error`

### Logging Examples

```typescript
// Info log
logger.info("User created", {
  userId: user.id,
  requestId: c.get("requestId"),
});

// Warning log
logger.warn("Rate limit approaching", {
  remaining: rateLimit.remaining,
  requestId: c.get("requestId"),
});

// Error log
logger.error("Database query failed", {
  error: error.message,
  query: "SELECT * FROM users",
  requestId: c.get("requestId"),
});
```

### Request ID Tracking

Every request gets a unique ID for tracing:

```typescript
// Request ID is automatically added to logs
logger.info("Processing request", {
  requestId: c.get("requestId"),
  path: c.req.path,
});
```

## Monitoring

### Cloudflare Dashboard

Monitor your workers in the Cloudflare dashboard:

1. **Analytics**: Request volume, error rates, response times
2. **Logs**: Real-time request logs with filtering
3. **Metrics**: CPU time, memory usage, invocation counts

### Custom Metrics

Track custom metrics using Cloudflare's analytics engine:

```typescript
// Track custom events
c.env.ANALYTICS.writeDataPoint({
  blobs: ["user-action", "login"],
  doubles: [1],
  indexes: ["user-id-123"],
});
```

### Performance Monitoring

Track response times and performance:

```typescript
const startTime = Date.now();

// ... handle request ...

const duration = Date.now() - startTime;
logger.info("Request completed", {
  duration,
  requestId: c.get("requestId"),
  path: c.req.path,
});
```

## Error Tracking

### Error Handling Pattern

Use the error handler middleware:

```typescript
import { errorHandler } from "@cf-monorepo/middleware";

app.onError(errorHandler());
```

### Structured Error Responses

Errors are automatically formatted:

```typescript
// Returns structured error response
throw new HTTPException(400, {
  message: "Invalid input",
  cause: validationError,
});
```

### Error Logging

Errors are automatically logged with context:

```typescript
try {
  // ... operation ...
} catch (error) {
  logger.error("Operation failed", {
    error: error.message,
    stack: error.stack,
    requestId: c.get("requestId"),
  });
  throw error;
}
```

## Debugging

### Local Development

Use `wrangler dev` with verbose logging:

```bash
wrangler dev --log-level debug
```

### Request Tracing

Every request includes a unique ID for tracing:

```typescript
// Request ID is available in context
const requestId = c.get("requestId");

// Use in logs, errors, and responses
logger.info("Processing", { requestId });
```

### Debug Mode

Enable debug mode in development:

```typescript
import { isDevelopment } from "@cf-monorepo/config";

if (isDevelopment(env)) {
  // Debug logging
  logger.debug("Debug information", { data });
}
```

## Log Aggregation

### Cloudflare Logs

Access logs via:
- Cloudflare Dashboard → Workers → Logs
- Real-time streaming logs
- Historical log search

### External Logging Services

Integrate with external services:

```typescript
// Example: Send logs to external service
async function sendToLogService(log: LogEntry) {
  await fetch("https://logs.example.com/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
  });
}
```

## Performance Monitoring

### Response Time Tracking

Track response times for optimization:

```typescript
const start = performance.now();

// ... handle request ...

const duration = performance.now() - start;
logger.info("Request duration", { duration, path: c.req.path });
```

### Database Query Monitoring

Monitor slow queries:

```typescript
const queryStart = Date.now();
const result = await db.select().from(users);
const queryDuration = Date.now() - queryStart;

if (queryDuration > 1000) {
  logger.warn("Slow query detected", {
    duration: queryDuration,
    query: "SELECT * FROM users",
  });
}
```

## Best Practices

### 1. Use Structured Logging

Always include context:

```typescript
// ✅ Good
logger.info("User created", {
  userId: user.id,
  email: user.email,
  requestId: c.get("requestId"),
});

// ❌ Bad
console.log("User created");
```

### 2. Include Request IDs

Always include request ID for tracing:

```typescript
logger.info("Operation", {
  requestId: c.get("requestId"),
  // ... other context ...
});
```

### 3. Log Errors with Context

Include full error context:

```typescript
logger.error("Operation failed", {
  error: error.message,
  stack: error.stack,
  requestId: c.get("requestId"),
  userId: user?.id,
});
```

### 4. Use Appropriate Log Levels

- **debug**: Detailed information for debugging
- **info**: General informational messages
- **warn**: Warning messages for potential issues
- **error**: Error messages for failures

### 5. Don't Log Sensitive Data

Never log passwords, tokens, or secrets:

```typescript
// ❌ Bad
logger.info("Login attempt", { password: userPassword });

// ✅ Good
logger.info("Login attempt", { email: userEmail });
```

## Monitoring Checklist

- [ ] Structured logging configured
- [ ] Request ID tracking enabled
- [ ] Error handling middleware in place
- [ ] Performance metrics tracked
- [ ] Cloudflare dashboard monitoring set up
- [ ] Log levels appropriate for environment
- [ ] No sensitive data in logs
- [ ] Slow query monitoring enabled

