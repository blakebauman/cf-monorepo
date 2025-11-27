# @repo/utils

Shared utility functions for API responses, validation, and common operations.

## Installation

```json
{
  "dependencies": {
    "@repo/utils": "workspace:*"
  }
}
```

## API

### `successResponse<T>(data: T, message?: string)`

Creates a successful API response.

```typescript
import { successResponse } from "@repo/utils";

app.get("/api/user", (c) => {
  const user = { id: 1, name: "John" };
  return c.json(successResponse(user));
});

// Response:
// { "success": true, "data": { "id": 1, "name": "John" } }

// With message
return c.json(successResponse(user, "User retrieved successfully"));
```

### `errorResponse(error: string, message?: string)`

Creates an error API response.

```typescript
import { errorResponse } from "@repo/utils";

app.get("/api/user/:id", (c) => {
  const user = findUser(id);
  if (!user) {
    return c.json(errorResponse("NOT_FOUND", "User not found"), 404);
  }
  return c.json(successResponse(user));
});

// Error response:
// { "success": false, "error": "NOT_FOUND", "message": "User not found" }
```

### `paginatedResponse<T>(data: T[], page: number, limit: number, total: number)`

Creates a paginated API response with metadata.

```typescript
import { paginatedResponse } from "@repo/utils";

app.get("/api/users", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const users = await db.query.users.findMany({ limit, offset: (page - 1) * limit });
  const total = await db.select({ count: count() }).from(users);

  return c.json(paginatedResponse(users, page, limit, total[0].count));
});

// Response:
// {
//   "success": true,
//   "data": [...],
//   "pagination": {
//     "page": 1,
//     "limit": 20,
//     "total": 100,
//     "totalPages": 5
//   }
// }
```

### `safeJsonParse<T>(json: string, fallback: T)`

Safely parses JSON with fallback value.

```typescript
import { safeJsonParse } from "@repo/utils";

const data = safeJsonParse(req.body, {});
// Returns parsed object or fallback if JSON is invalid

const config = safeJsonParse(env.CONFIG_JSON, { debug: false });
```

### `isValidEmail(email: string)`

Validates email format using regex.

```typescript
import { isValidEmail } from "@repo/utils";

app.post("/api/signup", async (c) => {
  const { email } = await c.req.json();

  if (!isValidEmail(email)) {
    return c.json(errorResponse("INVALID_EMAIL", "Invalid email format"), 400);
  }

  // Proceed with signup
});
```

## Testing

```bash
pnpm vitest run --project packages packages/utils
```

## License

MIT
