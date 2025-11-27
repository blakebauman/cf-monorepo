# @repo/testing

Comprehensive testing utilities, mocks, and fixtures for Cloudflare Workers testing.

## Installation

```json
{
  "dependencies": {
    "@repo/testing": "workspace:*"
  }
}
```

## Mocks

### Mock Environment

```typescript
import { createMockEnv } from "@repo/testing";

const env = createMockEnv({
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  ENVIRONMENT: "test",
});
```

### Mock Cloudflare Bindings

```typescript
import { createMockKV, createMockR2, createMockD1 } from "@repo/testing";

// KV Namespace
const kv = createMockKV();
await kv.put("key", "value");
const value = await kv.get("key");

// R2 Bucket
const r2 = createMockR2();
await r2.put("file.txt", new ArrayBuffer(100));
const file = await r2.get("file.txt");

// D1 Database
const d1 = createMockD1();
const result = await d1.prepare("SELECT * FROM users").all();
```

### Mock Request/Response

```typescript
import { createMockRequest, createMockResponse } from "@repo/testing";

const request = createMockRequest("http://localhost:8787/api/users", {
  method: "POST",
  body: JSON.stringify({ name: "John" }),
});

const response = createMockResponse(JSON.stringify({ success: true }), {
  status: 200,
});
```

### Mock Fetch

```typescript
import { createMockFetch } from "@repo/testing";

const mockFetch = createMockFetch((input) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("/api/users")) {
    return createMockResponse(JSON.stringify({ users: [] }));
  }
  return createMockResponse(JSON.stringify({ error: "Not found" }), { status: 404 });
});

global.fetch = mockFetch;
```

## Helpers

### Validate Responses

```typescript
import { validateApiResponse, validateResponse } from "@repo/testing";

// Validate HTTP response
validateResponse(response, 200);

// Validate API response format
const data = await validateApiResponse(response, true);
expect(data.success).toBe(true);
expect(data.data).toBeDefined();
```

### Test Rate Limiting

```typescript
import { testRateLimit } from "@repo/testing";

await testRateLimit(
  () => app.request("/api/endpoint"),
  10, // limit
  60  // window in seconds
);
```

### Test CORS Headers

```typescript
import { testCorsHeaders, testSecurityHeaders } from "@repo/testing";

testCorsHeaders(response, "https://example.com");
testSecurityHeaders(response);
```

## Fixtures

### Pre-defined Test Data

```typescript
import { userFixtures, dbFixtures, envFixtures } from "@repo/testing";

// User fixtures
const user = userFixtures.validUser;
const admin = userFixtures.adminUser;

// Database fixtures
const users = dbFixtures.users;
const sessions = dbFixtures.sessions;

// Environment fixtures
const devEnv = envFixtures.development;
const prodEnv = envFixtures.production;
```

### Random Fixtures

```typescript
import { createRandomFixture, createRandomFixtures } from "@repo/testing";

// Single random user
const user = createRandomFixture("user");

// Multiple random users
const users = createRandomFixtures("user", 10);
```

## Example Test

```typescript
import { describe, expect, it } from "vitest";
import { createMockEnv, createMockRequest, validateApiResponse } from "@repo/testing";

describe("User API", () => {
  it("should return users", async () => {
    const env = createMockEnv();
    const request = createMockRequest("http://localhost/api/users");

    const response = await app.request(request, env);

    expect(response.status).toBe(200);
    const data = await validateApiResponse(response, true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## Available Utilities

- **Mocks:** Env, KV, R2, D1, Hyperdrive, Request, Response, Fetch, Timers
- **Helpers:** Response validation, rate limit testing, CORS testing, performance measurement
- **Fixtures:** Users, sessions, requests, responses, environments, performance data

## License

MIT
