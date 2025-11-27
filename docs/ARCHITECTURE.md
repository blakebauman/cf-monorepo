# Architecture Overview

This document provides an overview of the Cloudflare Workers monorepo architecture, design decisions, and patterns.

## Monorepo Structure

```
cf-monorepo/
├── apps/                    # Cloudflare Worker applications
│   └── example-worker/      # Example worker with full setup
├── packages/                # Shared libraries
│   ├── auth/                 # Better Auth configuration
│   ├── config/               # Environment-aware configuration
│   ├── constants/            # Shared constants and types
│   ├── db/                   # Drizzle ORM schema and utilities
│   ├── middleware/           # Hono middleware (CORS, logging, etc.)
│   ├── openapi/              # OpenAPI schemas and utilities
│   ├── testing/              # Shared testing utilities
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Utility functions
├── scripts/                  # Development and deployment scripts
│   ├── development/          # Development helper scripts
│   ├── deployment/           # Deployment scripts
│   └── setup/                # Setup and initialization scripts
└── turbo/                    # Turborepo configuration
```

## Technology Stack

### Runtime & Framework
- **Cloudflare Workers**: Edge computing runtime
- **Hono**: Fast, lightweight web framework for Workers
- **OpenAPI**: API documentation and validation via `@hono/zod-openapi`

### Database & ORM
- **Neon Postgres**: Serverless PostgreSQL database
- **Hyperdrive**: Cloudflare's database connection pooling
- **Drizzle ORM**: Type-safe SQL query builder

### Authentication
- **Better Auth**: Modern authentication framework
- Supports email/password, OAuth, and more

### Development Tools
- **Turborepo**: Monorepo build system
- **pnpm**: Fast, disk-efficient package manager
- **Biome**: Fast formatter and linter
- **Vitest**: Fast unit test framework
- **TypeScript**: Type safety

## Design Patterns

### 1. Shared Packages Pattern

All common functionality is extracted into shared packages under `packages/`:

- **Reusability**: Write once, use everywhere
- **Type Safety**: Shared types ensure consistency
- **Maintainability**: Single source of truth for common logic

### 2. Environment-Aware Configuration

The `@repo/config` package provides environment-aware configuration:

```typescript
import { getCorsConfig, getDatabaseConfig } from "@repo/config";

const corsConfig = getCorsConfig(env);
const dbConfig = getDatabaseConfig(env);
```

Configuration automatically adapts based on `ENVIRONMENT` variable:
- **Development**: Relaxed CORS, verbose logging, debug mode
- **Staging**: Production-like with additional monitoring
- **Production**: Strict security, optimized performance

### 3. Middleware Composition

Hono middleware is composed for maximum flexibility:

```typescript
app.use("*", requestId());
app.use("*", securityHeaders());
app.use("*", structuredLogger());
app.use("*", enhancedCors());
app.use("*", rateLimiter());
```

### 4. OpenAPI-First API Design

APIs are defined using OpenAPI schemas with Zod validation:

```typescript
app.openapi(
  {
    method: "get",
    path: "/users/{id}",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: SuccessResponseSchema(zUserSchema),
      ...standardErrorResponses,
    },
  },
  async (c) => {
    // Implementation
  }
);
```

## Worker Architecture

### Request Flow

1. **Request arrives** → Cloudflare Workers runtime
2. **Middleware chain**:
   - Request ID generation
   - Security headers
   - Structured logging
   - CORS handling
   - Rate limiting
3. **Route handler** → Business logic
4. **Response** → Formatted with proper headers

### Database Access Pattern

```typescript
// Create database connection with Hyperdrive
const db = createDb(env);

// Use Drizzle ORM for type-safe queries
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);
```

### Authentication Pattern

```typescript
// Create auth instance
const auth = createAuth(env);

// Get session
const session = await auth.api.getSession({
  headers: request.headers,
});

// Protect routes
if (!session) {
  return errorResponse("Unauthorized", 401);
}
```

## Deployment Strategy

### Environments

1. **Development**: Local development with `wrangler dev`
2. **Staging**: Deployed from `develop` branch
3. **Production**: Deployed from `main` branch

### Deployment Process

1. Pre-deployment checks (lint, type-check, test)
2. Build all packages
3. Deploy workers sequentially
4. Run smoke tests
5. Create deployment tag

## Testing Strategy

### Test Types

- **Unit Tests**: Individual functions and utilities
- **Integration Tests**: API endpoints with mock data
- **E2E Tests**: Full request/response cycles

### Test Utilities

The `@repo/testing` package provides:
- Mock Workers environment
- Test fixtures
- Custom matchers
- Helper functions

## Performance Considerations

### Edge Computing Benefits

- **Low Latency**: Requests served from edge locations
- **Global Distribution**: Automatic CDN-like distribution
- **Cold Start Optimization**: Fast startup times

### Optimization Patterns

1. **Connection Pooling**: Hyperdrive for database connections
2. **Caching**: KV storage for frequently accessed data
3. **Rate Limiting**: Prevent abuse and ensure fair usage
4. **Bundle Size**: Minimal dependencies, tree-shaking

## Security Patterns

### Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### Input Validation

All user input is validated using Zod schemas:

```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
});
```

### Secret Management

- **Local**: `.dev.vars` (git-ignored)
- **Production**: Cloudflare Secrets
- **Never**: Hardcoded in source code

## Observability

### Logging

Structured logging with request IDs:

```typescript
logger.info("User created", {
  userId: user.id,
  requestId: c.get("requestId"),
});
```

### Monitoring

- **Request Tracking**: Every request has a unique ID
- **Error Tracking**: Structured error responses
- **Performance Metrics**: Response time tracking

## Best Practices

1. **Type Safety**: Use TypeScript strictly
2. **Validation**: Validate all inputs with Zod
3. **Error Handling**: Use error middleware consistently
4. **Testing**: Write tests for critical paths
5. **Documentation**: Keep OpenAPI schemas up to date
6. **Security**: Follow security patterns consistently
7. **Performance**: Monitor bundle size and response times

## Future Enhancements

- [ ] GraphQL support
- [ ] WebSocket support
- [ ] Queue workers for background jobs
- [ ] Scheduled workers (cron triggers)
- [ ] Durable Objects for stateful operations
- [ ] R2 storage integration
- [ ] Workers AI integration

