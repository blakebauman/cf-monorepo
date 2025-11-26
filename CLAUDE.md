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
│   ├── db/                # Drizzle ORM schema
│   ├── middleware/        # Hono middleware (CORS, logging, security)
│   ├── openapi/           # OpenAPI schemas and utilities
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
```

### Testing & Building
```bash
# Run tests
just test                   
pnpm test

# Watch mode
just test-watch             
pnpm test:watch

# Build all packages
just build                  
pnpm build

# Deploy all workers
just deploy                 
pnpm turbo deploy
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
import type { Env } from "@cf-monorepo/types";
import { successResponse } from "@cf-monorepo/utils";
import { createDb, users } from "@cf-monorepo/db";
import { createAuth } from "@cf-monorepo/auth";
import { requestId, securityHeaders } from "@cf-monorepo/middleware";
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
- Always use transactions for multi-operation updates
- Prefer `returning()` to avoid extra queries
- Use `workspace:*` for internal dependencies

## Code Style (Biome Configuration)
- Tabs for indentation
- Double quotes for strings
- Semicolons required
- `const` over `let`
- `import type` for type-only imports
- Alphabetical import organization

## Git Workflow
Follows Conventional Commits format:
- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes
- `docs: description` - Documentation
- `chore: description` - Maintenance

Pre-commit hooks run Biome formatting/linting and type checking via Lefthook.

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