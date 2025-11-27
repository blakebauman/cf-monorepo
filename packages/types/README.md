# @repo/types

Shared TypeScript type definitions for the monorepo.

## Installation

```json
{
  "dependencies": {
    "@repo/types": "workspace:*"
  }
}
```

## Core Types

### `Env`

Cloudflare Workers environment bindings:

```typescript
import type { Env } from "@repo/types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // env.DATABASE_URL is typed
    // env.HYPERDRIVE is typed
    // env.BETTER_AUTH_SECRET is typed
  },
};
```

### `ApiResponse<T>`

Standard API response format:

```typescript
import type { ApiResponse } from "@repo/types";

const response: ApiResponse<User> = {
  success: true,
  data: user,
};

const error: ApiResponse = {
  success: false,
  error: "NOT_FOUND",
  message: "User not found",
};
```

### `PaginatedResponse<T>`

Paginated API response with metadata:

```typescript
import type { PaginatedResponse } from "@repo/types";

const response: PaginatedResponse<User> = {
  success: true,
  data: users,
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
  },
};
```

## Usage with Hono

```typescript
import { Hono } from "hono";
import type { Env } from "@repo/types";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  // c.env is fully typed
  const dbUrl = c.env.DATABASE_URL;
  return c.json({ ok: true });
});
```

## Extending Types

Add custom types by editing `packages/types/src/index.ts`:

```typescript
export interface CustomEnv extends Env {
  CUSTOM_API_KEY: string;
  CUSTOM_BINDING: KVNamespace;
}
```

## License

MIT
