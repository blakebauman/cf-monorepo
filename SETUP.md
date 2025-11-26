# Setup Guide

Complete setup instructions for the Cloudflare Workers monorepo.

## Environment Variables

### Worker Applications

Each worker application needs environment variables. Create a `.dev.vars` file in each worker directory (e.g., `apps/example-worker/.dev.vars`):

```bash
# Database connection
# Option 1: Direct connection (for local development)
DATABASE_URL=postgresql://user:password@host/database

# Option 2: Use Hyperdrive (configure in wrangler.jsonc)
# Hyperdrive binding will be automatically used if configured

# Better Auth configuration
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:8787
```

### Database Package

For running migrations (Node.js scripts), create a `.env` file in `packages/db/`:

```bash
DATABASE_URL=postgresql://user:password@host/database
```

Note: Package scripts (like migrations) use `.env` files, while Workers use `.dev.vars`.

## Initial Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

This automatically installs Lefthook git hooks via the `prepare` script.

### 2. Set Up Neon Database

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string
3. Add it to `packages/db/.env`

### 3. Set Up Database Schema

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

Quick setup:
```bash
# Generate Better Auth schema
pnpm auth:generate-schema

# Update packages/db/src/schema/index.ts to export Better Auth schema
# Then generate and apply migrations
pnpm db:generate
pnpm db:migrate
```

Or use the combined command:
```bash
pnpm db:setup
```

### 4. Set Up Cloudflare Resources

1. Create a Hyperdrive configuration in Cloudflare Dashboard
2. Update `wrangler.jsonc` in your worker with the Hyperdrive ID
3. Configure your Cloudflare account ID

### 5. Configure Better Auth

1. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
2. Set `BETTER_AUTH_SECRET` in your worker's `.dev.vars` (for local dev) or as a Cloudflare secret (for production)
3. Set `BETTER_AUTH_URL` to your worker's URL (use `http://localhost:8787` for local dev)

### 6. Start Development

```bash
pnpm dev
```

## Cloudflare Workers Builds Setup

For production deployments using Cloudflare Workers Builds:

1. Go to [Workers & Pages Dashboard](https://dash.cloudflare.com)
2. For each worker:
   - Create or select the worker
   - Connect your Git repository
   - Set root directory (e.g., `apps/example-worker`)
   - Configure build command: `turbo deploy -F example-worker`
   - Set build watch paths (optional, for optimized builds)

## Troubleshooting

### Database Connection Issues

- Ensure `DATABASE_URL` is set correctly
- For Hyperdrive, verify the binding is configured in `wrangler.jsonc`
- Check that your Neon database is active (not suspended)

### Better Auth Issues

- Verify `BETTER_AUTH_SECRET` is at least 32 characters
- Ensure `BETTER_AUTH_URL` matches your worker's URL
- Check that the database schema has been migrated

### Build Issues

- Run `pnpm syncpack:check` to verify dependency versions
- Clear Turbo cache: `rm -rf .turbo`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

### Lefthook Issues

If git hooks aren't working:
```bash
pnpm lefthook install
```

### Biome Issues

If Biome isn't finding files:
```bash
# Check Biome configuration
pnpm biome check --verbose .
```
