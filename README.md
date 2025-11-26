# Cloudflare Workers Monorepo Template

A production-ready monorepo template for building Cloudflare Workers applications with shared packages, consistent tooling, and modern development practices.

## Features

- **Monorepo Architecture** - Multiple workers and shared packages in a single repository
- **Turborepo** - Fast task orchestration with intelligent caching
- **pnpm Workspaces** - Efficient dependency management
- **syncpack** - Synchronized dependency versions across packages
- **TypeScript** - Strict type safety across the monorepo
- **Biome** - Lightning-fast formatter and linter (~35x faster than Prettier)
- **Lefthook** - Git hooks for pre-commit checks and conventional commits
- **Vitest** - Fast unit testing with Cloudflare Workers support
- **Changesets** - Version management and changelogs
- **Just** - Modern task runner with intuitive commands
- **Hono** - Fast and lightweight web framework
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Modern authentication solution
- **Hyperdrive** - Fast database connections
- **Neon Postgres** - Serverless PostgreSQL database

## Project Structure

```
cf-monorepo/
├── apps/
│   └── example-worker/     # Example Cloudflare Worker
├── packages/
│   ├── auth/               # Better Auth configuration
│   ├── config/             # Environment-aware configuration
│   ├── constants/           # Shared constants and types
│   ├── db/                 # Drizzle ORM schema and utilities
│   ├── middleware/         # Hono middleware (CORS, logging, security, etc.)
│   ├── openapi/            # OpenAPI schemas and utilities
│   ├── testing/            # Shared testing utilities
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Shared utility functions
├── scripts/
│   ├── development/        # Development helper scripts
│   ├── deployment/         # Deployment scripts
│   └── setup/              # Setup and initialization scripts
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # Architecture overview
│   ├── DEVELOPMENT.md      # Development guide
│   ├── OBSERVABILITY.md    # Logging and monitoring
│   └── TROUBLESHOOTING.md  # Troubleshooting guide
├── turbo/
│   └── generators/         # Turborepo generators for scaffolding
├── .changeset/             # Changeset configuration
├── .cursor/
│   └── rules/              # AI assistant rules
├── .github/
│   ├── workflows/          # CI/CD workflows
│   └── dependabot.yml      # Dependabot configuration
├── .vscode/                # VSCode settings and recommendations
├── biome.json              # Biome configuration
├── Justfile                # Task runner commands
├── lefthook.yml            # Git hooks configuration
├── vitest.config.ts        # Vitest test configuration
├── package.json            # Root package.json with workspace config
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── turbo.json              # Turborepo configuration
├── tsconfig.base.json      # Base TypeScript configuration
└── tsconfig.json           # Root TypeScript configuration (with Workers types)
```

## Getting Started

### Prerequisites

- Node.js 20+ (use [nvm](https://github.com/nvm-sh/nvm) or [Volta](https://volta.sh/))
- pnpm 9+ (`npm install -g pnpm@9`)
- [Just](https://github.com/casey/just) task runner (`brew install just` or see [installation](https://just.systems/man/en/chapter_4.html))
- Cloudflare account
- Neon account (for PostgreSQL)

### Installation

1. **Clone and install dependencies:**

```bash
pnpm install
```

This will also install Lefthook git hooks automatically via the `prepare` script.

2. **Set up environment variables:**

Copy the example environment file and configure:

```bash
# Copy example file
cp apps/example-worker/.dev.vars.example apps/example-worker/.dev.vars

# Edit with your values
nano apps/example-worker/.dev.vars
```

Required variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `BETTER_AUTH_SECRET` - A secure 32+ character secret
- `BETTER_AUTH_URL` - Your worker URL (http://localhost:8787 for local)

For production, use Cloudflare secrets:
```bash
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
```

3. **Configure Cloudflare resources:**

- Set up a Hyperdrive configuration in Cloudflare Dashboard
- Update `wrangler.jsonc` with your Hyperdrive ID
- Configure your Cloudflare account ID and API token

4. **Set up Neon database:**

- Create a Neon project at [console.neon.tech](https://console.neon.tech)
- Get your connection string
- Run migrations:

```bash
just db-setup     # or: pnpm db:setup
just db-migrate   # or: pnpm db:migrate
```

### Development

Using Just (recommended):

```bash
just                 # Show all available commands
just dev             # Start all workers in development mode
just check           # Run all checks (lint, format, types)
just fix             # Fix all auto-fixable issues
just test            # Run all tests
just build           # Build all packages
```

Or using pnpm directly:

```bash
pnpm dev             # Start all workers
pnpm check           # Run all checks
pnpm test            # Run tests
pnpm build           # Build all packages
```

## Creating New Workers & Packages

### Using Turborepo Generators (Recommended)

```bash
# Create a new worker interactively
just new-worker
# or: pnpm turbo gen worker

# Create a new shared package interactively
just new-package
# or: pnpm turbo gen package
```

The generator will prompt you for:
- Name
- Description
- Framework (Hono or basic)
- Database support
- Authentication support

### Manual Creation

<details>
<summary>Click to expand manual instructions</summary>

#### Adding a New Worker

1. Create a new directory in `apps/`:

```bash
mkdir apps/my-new-worker
```

2. Create `package.json`:

```json
{
  "name": "my-new-worker",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "tsc --noEmit",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome lint ./src",
    "check": "biome check ./src"
  },
  "dependencies": {
    "@cf-monorepo/types": "workspace:*",
    "@cf-monorepo/utils": "workspace:*",
    "hono": "^4.3.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240208.0",
    "@cloudflare/vitest-pool-workers": "^0.5.0",
    "typescript": "^5.3.3",
    "vitest": "^2.0.0",
    "wrangler": "^3.50.0"
  }
}
```

3. Create `tsconfig.json` and `wrangler.jsonc`

#### Adding a New Shared Package

1. Create a new directory in `packages/`
2. Create `package.json` with `workspace:*` dependencies
3. Create `tsconfig.json` extending `../../tsconfig.base.json`
4. Export from `src/index.ts`

</details>

## Tooling

### Just Task Runner

[Just](https://just.systems/) provides a clean command interface. Run `just` to see all commands:

```bash
just                 # List all commands
just dev             # Start development
just check           # Run all checks
just fix             # Fix issues
just test            # Run tests
just new-worker      # Create a new worker
just new-package     # Create a new package
just changeset       # Create a changeset
just outdated        # Show outdated dependencies
```

### Biome

[Biome](https://biomejs.dev/) handles formatting and linting (~35x faster than Prettier):

```bash
just check           # Check formatting and linting
just fix             # Fix all auto-fixable issues
just lint            # Lint only
just format          # Format only
```

Configuration is in `biome.json`.

### Lefthook

[Lefthook](https://lefthook.dev/) manages Git hooks:

- **pre-commit**: Runs Biome on staged files and type-checks
- **commit-msg**: Enforces [Conventional Commits](https://www.conventionalcommits.org/)
- **pre-push**: Runs full lint and type-check

Commit message format:
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

Examples:
  feat(auth): add OAuth support
  fix(db): resolve connection pooling issue
  docs: update README
```

### Vitest

[Vitest](https://vitest.dev/) for fast testing with Cloudflare Workers support:

```bash
just test            # Run all tests
just test-watch      # Run tests in watch mode
just test-coverage   # Run tests with coverage
```

### Changesets

[Changesets](https://github.com/changesets/changesets) for version management:

```bash
just changeset       # Create a new changeset
just version         # Version packages based on changesets
```

### TypeScript

Strict TypeScript configuration with:

- `strict: true` with all additional strict flags
- `noUncheckedIndexedAccess` for safer array/object access
- `verbatimModuleSyntax` for explicit type imports
- Separate base config (`tsconfig.base.json`) for packages without Workers types

## Dependency Management

### syncpack

[syncpack](https://www.npmjs.com/package/syncpack) keeps dependency versions synchronized:

```bash
just deps-check      # Check for version mismatches
just deps-fix        # Fix version mismatches
```

### Workspace Dependencies

Use `workspace:*` for internal package dependencies:

```json
{
  "dependencies": {
    "@cf-monorepo/types": "workspace:*"
  }
}
```

## CI/CD

### GitHub Actions

The repository includes GitHub Actions workflows:

- **CI**: Runs on push/PR - Biome checks, type checks, tests, and builds
- **Deploy**: Deploys to Cloudflare Workers on push to main

### Cloudflare Workers Builds

For production deployments, use [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/):

1. Connect your repository in Cloudflare Dashboard
2. Set root directory for each worker (e.g., `apps/example-worker`)
3. Configure build commands (e.g., `turbo deploy -F example-worker`)
4. Set up build watch paths for optimized builds

## Commands Reference

### Just Commands

| Command | Description |
|---------|-------------|
| `just` | Show all available commands |
| `just dev` | Start all workers in development mode |
| `just dev-worker <name>` | Start a specific worker |
| `just check` | Run all checks (lint, format, types) |
| `just fix` | Fix all auto-fixable issues |
| `just test` | Run all tests |
| `just test-watch` | Run tests in watch mode |
| `just test-coverage` | Run tests with coverage |
| `just build` | Build all packages |
| `just deploy` | Deploy all workers |
| `just new-worker` | Create a new worker (interactive) |
| `just new-package` | Create a new shared package |
| `just db-generate` | Generate Drizzle migrations |
| `just db-migrate` | Apply database migrations |
| `just db-studio` | Open Drizzle Studio |
| `just db-setup` | Full database setup (schema + migrations) |
| `just auth-schema` | Generate Better Auth schema |
| `just changeset` | Create a new changeset |
| `just version` | Version packages |
| `just outdated` | Show outdated dependencies |

### pnpm Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all workers in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages with Biome |
| `pnpm check` | Run all Biome checks |
| `pnpm check:fix` | Run all checks and fix issues |
| `pnpm type-check` | Type check all packages |
| `pnpm clean` | Clean build artifacts |
| `pnpm db:setup` | Full database setup |
| `pnpm changeset` | Create a changeset |
| `pnpm syncpack:check` | Check dependency versions |

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - System design and patterns
- [Development Guide](docs/DEVELOPMENT.md) - Complete development workflow
- [Observability Guide](docs/OBSERVABILITY.md) - Logging and monitoring
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Database Setup](DATABASE_SETUP.md) - Database configuration guide

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Biome Documentation](https://biomejs.dev/)
- [Lefthook Documentation](https://lefthook.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Just Manual](https://just.systems/man/en/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Neon Documentation](https://neon.tech/docs)

## License

MIT
