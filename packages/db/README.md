# @repo/db

Drizzle ORM database utilities and schema for Cloudflare Workers with Neon Postgres.

## Installation

```json
{
  "dependencies": {
    "@repo/db": "workspace:*"
  }
}
```

## Usage

### Creating Database Connection

The `createDb` function supports both direct `DATABASE_URL` and Cloudflare Hyperdrive bindings.

```typescript
import { createDb } from "@repo/db";
import type { Env } from "@repo/types";

export default {
  async fetch(request: Request, env: Env) {
    const db = createDb(env);

    // Now use Drizzle ORM queries
    const allUsers = await db.query.users.findMany();

    return Response.json({ users: allUsers });
  },
};
```

### Schema

The package exports a `users` table schema:

```typescript
import { users, type User, type NewUser } from "@repo/db";
import { eq } from "drizzle-orm";

// Query users
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
});

// Insert user
const newUser: NewUser = {
  email: "user@example.com",
  name: "John Doe",
};

const [inserted] = await db.insert(users)
  .values(newUser)
  .returning();
```

### Type Inference

```typescript
import type { User, NewUser } from "@repo/db";

// User = full record with id, createdAt, updatedAt
const user: User = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// NewUser = for inserting (id, createdAt, updatedAt are optional)
const newUser: NewUser = {
  email: "new@example.com",
  name: "New User",
};
```

## Configuration

### With Hyperdrive (Recommended for Production)

In `wrangler.jsonc`:

```jsonc
{
  "hyperdrive": [{
    "binding": "HYPERDRIVE",
    "id": "your-hyperdrive-id",
    "localConnectionString": "postgresql://user:pass@localhost:5432/db"
  }]
}
```

In `.dev.vars`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dev_db
```

### Direct Connection (Development)

In `.dev.vars`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dev_db
```

## Migrations

### Generate Migrations

```bash
# After modifying schema
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio
```

### Adding New Tables

1. Define your schema in `src/schema/index.ts`:

```typescript
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

2. Generate and apply migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

## Better Auth Integration

This package is designed to work with Better Auth. The Better Auth schema can be generated using:

```bash
pnpm auth:generate-schema
```

This creates `src/schema/better-auth.ts` which is automatically exported.

## Testing

```bash
# Run database tests
pnpm vitest run --project packages packages/db
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Direct Postgres connection string | Yes (or HYPERDRIVE) |
| `HYPERDRIVE` | Cloudflare Hyperdrive binding | No |

## Best Practices

### Use Service Layer Pattern

**Don't** put database queries in route handlers:

```typescript
// ❌ Bad
app.get("/users", async (c) => {
  const db = createDb(c.env);
  const users = await db.select().from(users);
  return c.json(users);
});
```

**Do** use service classes:

```typescript
// ✅ Good
class UserService {
  constructor(private readonly db: Database) {}

  async findAll() {
    return this.db.select().from(users);
  }
}

app.get("/users", async (c) => {
  const service = new UserService(createDb(c.env));
  const users = await service.findAll();
  return c.json(users);
});
```

### Use Transactions

For multi-operation updates:

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values(newUser).returning();
  await tx.insert(posts).values({ authorId: user.id, title: "First post" });
});
```

### Use Prepared Statements

For repeated queries:

```typescript
const getUserById = db.select()
  .from(users)
  .where(eq(users.id, sql.placeholder("id")))
  .prepare("get_user_by_id");

const user = await getUserById.execute({ id: 1 });
```

## Troubleshooting

### Connection Errors

If you see "DATABASE_URL or HYPERDRIVE binding is required":
- Check `.dev.vars` has `DATABASE_URL`
- Or verify `HYPERDRIVE` binding in `wrangler.jsonc`

### Type Errors

If types are not working:
- Run `pnpm db:generate` to sync schema
- Restart TypeScript server in your editor

## License

MIT
