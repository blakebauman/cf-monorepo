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
- **Linting**: Biome (35x faster than Prettier)
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

## Key Development Patterns

### Environment Variables
- Workers use `.dev.vars` (not `.env`) for local development
- Production uses Cloudflare secrets via `wrangler secret put`
- Package scripts use `.env` files for Node.js operations

### Shared Package Usage
```typescript
// Import shared packages with workspace protocol
import type { Env } from "@repo/types";
import { successResponse } from "@repo/utils";
import { createDb, users } from "@repo/db";
import { createAuth } from "@repo/auth";
import { requestId, securityHeaders } from "@repo/middleware";
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
- **Package tests**: Use Node.js environment for shared library testing
- Test files: `*.test.ts` or `*.spec.ts` in `src/` directories
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
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.