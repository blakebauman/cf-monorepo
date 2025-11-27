# Repository Pattern Implementation

This document describes the repository pattern implementation in the monorepo.

## Overview

The monorepo now includes a complete repository pattern implementation with:
- BaseRepository class for generic CRUD operations
- Service layer for business logic
- DTO transformers for secure data responses
- Transaction support with retry logic
- Pagination utilities

## Architecture Layers

### 1. Repository Layer (`src/repositories/`)

**Purpose:** Data access and database operations

**Key Features:**
- Extends `BaseRepository<T>` from `@repo/db`
- Provides type-safe CRUD operations
- Custom queries specific to entities
- Transaction support

**Example:**
```typescript
import { BaseRepository, users, type Database, type User } from "@repo/db";
import { eq, type SQL } from "drizzle-orm";

export class UserRepository extends BaseRepository<User> {
  constructor(db: Database) {
    super(db, users);
  }

  protected getIdColumn(): SQL {
    return users.id as unknown as SQL;
  }

  protected getDefaultOrderBy(): SQL {
    return users.createdAt as unknown as SQL;
  }

  // Custom repository methods
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user ?? null;
  }
}
```

### 2. Service Layer (`src/services/`)

**Purpose:** Business logic and validation

**Key Features:**
- Uses repositories for data access
- Implements business rules
- Throws domain-specific errors
- Coordinates multiple repositories (transactions)

**Example:**
```typescript
import { ConflictError } from "@repo/errors";
import type { User } from "@repo/db";
import type { UserRepository } from "../repositories/user-repository";

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async create(data: NewUser): Promise<User> {
    // Business logic: check if email already exists
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("Email already exists", { email: data.email });
    }

    return this.repo.create(data);
  }
}
```

### 3. Routes Layer (`src/routes/`)

**Purpose:** HTTP request handling and response formatting

**Key Features:**
- OpenAPI route definitions
- Automatic request validation (zod-openapi)
- DTO transformations
- Error handling

**Example:**
```typescript
import { createRoute } from "@hono/zod-openapi";
import { UserDTO } from "../dto";

const createUserRoute = createRoute({
  method: "post",
  path: "/api/users",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserBodySchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "User created",
      content: {
        "application/json": {
          schema: UserResponseSchema
        }
      }
    },
    ...standardErrorResponses
  }
});

export function registerUserRoutes(app: OpenAPIHono<Context>) {
  app.openapi(createUserRoute, async (c) => {
    const body = c.req.valid("json"); // Already validated!
    const services = c.get("services");

    const user = await services.user.create(body);

    return c.json(successResponse(UserDTO.toResponse(user)) as never, 201);
  });
}
```

### 4. DTO Layer (`src/dto/`)

**Purpose:** Data transformation and security

**Key Features:**
- Exclude sensitive fields (passwords, tokens)
- Serialize dates to ISO strings
- Remove null values (optional)
- Public vs. internal transformations

**Example:**
```typescript
import { BaseDTO } from "@repo/openapi";
import type { User } from "@repo/db";

export class UserDTO extends BaseDTO {
  static toResponse(user: User) {
    return this.toDTO(user, {
      exclude: ["password", "passwordHash"],
      serializeDates: true,
      removeNulls: false,
    });
  }

  static toPublic(user: User) {
    return this.pick(user, ["id", "name", "email"]);
  }
}
```

## BaseRepository Features

The `BaseRepository` class provides:

### CRUD Operations
- `findAll(options?)` - Get all records with pagination
- `findAllPaginated(options?)` - Get records with pagination metadata
- `findById(id)` - Get single record by ID
- `findByIdOrThrow(id)` - Get record or throw NotFoundError
- `create(data)` - Create new record
- `createMany(data[])` - Create multiple records in transaction
- `update(id, data)` - Update record by ID
- `updateOrThrow(id, data)` - Update or throw NotFoundError
- `delete(id)` - Delete record by ID (hard delete)
- `deleteOrThrow(id)` - Delete or throw NotFoundError
- `softDelete(id)` - Soft delete (requires deletedAt column)

### Utility Methods
- `count(where?)` - Count records
- `exists(id)` - Check if record exists

### Protected Methods
- `executeQuery(fn)` - Execute custom query
- `withTransaction(fn)` - Execute in transaction

## Transaction Support

### Simple Transactions
```typescript
import { withTransaction } from "@repo/db";

const result = await withTransaction(db, async (tx) => {
  const user = await tx.insert(users).values(data).returning();
  await tx.insert(profiles).values({ userId: user.id });
  return user;
});
```

### Transactions with Retry
```typescript
import { withTransactionRetry } from "@repo/db";

const result = await withTransactionRetry(
  db,
  async (tx) => {
    // Your transaction logic
  },
  {
    maxRetries: 3,
    retryDelay: 100
  }
);
```

### Transactions in Repositories
```typescript
export class UserService {
  async createUserWithProfile(userData: NewUser, profileData: NewProfile) {
    return this.repo.withTransaction(async (tx) => {
      const user = await tx.insert(users).values(userData).returning();
      await tx.insert(profiles).values({ ...profileData, userId: user.id });
      return user;
    });
  }
}
```

## Pagination

### Basic Pagination
```typescript
const users = await userService.findAll({
  page: 1,
  limit: 10
});
```

### With Metadata
```typescript
const result = await userService.findAllPaginated({
  page: 1,
  limit: 10
});

// result = {
//   data: User[],
//   pagination: {
//     page: 1,
//     limit: 10,
//     total: 100,
//     totalPages: 10
//   }
// }
```

### Advanced Queries
```typescript
const users = await userRepository.findAll({
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
  where: eq(users.active, true)
});
```

## Error Handling

### Custom Errors from @repo/errors

The monorepo uses custom error classes for consistent error handling:

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from "@repo/errors";

// In services
if (!isValidEmail(email)) {
  throw new ValidationError("Invalid email format", { email });
}

if (!session) {
  throw new AuthenticationError("User not authenticated");
}

if (!user.canEdit(resource)) {
  throw new AuthorizationError("Cannot edit this resource");
}

const user = await userRepo.findById(id);
if (!user) {
  throw new NotFoundError("User", id);
}

const existing = await userRepo.findByEmail(email);
if (existing) {
  throw new ConflictError("Email already exists", { email });
}
```

### Automatic Error Handling

The worker's error handler automatically converts BaseError instances to appropriate HTTP responses:

```typescript
app.onError((err, c) => {
  const requestId = c.get("requestId");

  if (isBaseError(err)) {
    return c.json(
      {
        success: false,
        error: err.code,
        message: err.expose ? err.message : "An error occurred",
        requestId,
      },
      err.statusCode
    );
  }

  return errorHandler()(err, c);
});
```

## Schema Composition with @repo/openapi

### Helper Functions

```typescript
import {
  withTimestamps,
  withId,
  withAudit,
  withSoftDelete,
  createInputSchema,
  updateInputSchema
} from "@repo/openapi";

// Add timestamps (createdAt, updatedAt)
const UserSchema = withTimestamps(BaseUserSchema);

// Add ID field
const UserSchema = withId(BaseUserSchema, "number");

// Add audit fields (createdBy, updatedBy)
const UserSchema = withAudit(BaseUserSchema);

// Add soft delete (deletedAt)
const UserSchema = withSoftDelete(BaseUserSchema);

// Create input schema (omits id, createdAt, updatedAt)
const CreateUserSchema = createInputSchema(UserSchema);

// Update input schema (omits id, createdAt, updatedAt, all optional)
const UpdateUserSchema = updateInputSchema(UserSchema);
```

### Common Field Schemas

```typescript
import {
  EmailSchema,
  UuidSchema,
  UrlSchema,
  PhoneSchema,
  SlugSchema,
  DateStringSchema,
  PositiveIntSchema
} from "@repo/openapi";

const UserSchema = z.object({
  id: PositiveIntSchema,
  email: EmailSchema,
  phone: PhoneSchema.optional(),
  website: UrlSchema.optional(),
  slug: SlugSchema
});
```

### Query Schemas

```typescript
import {
  ListQuerySchema,
  DateRangeQuerySchema,
  CursorPaginationQuerySchema
} from "@repo/openapi";

// Pagination + sorting + search
app.openapi(getUsersRoute, async (c) => {
  const query = c.req.valid("query"); // ListQuerySchema
  // query = { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc", q: "search" }
});

// Date range filtering
app.openapi(getOrdersRoute, async (c) => {
  const query = c.req.valid("query"); // DateRangeQuerySchema
  // query = { startDate: "2024-01-01", endDate: "2024-12-31" }
});
```

## Best Practices

### 1. Keep Repositories Focused
- Only database operations in repositories
- No business logic
- No HTTP/request handling

### 2. Services Handle Business Logic
- Validate business rules
- Throw domain errors
- Coordinate multiple repositories
- Use transactions when needed

### 3. Routes Are Thin
- Request validation (automatic with zod-openapi)
- Call service methods
- Transform responses with DTOs
- Handle errors

### 4. Always Use DTOs
- Never expose raw database models
- Exclude sensitive fields
- Serialize dates and special types
- Transform based on context (public vs. internal)

### 5. Use Typed Errors
- Throw specific error types
- Include context data
- Let error handler convert to HTTP responses

### 6. Type Safety
- Use `Database` type (not `NeonHttpDatabase`)
- Use `Transaction` type for transaction callbacks
- Export and use inferred types from schemas

### 7. Testing
- Test repositories with real database (Workers pool)
- Test services with mocked repositories
- Test routes with mocked services
- Use `@repo/testing` utilities

## Migration Guide

### From Old Pattern (Direct DB in Services)
```typescript
// OLD
export class UserService {
  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }
}
```

### To New Pattern (Repository)
```typescript
// NEW - Repository
export class UserRepository extends BaseRepository<User> {
  constructor(db: Database) {
    super(db, users);
  }

  protected getIdColumn(): SQL {
    return users.id as unknown as SQL;
  }
}

// NEW - Service
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async findById(id: number): Promise<User | null> {
    return this.repo.findById(id);
  }

  async findByIdOrThrow(id: number): Promise<User> {
    return this.repo.findByIdOrThrow(id, "User");
  }
}

// NEW - Service Factory
export function createServices(db: Database) {
  const userRepository = new UserRepository(db);
  return {
    user: new UserService(userRepository),
  };
}
```

## Summary

The repository pattern provides:
- ✅ Clear separation of concerns
- ✅ Reusable CRUD operations via BaseRepository
- ✅ Type-safe transactions
- ✅ Consistent error handling
- ✅ Easy testing with mocked repositories
- ✅ Reduced code duplication
- ✅ Better maintainability

All new workers generated with `just new-worker` or `pnpm turbo gen worker` will use this pattern automatically.
