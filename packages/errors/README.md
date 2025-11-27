# @repo/errors

Centralized error handling with custom error classes and utilities.

## Installation

```json
{
  "dependencies": {
    "@repo/errors": "workspace:*"
  }
}
```

## Features

- **Custom Error Classes** - Specialized errors for common scenarios
- **Error Severity Levels** - Categorize errors by severity
- **Type-Safe** - Full TypeScript support with type guards
- **Serialization** - Convert errors to JSON or API responses
- **Context Support** - Attach additional data to errors
- **Cause Tracking** - Chain errors with original causes

## Error Classes

### BaseError

Base class for all custom errors with full configuration options.

```typescript
import { BaseError, ErrorSeverity } from "@repo/errors";

const error = new BaseError({
  code: "CUSTOM_ERROR",
  message: "Something went wrong",
  statusCode: 500,
  severity: ErrorSeverity.HIGH,
  expose: false,
  context: { userId: 123 },
});
```

### ValidationError (400)

User input validation failures.

```typescript
import { ValidationError } from "@repo/errors";

throw new ValidationError("Invalid email format", { field: "email" });
```

### AuthenticationError (401)

Authentication failures (missing or invalid credentials).

```typescript
import { AuthenticationError } from "@repo/errors";

throw new AuthenticationError("Invalid token");
// Default message: "Authentication required"
```

### AuthorizationError (403)

Insufficient permissions.

```typescript
import { AuthorizationError } from "@repo/errors";

throw new AuthorizationError("Admin access required");
// Default: "Insufficient permissions"
```

### NotFoundError (404)

Resource not found.

```typescript
import { NotFoundError } from "@repo/errors";

throw new NotFoundError("User", 123);
// Message: "User not found"
// Context: { resource: "User", identifier: 123 }
```

### ConflictError (409)

Resource conflicts (e.g., duplicate email).

```typescript
import { ConflictError } from "@repo/errors";

throw new ConflictError("Email already exists", { email: "user@example.com" });
```

### RateLimitError (429)

Rate limit exceeded.

```typescript
import { RateLimitError } from "@repo/errors";

throw new RateLimitError("Too many requests", 60); // retryAfter in seconds
```

### DatabaseError (500)

Database operation failures.

```typescript
import { DatabaseError } from "@repo/errors";

try {
  await db.query(...);
} catch (err) {
  throw new DatabaseError("Query failed", err as Error, { query: "SELECT ..." });
}
```

### ExternalServiceError (502)

Third-party service failures.

```typescript
import { ExternalServiceError } from "@repo/errors";

throw new ExternalServiceError("Stripe", "Payment processing failed", originalError);
```

### ConfigurationError (500)

Configuration or environment issues.

```typescript
import { ConfigurationError } from "@repo/errors";

if (!env.DATABASE_URL) {
  throw new ConfigurationError("Missing DATABASE_URL");
}
```

## Usage with Hono

### Error Handler Middleware

```typescript
import { Hono } from "hono";
import { isBaseError, formatErrorForLogging } from "@repo/errors";
import type { Env } from "@repo/types";

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  // Log error with full details
  console.error(JSON.stringify(formatErrorForLogging(err, requestId)));

  // Handle custom errors
  if (isBaseError(err)) {
    const isDevelopment = c.env.ENVIRONMENT === "development";
    return c.json(err.toResponse(isDevelopment), err.statusCode);
  }

  // Handle unknown errors
  return c.json(
    {
      success: false,
      error: "INTERNAL_ERROR",
      message: c.env.ENVIRONMENT === "development" ? err.message : undefined,
    },
    500
  );
});
```

### In Route Handlers

```typescript
import { NotFoundError, ValidationError } from "@repo/errors";

app.get("/api/users/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    throw new ValidationError("Invalid user ID", { field: "id" });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });

  if (!user) {
    throw new NotFoundError("User", id);
  }

  return c.json({ success: true, data: user });
});
```

### In Service Classes

```typescript
import { DatabaseError, NotFoundError } from "@repo/errors";

export class UserService {
  async findById(id: number): Promise<User> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        throw new NotFoundError("User", id);
      }

      return user;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }
      throw new DatabaseError("Failed to fetch user", err as Error, { id });
    }
  }
}
```

## Error Utilities

### isBaseError(error)

Type guard to check if error is a BaseError instance.

```typescript
import { isBaseError } from "@repo/errors";

if (isBaseError(error)) {
  console.log(error.code, error.statusCode);
}
```

### getErrorMessage(error)

Safely extract error message from any type.

```typescript
import { getErrorMessage } from "@repo/errors";

const message = getErrorMessage(error); // Works with Error, string, or unknown
```

### getErrorStack(error)

Safely extract stack trace from errors.

```typescript
import { getErrorStack } from "@repo/errors";

const stack = getErrorStack(error);
```

### toBaseError(error)

Convert any error type to BaseError.

```typescript
import { toBaseError } from "@repo/errors";

try {
  // Some operation
} catch (err) {
  const baseError = toBaseError(err);
  console.log(baseError.toJSON());
}
```

### formatErrorForLogging(error, requestId?)

Format error for structured logging.

```typescript
import { formatErrorForLogging } from "@repo/errors";

const logEntry = formatErrorForLogging(error, "req-123");
console.error(JSON.stringify(logEntry));
```

## Error Severity

```typescript
export enum ErrorSeverity {
  LOW = "low",          // User errors, validation
  MEDIUM = "medium",    // Auth errors, not found
  HIGH = "high",        // Database errors, service failures
  CRITICAL = "critical" // Configuration errors, system failures
}
```

## Serialization

### toJSON()

Full error details for logging:

```typescript
const error = new ValidationError("Invalid input", { field: "email" });
const json = error.toJSON();
// {
//   name: "ValidationError",
//   code: "VALIDATION_ERROR",
//   message: "Invalid input",
//   statusCode: 400,
//   severity: "low",
//   context: { field: "email" },
//   timestamp: "2024-01-01T00:00:00.000Z",
//   stack: "...",
// }
```

### toResponse(includeDetails?)

API response format:

```typescript
const error = new NotFoundError("User", 123);
const response = error.toResponse();
// {
//   success: false,
//   error: "NOT_FOUND_ERROR",
//   message: "User not found",  // Only if expose: true
//   context: { resource: "User", identifier: 123 }
// }
```

## Best Practices

### 1. Use Specific Error Classes

```typescript
// ✅ Good - specific error
throw new ValidationError("Invalid email", { field: "email" });

// ❌ Bad - generic error
throw new Error("Invalid email");
```

### 2. Include Context

```typescript
// ✅ Good - context helps debugging
throw new DatabaseError("Query failed", err, {
  query: sql,
  params,
  table: "users"
});

// ❌ Bad - no context
throw new DatabaseError("Query failed");
```

### 3. Chain Errors with Cause

```typescript
// ✅ Good - preserve error chain
try {
  await externalApi.call();
} catch (err) {
  throw new ExternalServiceError("API", "Call failed", err as Error);
}
```

### 4. Set Appropriate Exposure

```typescript
// Sensitive data - don't expose
throw new DatabaseError("Connection failed"); // expose: false by default

// User-facing errors - expose
throw new ValidationError("Invalid format"); // expose: true by default
```

## Testing

```bash
pnpm vitest run --project packages packages/errors
```

## License

MIT
