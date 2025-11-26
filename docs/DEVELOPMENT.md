# Development Guide

Complete guide for developing in the Cloudflare Workers monorepo.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Cloudflare account
- PostgreSQL database (Neon, Supabase, etc.)

### Initial Setup

1. **Clone and install**:
   ```bash
   git clone <repository>
   cd cf-monorepo
   pnpm install
   ```

2. **Run setup script**:
   ```bash
   ./scripts/setup/initial-setup.sh
   ```

3. **Configure environment**:
   ```bash
   # Copy example environment file
   cp apps/example-worker/.dev.vars.example apps/example-worker/.dev.vars
   
   # Edit with your values
   nano apps/example-worker/.dev.vars
   ```

4. **Setup database**:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

## Development Workflow

### Starting Development

**Start a specific worker**:
```bash
./scripts/development/dev-worker.sh example-worker
```

**Or use pnpm directly**:
```bash
cd apps/example-worker
pnpm dev
```

### Code Quality

**Run all checks**:
```bash
pnpm check          # Lint and format check
pnpm type-check     # TypeScript checking
pnpm test           # Run tests
```

**Auto-fix issues**:
```bash
pnpm check:fix      # Fix linting and formatting
```

### Database Operations

**Generate migrations**:
```bash
pnpm db:generate
```

**Run migrations**:
```bash
pnpm db:migrate
```

**Open Drizzle Studio**:
```bash
pnpm db:studio
```

**Or use helper script**:
```bash
./scripts/development/db-helpers.sh setup
```

## Creating New Workers

### Using the Generator

```bash
just new-worker
```

This interactive tool will:
1. Prompt for worker name and description
2. Ask about framework (Hono/Basic)
3. Configure database support
4. Configure authentication
5. Generate all necessary files

### Manual Creation

1. **Create directory**:
   ```bash
   mkdir -p apps/my-worker/src
   ```

2. **Create `package.json`**:
   ```json
   {
     "name": "my-worker",
     "version": "0.0.0",
     "private": true,
     "scripts": {
       "dev": "wrangler dev",
       "deploy": "wrangler deploy",
       "build": "tsc --noEmit"
     },
     "dependencies": {
       "@cf-monorepo/types": "workspace:*",
       "hono": "^4.10.7"
     }
   }
   ```

3. **Create `wrangler.jsonc`**:
   ```jsonc
   {
     "name": "my-worker",
     "main": "src/index.ts",
     "compatibility_date": "2024-09-23"
   }
   ```

4. **Create `src/index.ts`**:
   ```typescript
   import { Hono } from "hono";
   import type { Env } from "@cf-monorepo/types";

   const app = new Hono<{ Bindings: Env }>();

   app.get("/", (c) => {
     return c.json({ message: "Hello World" });
   });

   export default {
     async fetch(request: Request, env: Env): Promise<Response> {
       return app.fetch(request, env);
     },
   };
   ```

## Testing

### Running Tests

**All tests**:
```bash
pnpm test
```

**Watch mode**:
```bash
pnpm test:watch
```

**With coverage**:
```bash
pnpm test:coverage
```

**Specific worker**:
```bash
cd apps/example-worker
pnpm test
```

### Writing Tests

Use the testing utilities from `@cf-monorepo/testing`:

```typescript
import { describe, it, expect } from "vitest";
import { createMockEnv, createMockRequest } from "@cf-monorepo/testing";

describe("My Worker", () => {
  it("should handle requests", async () => {
    const env = createMockEnv();
    const request = createMockRequest("GET", "/");
    
    const response = await worker.fetch(request, env);
    
    expect(response).toBeValidResponse();
    expect(response.status).toBe(200);
  });
});
```

## Code Style

### Formatting

The project uses Biome for formatting:
- **Tabs** for indentation
- **Double quotes** for strings
- **Semicolons** required

**Format code**:
```bash
pnpm format
```

### TypeScript

- Use `import type` for type-only imports
- Prefer `const` over `let`
- Use explicit return types for public functions

### Import Organization

Imports should be organized alphabetically:

```typescript
// External packages
import { Hono } from "hono";
import { z } from "zod";

// Workspace packages
import { createDb } from "@cf-monorepo/db";
import type { Env } from "@cf-monorepo/types";

// Local imports
import { myFunction } from "./utils";
```

## Git Workflow

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add OAuth support
fix(db): resolve connection issue
docs: update README
chore: update dependencies
```

### Pre-commit Hooks

Lefthook runs automatically:
- Biome formatting/linting
- Type checking
- Commit message validation

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

## Debugging

### Local Debugging

**Verbose logging**:
```bash
wrangler dev --log-level debug
```

**Check logs**:
```bash
# In another terminal
wrangler tail
```

### Type Checking

**Check types**:
```bash
pnpm type-check
```

**Watch mode** (in IDE):
- VSCode: TypeScript server runs automatically
- Check Problems panel for errors

### Database Debugging

**Open Drizzle Studio**:
```bash
pnpm db:studio
```

**Check connection**:
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

## Deployment

### Staging Deployment

**Automatic**: Push to `develop` branch

**Manual**:
```bash
./scripts/deployment/deploy-worker.sh example-worker staging
```

### Production Deployment

**Automatic**: Push to `main` branch

**Manual**:
```bash
./scripts/deployment/deploy-worker.sh example-worker production
```

**Deploy all workers**:
```bash
./scripts/deployment/deploy-all.sh production
```

## Common Tasks

### Adding a New Package

1. Create directory: `packages/my-package/`
2. Create `package.json` with `workspace:*` dependencies
3. Add to workspace: Already included via `packages/*`
4. Install: `pnpm install`

### Adding a Dependency

**To a specific package**:
```bash
cd packages/my-package
pnpm add <package>
```

**To root** (dev dependencies):
```bash
pnpm add -D <package>
```

### Updating Dependencies

**Check for updates**:
```bash
pnpm outdated
```

**Update all**:
```bash
pnpm update
```

**Sync versions** (using syncpack):
```bash
pnpm syncpack
```

## IDE Setup

### VSCode

Recommended extensions (auto-installed):
- Biome
- TypeScript
- Cloudflare Workers

Settings are configured in `.vscode/settings.json`.

### Other IDEs

- Ensure Biome is configured as formatter
- TypeScript should use workspace version
- Enable format on save

## Troubleshooting

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues.

## Best Practices

1. **Run checks before committing**: `pnpm check && pnpm type-check`
2. **Write tests**: For new features and bug fixes
3. **Update documentation**: When adding features
4. **Use shared packages**: Don't duplicate code
5. **Follow patterns**: Check existing code for patterns
6. **Type everything**: Avoid `any` types
7. **Validate input**: Use Zod schemas
8. **Handle errors**: Use error middleware

## Resources

- [Architecture Guide](./ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Observability Guide](./OBSERVABILITY.md)
- [Database Setup](../DATABASE_SETUP.md)

