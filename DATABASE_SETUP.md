# Database Setup Guide

This guide walks you through setting up your database with Better Auth and Drizzle ORM.

## Prerequisites

- Neon account and project created
- Database connection string available
- Environment variables configured

## Step 1: Configure Environment Variables

Create `packages/db/.env`:

```bash
DATABASE_URL=postgresql://user:password@host/database
```

Also set these in `packages/auth/.env` for schema generation:

```bash
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
BETTER_AUTH_URL=http://localhost:8787
```

## Step 2: Generate Better Auth Schema

Better Auth requires specific database tables. Generate them:

```bash
pnpm auth:generate-schema
```

This will create `packages/db/src/schema/better-auth.ts` with all required Better Auth tables.

## Step 3: Update Database Schema Index

After generating the Better Auth schema, update `packages/db/src/schema/index.ts`:

```typescript
// Uncomment this line:
export * from "./better-auth";
```

## Step 4: Generate Drizzle Migrations

Generate migration files for all schema changes:

```bash
pnpm db:generate
```

This creates migration files in `packages/db/drizzle/`.

## Step 5: Apply Migrations

Apply the migrations to your database:

```bash
pnpm db:migrate
```

## Alternative: One-Command Setup

You can also run the combined setup script:

```bash
pnpm db:setup
```

This runs both Better Auth schema generation and Drizzle migration generation.

## Verify Setup

After migrations are applied, you can:

1. **Check tables in Neon console**: Verify that Better Auth tables are created
2. **Use Drizzle Studio**: Run `pnpm --filter @repo/db studio` to browse your database
3. **Test the connection**: Start your worker and test auth endpoints

## Better Auth Tables

After setup, your database will include these Better Auth tables:

- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens
- And more based on enabled plugins

## Troubleshooting

### Schema Generation Fails

- Ensure `DATABASE_URL` is set in `packages/auth/.env`
- Check that the connection string is valid
- Verify your Neon database is active (not suspended)

### Migration Errors

- Ensure `DATABASE_URL` is set in `packages/db/.env`
- Check that previous migrations were applied successfully
- Review migration files in `packages/db/drizzle/` for errors

### Type Errors

- Run `pnpm type-check` to verify TypeScript types
- Ensure Better Auth schema is exported from `packages/db/src/schema/index.ts`
- Restart your TypeScript server in your IDE

## Next Steps

After database setup is complete:

1. Start your worker: `pnpm dev`
2. Test authentication endpoints
3. Customize your schema in `packages/db/src/schema/`
4. Add more tables as needed for your application

