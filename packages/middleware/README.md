# @repo/middleware

Production-ready Hono middleware for Cloudflare Workers applications.

## Installation

This package is part of the monorepo. Add it to your worker's dependencies:

```json
{
  "dependencies": {
    "@repo/middleware": "workspace:*"
  }
}
```

## Usage

### Request ID Middleware

Generates or forwards unique request IDs for request tracing and correlation.

```typescript
import { requestId } from "@repo/middleware";
import { Hono } from "hono";

const app = new Hono();

// Add request ID to all requests
app.use("*", requestId());

app.get("/", (c) => {
  const id = c.get("requestId");
  return c.json({ requestId: id });
});
```

**Features:**
- Generates unique IDs using nanoid
- Forwards existing `X-Request-ID` header
- Stores ID in context for downstream middleware
- Adds ID to response headers

### Structured Logger Middleware

Logs requests and responses in structured JSON format for production observability.

```typescript
import { requestId, structuredLogger } from "@repo/middleware";

const app = new Hono();

// IMPORTANT: Request ID must come before logger
app.use("*", requestId());
app.use("*", structuredLogger());

app.get("/api/users", (c) => c.json({ users: [] }));
```

**Log Format:**
```json
{
  "type": "request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "abc123",
  "method": "GET",
  "path": "/api/users",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

```json
{
  "type": "response",
  "timestamp": "2024-01-01T00:00:00.100Z",
  "requestId": "abc123",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "duration": 100
}
```

### Security Headers Middleware

Adds comprehensive security headers with sensible production defaults.

```typescript
import { securityHeaders } from "@repo/middleware";

const app = new Hono();

// Default security headers
app.use("*", securityHeaders());

// Custom configuration
app.use("*", securityHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.example.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
  frameOptions: "DENY", // or "SAMEORIGIN"
  referrerPolicy: "strict-origin-when-cross-origin",
}));
```

**Default Headers:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; ...`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`

### CORS Middleware

Environment-aware CORS with production-safe defaults.

```typescript
import { enhancedCors } from "@repo/middleware";

const app = new Hono();

// Development: allows all origins
app.use("*", enhancedCors({ environment: "development" }));

// Production: specify allowed origins
app.use("*", enhancedCors({
  environment: "production",
  origins: ["https://example.com", "https://app.example.com"],
  credentials: true,
}));

// Custom origin validation
app.use("*", enhancedCors({
  origins: (origin) => origin.endsWith(".example.com"),
}));
```

**Features:**
- Environment-aware defaults
- Supports string arrays or validation functions
- Exposes `X-Request-ID` header
- Configurable credentials, max age, and preflight handling

### CSRF Protection Middleware

Protects against Cross-Site Request Forgery attacks using Hono's built-in CSRF middleware.

```typescript
import { csrfProtection, csrfForRoutes } from "@repo/middleware";

const app = new Hono<{ Bindings: Env }>();

// Apply CSRF protection globally
app.use("*", csrfProtection({
  origin: "https://example.com"
}));

// Or protect specific routes only
app.use("/api/auth/*", csrfForRoutes({
  origin: "https://example.com"
}));

// Multiple allowed origins
app.use("*", csrfProtection({
  origin: ["https://example.com", "https://app.example.com"]
}));

// Custom origin validation
app.use("*", csrfProtection({
  origin: (origin) => origin.endsWith(".example.com")
}));

// Use BETTER_AUTH_URL from environment
app.use("*", csrfProtection()); // Automatically uses c.env.BETTER_AUTH_URL
```

**Features:**
- Environment-aware (skips protection in test environment)
- Protects POST, PUT, DELETE, PATCH requests
- GET, HEAD are safe methods (not protected)
- Uses `Origin` header validation
- Supports string, array, or function for origin validation
- Automatically uses `BETTER_AUTH_URL` if no origin specified

**When to Use:**
- Apply globally for all state-changing operations
- Or target specific routes (e.g., `/api/auth/*`)
- Required for Better Auth integration

### Rate Limiter Middleware

Cloudflare Rate Limiter integration with graceful degradation.

```typescript
import { rateLimiter } from "@repo/middleware";

const app = new Hono<{ Bindings: Env }>();

// Strict limits for authentication
app.use("/auth/*", rateLimiter({
  limit: { requests: 5, window: 60 }, // 5 requests per minute
  errorMessage: "Too many login attempts",
}));

// Relaxed limits for API endpoints
app.use("/api/*", rateLimiter({
  limit: { requests: 100, window: 60 }, // 100 requests per minute
}));

// Custom identifier (e.g., API key)
app.use("/api/*", rateLimiter({
  limit: { requests: 1000, window: 60 },
  identifier: (c) => c.req.header("x-api-key") ?? "anonymous",
}));
```

**Requirements:**
- Cloudflare Rate Limiter binding in `wrangler.jsonc`
- Gracefully degrades if binding not available (fails open)

**Features:**
- Uses `cf-connecting-ip` or `x-forwarded-for` by default
- Custom identifier functions
- Adds rate limit headers to responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

### Error Handler Middleware

Global error handling with environment-aware error details.

```typescript
import { errorHandler, notFoundHandler } from "@repo/middleware";

const app = new Hono();

// Apply to all errors
app.onError(errorHandler());

// Apply to 404s
app.notFound(notFoundHandler());
```

**Features:**
- Handles `HTTPException` with correct status codes
- Logs structured error information
- Environment-aware error details:
  - **Development:** Exposes error messages
  - **Production:** Returns generic "Internal Server Error"
- Includes request ID in error responses

**Error Response Format:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "requestId": "abc123"
}
```

## Middleware Ordering

**CRITICAL:** Middleware order matters. Apply in this sequence:

```typescript
import { Hono } from "hono";
import {
  requestId,
  structuredLogger,
  securityHeaders,
  enhancedCors,
  csrfProtection,
  rateLimiter,
  errorHandler,
  notFoundHandler,
} from "@repo/middleware";

const app = new Hono<{ Bindings: Env }>();

// 1. Request ID - MUST be first for tracking
app.use("*", requestId());

// 2. Structured logging - logs with request ID
app.use("*", structuredLogger());

// 3. Security headers
app.use("*", securityHeaders());

// 4. CORS - environment-aware
app.use("*", enhancedCors({ environment: c.env.ENVIRONMENT }));

// 5. CSRF protection - protect state-changing operations
app.use("*", csrfProtection());

// 6. Rate limiting - apply to specific routes
app.use("/api/*", rateLimiter({ limit: { requests: 100, window: 60 } }));

// Error handlers (applied last)
app.onError(errorHandler());
app.notFound(notFoundHandler());
```

## Testing

Tests are located in `src/test/`. Run with:

```bash
# Run all middleware tests
pnpm vitest run --project packages packages/middleware

# Run specific test file
pnpm vitest run packages/middleware/src/test/cors.test.ts
```

## TypeScript

All middleware is fully typed with TypeScript. Use with proper Env typing:

```typescript
interface Env {
  ENVIRONMENT: "development" | "production";
  RATE_LIMITER?: RateLimiterBinding;
}

const app = new Hono<{ Bindings: Env }>();
```

## Contributing

When adding new middleware:
1. Follow existing patterns
2. Add comprehensive tests
3. Document configuration options
4. Update this README

## License

MIT
