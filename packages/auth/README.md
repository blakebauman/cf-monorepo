# @repo/auth

Better Auth configuration for Cloudflare Workers with Drizzle ORM integration.

## Installation

```json
{
  "dependencies": {
    "@repo/auth": "workspace:*"
  }
}
```

## Usage

### Initialize Better Auth

```typescript
import { createAuth } from "@repo/auth";
import { createDb } from "@repo/db";
import type { Env } from "@repo/types";

export default {
  async fetch(request: Request, env: Env) {
    const auth = createAuth(env);

    return auth.handler(request);
  },
};
```

### With Hono

```typescript
import { Hono } from "hono";
import { createAuth } from "@repo/auth";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user: session.user });
});
```

## Configuration

### Environment Variables

Required in `.dev.vars` (development) and Cloudflare Secrets (production):

```
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:8787
DATABASE_URL=postgresql://...
```

### Generate Better Auth Schema

Before using, generate the Better Auth database schema:

```bash
pnpm auth:generate-schema
```

This creates `packages/db/src/schema/better-auth.ts` with required tables.

### Apply Migrations

```bash
pnpm db:generate
pnpm db:migrate
```

## Features

### Email/Password Authentication

Built-in email and password authentication:

```typescript
// Signup
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}

// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure-password"
}

// Logout
POST /api/auth/logout
```

### Session Management

Sessions are stored in the database via Drizzle adapter:

```typescript
const session = await auth.api.getSession({ headers: request.headers });

if (session) {
  console.log("User:", session.user);
  console.log("Session expires:", session.expiresAt);
}
```

## Protected Routes

```typescript
import { createAuth } from "@repo/auth";

app.get("/api/protected", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ message: "Protected data", user: session.user });
});
```

## Extending Configuration

Add social providers or plugins by modifying `packages/auth/src/index.ts`:

```typescript
export function createAuth(env: Env) {
  const db = createDb(env);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
  });
}
```

## TypeScript

Export auth types for use in your application:

```typescript
import type { Auth } from "better-auth";
export type AuthInstance = ReturnType<typeof createAuth>;
```

## Documentation

- [Better Auth Docs](https://better-auth.com)
- [Drizzle Adapter](https://better-auth.com/docs/integrations/drizzle)

## License

MIT
