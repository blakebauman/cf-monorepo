# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack & Architecture

This is a Cloudflare Workers monorepo with the following core technologies:

- **Runtime**: Cloudflare Workers (V8 edge runtime)
- **Framework**: Hono (fast web framework)
- **Database**: Neon Postgres via Hyperdrive
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **Build System**: Turborepo + pnpm workspaces
- **Linting**: Biome 2.3.7 (fast Rust-based linter/formatter)
- **Testing**: Vitest with Workers pool
- **Task Runner**: Just

## Project Structure

```
cf-monorepo/
├── apps/                  # Cloudflare Worker applications
│   └── example-worker/    # Example worker with full setup
├── packages/              # Shared libraries
│   ├── auth/              # Better Auth configuration
│   ├── config/            # Environment-aware configuration
│   ├── constants/         # Shared constants and types
│   ├── db/                # Drizzle ORM schema and utilities
│   ├── middleware/        # Hono middleware (CORS, logging, security, rate limiting)
│   ├── openapi/           # OpenAPI schemas and utilities
│   ├── testing/           # Shared testing utilities and mocks
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Utility functions
└── turbo/generators/      # Scaffolding templates
```

## Essential Commands

### Development
```bash
# Start all workers
just dev                    
pnpm dev

# Start specific worker
just dev-worker <name>      
pnpm --filter <worker> dev

# Create new worker/package (interactive)
just new-worker             
just new-package
pnpm turbo gen worker       # or package
```

### Code Quality
```bash
# Run all checks (lint, format, types)
just check                  
pnpm check && pnpm type-check

# Fix auto-fixable issues
just fix                    
pnpm check:fix

# Type check only
just typecheck              
pnpm type-check

# Dependency version checks
just deps-check             
pnpm syncpack:check

# Fix dependency version mismatches
just deps-fix               
pnpm syncpack

# Show outdated dependencies
just outdated               
pnpm outdated -r

# Update dependencies interactively
just update-deps            
pnpm update -r -i
```

### Testing & Building
```bash
# Run tests
just test                   
pnpm test

# Watch mode
just test-watch             
pnpm test:watch

# Run tests with coverage
just test-coverage          
pnpm test:coverage

# Build all packages
just build                  
pnpm build

# Deploy all workers
just deploy                 
pnpm turbo deploy

# Deploy specific worker
just deploy-worker <name>   
pnpm --filter <worker> deploy
```

### Database Operations
```bash
# Generate migrations
just db-generate            
pnpm db:generate

# Apply migrations
just db-migrate             
pnpm db:migrate

# Open Drizzle Studio
just db-studio              
pnpm db:studio

# Full setup (Better Auth schema + migrations)
just db-setup               
pnpm db:setup

# Generate Better Auth schema
just auth-schema            
pnpm auth:generate-schema
```

## Turborepo Task Dependencies

Understanding task dependencies helps avoid errors:
- `build`: Depends on `^build` (builds dependencies first)
- `deploy`: Depends on `build`, `test`, `type-check`, `lint` (all must pass)
- `test`: Depends on `^build` (shared packages must build first)
- `type-check`: Depends on `^build` (types from dependencies needed)
- `dev`: Persistent task with `^build` dependency
- `migrate`: Depends on `generate` (schema must be generated first)

**Important**: When running tasks, Turborepo automatically handles dependencies. Running `pnpm deploy` will run all prerequisite tasks in the correct order.

## Key Development Patterns

### Environment Variables
- Workers use `.dev.vars` (not `.env`) for local development
- Production uses Cloudflare secrets via `wrangler secret put`
- Package scripts use `.env` files for Node.js operations

### Wrangler Configuration
Workers use `wrangler.jsonc` with these key patterns:
```jsonc
{
  "name": "worker-name",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],  // Required for Node.js APIs
  "vars": {
    "ENVIRONMENT": "development"  // Non-secret environment variables
  },
  "hyperdrive": [{
    "binding": "HYPERDRIVE",
    "id": "your-hyperdrive-id",
    "localConnectionString": "postgresql://..."  // For local dev
  }]
}
```
**Critical**: Always include `nodejs_compat` flag for Node.js APIs. Use `localConnectionString` for local Hyperdrive development.

### Shared Package Usage
```typescript
// Import shared packages with workspace protocol
import type { Env } from "@repo/types";
import { successResponse } from "@repo/utils";
import { createDb, users } from "@repo/db";
import { createAuth } from "@repo/auth";
import { requestId, securityHeaders } from "@repo/middleware";
```

### OpenAPI Integration
Use OpenAPIHono for automatic documentation:
```typescript
import { OpenAPIHono } from "@hono/zod-openapi";
import { SuccessResponseSchema, standardErrorResponses } from "@repo/openapi";
import { apiReference } from "@scalar/hono-api-reference";

const app = new OpenAPIHono<Context>();

// Define OpenAPI spec
app.doc("/openapi.json", { openapi: "3.0.0", info: { ... } });

// Mount Scalar UI
app.get("/docs", apiReference({ theme: "purple" }));

// Define routes with OpenAPI schemas
app.openapi({
  method: "get",
  path: "/api/users",
  responses: {
    200: { description: "Success", content: { "application/json": { schema: UserSchema } } },
    ...standardErrorResponses
  }
}, handler);
```

### Worker Structure
Workers should follow this pattern:
```typescript
interface Env {
  HYPERDRIVE: Hyperdrive;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Use ctx.waitUntil() for background tasks
    // Access bindings through env parameter
    return new Response("OK");
  },
};
```

### Middleware Ordering
**CRITICAL**: Middleware order matters in Hono. Apply in this sequence:
```typescript
// 1. Request ID - must be first to track all requests
app.use("*", requestId());

// 2. Structured logging - logs with request ID
app.use("*", structuredLogger());

// 3. Security headers
app.use("*", securityHeaders());

// 4. CORS - environment-aware
app.use("*", enhancedCors({ environment: "development" }));

// 5. Rate limiting - apply to specific routes
app.use("/api/*", rateLimiter({ limit: { requests: 100, window: 60 } }));
```

### Database Patterns
- Use Drizzle ORM for type-safe queries
- **CRITICAL**: All database queries MUST be in service classes (never in route handlers)
- Always use transactions for multi-operation updates
- Prefer `returning()` to avoid extra queries
- Use `workspace:*` for internal dependencies

### Service Class Architecture
All database operations must be encapsulated in service classes for separation of concerns:

```typescript
// apps/worker/src/services/user-service.ts
export class UserService {
  constructor(private readonly db: NeonHttpDatabase) {}
  
  async findById(id: number): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user ?? null;
  }
}

// In route handler
const userService = new UserService(createDb(c.env));
const user = await userService.findById(userId);
```

### Testing Strategy
- **Workers tests**: Use `@cloudflare/vitest-pool-workers` for Workers runtime testing
  - Located in `apps/**/test/**/*.test.ts`
  - Runs with Workers pool using wrangler.jsonc configuration
  - Set `VITEST_WRANGLER_CONFIG` env var to test specific workers
- **Package tests**: Use Node.js environment for shared library testing
  - Located in `packages/**/test/**/*.test.ts`
  - Runs with standard Node.js environment
- Test files: `*.test.ts` or `*.spec.ts` in `test/` directories
- Coverage reports include text, JSON, and HTML formats
- Use `testing` package utilities for mocks and fixtures

## Code Style (Biome Configuration)
- Tabs for indentation (2 spaces width)
- Double quotes for strings
- Semicolons required
- Trailing commas (ES5 style)
- Line width: 100 characters
- `const` over `let` (enforced)
- `import type` for type-only imports (enforced)
- Node.js import protocol required (e.g., `node:fs`)
- No unused variables or imports (enforced)

## File Naming Convention
**CRITICAL**: All TypeScript files MUST use kebab-case naming:
- ✅ `user-service.ts`, `auth-middleware.ts`, `error-handler.ts`
- ❌ `userService.ts`, `authMiddleware.ts`, `errorHandler.ts`
- Exceptions: `index.ts`, `*.test.ts`, `*.spec.ts`, configuration files

## Git Workflow
Follows Conventional Commits format:
- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes
- `docs: description` - Documentation
- `chore: description` - Maintenance
- `style, refactor, perf, test, build, ci, revert` - Other types

**Pre-commit hooks** (via Lefthook):
- Biome check and auto-fix on staged files
- Type checking on TypeScript files
- Conventional commit message validation on commit

**Pre-push hooks**:
- Full lint check
- Full type check

## Cloudflare Workers Constraints
- No Node.js APIs by default (use `nodejs_compat` flag)
- 128MB memory limit per invocation
- 10ms CPU time (free) / 30s (paid)
- Max 6 concurrent outbound connections
- Use `waitUntil()` for background tasks
- Workers are stateless between requests

## Claude Code Workflow

This repository includes a comprehensive Claude Code development workflow in `.claude/`:

### Sub-Agents (5 Specialists)
- **dev-assistant**: General development guidance and architecture decisions
- **security-auditor**: Security vulnerability detection and compliance
- **perf-optimizer**: Performance optimization and bundle analysis  
- **test-strategist**: Testing strategy and quality assurance
- **api-designer**: RESTful API design and OpenAPI specifications

### Skills (4 Capabilities)
- **db-migrations**: Intelligent database migration management
- **worker-scaffolding**: Enhanced scaffolding beyond Turborepo generators
- **deployment-readiness**: Comprehensive deployment validation
- **docs-automation**: Automated documentation generation

### Hooks (4 Automated Checks)
- **quality-gate**: Code modification quality checks
- **deployment-check**: Pre-deployment validation
- **bash-safety**: Command execution safety
- **activity-log**: Development activity logging

### Usage
The workflow automatically activates when using Claude Code. Enhanced integrations:

```bash
# AI-enhanced development commands
just new-worker           # Intelligent scaffolding with pattern analysis
just deploy               # Comprehensive deployment validation
just db-generate          # Smart migration generation with safety checks
```

Each component provides specialized expertise while maintaining seamless integration with existing tools.

See `.claude/README.md` for detailed workflow documentation.

## Single Test Commands
```bash
# Run single test file
pnpm vitest run path/to/test.test.ts

# Run tests matching pattern
pnpm vitest run --testNamePattern="specific test name"

# Run specific worker tests
pnpm --filter <worker-name> test

# Run specific package tests
pnpm --filter @repo/<package-name> test

# Test specific worker with custom wrangler config
VITEST_WRANGLER_CONFIG=./apps/my-worker/wrangler.jsonc pnpm test

# Run only worker tests (skip package tests)
pnpm vitest run --project workers

# Run only package tests (skip worker tests)
pnpm vitest run --project packages
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.