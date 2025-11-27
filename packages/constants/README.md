# @repo/constants

Shared constants, enums, and configuration values for the monorepo.

## Installation

```json
{
  "dependencies": {
    "@repo/constants": "workspace:*"
  }
}
```

## Usage

Import shared constants to ensure consistency across the monorepo:

```typescript
import { HTTP_STATUS, ERROR_CODES, ENVIRONMENTS } from "@repo/constants";

app.get("/api/users/:id", async (c) => {
  const user = await findUser(id);

  if (!user) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND },
      HTTP_STATUS.NOT_FOUND
    );
  }

  return c.json({ user }, HTTP_STATUS.OK);
});
```

## Available Constants

### HTTP Status Codes

```typescript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
```

### Error Codes

```typescript
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
```

### Environments

```typescript
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
} as const;

export type Environment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];
```

## Adding Constants

Edit `packages/constants/src/index.ts`:

```typescript
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
```

## License

MIT
