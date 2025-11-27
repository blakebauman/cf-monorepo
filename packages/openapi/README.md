# @repo/openapi

Shared OpenAPI schemas, utilities, and response definitions for API documentation.

## Installation

```json
{
  "dependencies": {
    "@repo/openapi": "workspace:*"
  }
}
```

## Usage

### Standard Response Schemas

```typescript
import { OpenAPIHono } from "@hono/zod-openapi";
import { SuccessResponseSchema, standardErrorResponses } from "@repo/openapi";
import { z } from "zod";

const app = new OpenAPIHono();

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
});

app.openapi(
  {
    method: "get",
    path: "/api/users/{id}",
    responses: {
      200: {
        description: "User retrieved successfully",
        content: {
          "application/json": {
            schema: SuccessResponseSchema(UserSchema),
          },
        },
      },
      ...standardErrorResponses,
    },
  },
  async (c) => {
    const user = await findUser(c.req.param("id"));
    return c.json({ success: true, data: user });
  }
);
```

### Error Response Schemas

Pre-defined error responses for common HTTP status codes:

```typescript
import { standardErrorResponses } from "@repo/openapi";

// Includes:
// - 400: Bad Request
// - 401: Unauthorized
// - 403: Forbidden
// - 404: Not Found
// - 500: Internal Server Error
```

### Generate OpenAPI 3.1 Documentation

```typescript
import { apiReference } from "@scalar/hono-api-reference";

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "My API",
    version: "1.0.0",
    description: "Production-ready API with OpenAPI 3.1 documentation",
  },
  servers: [
    {
      url: "https://api.example.com",
      description: "Production",
    },
    {
      url: "http://localhost:8787",
      description: "Development",
    },
  ],
});

app.get("/docs", apiReference({
  theme: "purple",
  spec: { url: "/openapi.json" },
}));
```

## Example: Complete OpenAPI Route

```typescript
import { createRoute, z } from "@hono/zod-openapi";
import { SuccessResponseSchema, standardErrorResponses } from "@repo/openapi";

const GetUsersRoute = createRoute({
  method: "get",
  path: "/api/users",
  tags: ["Users"],
  summary: "Get all users",
  request: {
    query: z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
    }),
  },
  responses: {
    200: {
      description: "Users retrieved successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema(z.array(UserSchema)),
        },
      },
    },
    ...standardErrorResponses,
  },
});

app.openapi(GetUsersRoute, async (c) => {
  const { page, limit } = c.req.valid("query");
  const users = await db.query.users.findMany({ limit, offset: (page - 1) * limit });
  return c.json({ success: true, data: users });
});
```

## OpenAPI 3.1

This package uses OpenAPI 3.1.0 for API documentation. OpenAPI 3.1 includes several improvements over 3.0:
- Enhanced JSON Schema support (full JSON Schema 2020-12 compatibility)
- Better type definitions and validation
- Improved webhook support
- More flexible schema composition

Simply specify `openapi: "3.1.0"` in your `app.doc()` configuration to generate OpenAPI 3.1 documentation that Scalar will render correctly.

## License

MIT
