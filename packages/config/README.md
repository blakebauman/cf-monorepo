# @repo/config

Environment-aware configuration utilities for Cloudflare Workers.

## Installation

```json
{
  "dependencies": {
    "@repo/config": "workspace:*"
  }
}
```

## Usage

### Get Environment

```typescript
import { getEnvironment } from "@repo/config";
import type { Env } from "@repo/types";

export default {
  async fetch(request: Request, env: Env) {
    const environment = getEnvironment(env);

    if (environment === "production") {
      // Production-specific logic
    }

    return Response.json({ environment });
  },
};
```

### Environment Detection

```typescript
import { getEnvironment } from "@repo/config";

const env = getEnvironment(c.env);

switch (env) {
  case "development":
    // Enable debug features
    break;
  case "production":
    // Strict security
    break;
  case "test":
    // Test mocks
    break;
}
```

## API

### `getEnvironment(env: Partial<Env>): Environment`

Returns the current environment:
- Checks `env.ENVIRONMENT` variable
- Defaults to `"development"`
- Returns typed `Environment` value

```typescript
const environment = getEnvironment(c.env);
// Returns: "development" | "production" | "test"
```

## Best Practices

### Use Environment for Feature Flags

```typescript
import { getEnvironment } from "@repo/config";

app.use("*", (c, next) => {
  const env = getEnvironment(c.env);

  // Enable verbose logging in development
  if (env === "development") {
    c.set("verboseLogging", true);
  }

  return next();
});
```

### Environment-Specific CORS

```typescript
import { getEnvironment } from "@repo/config";
import { enhancedCors } from "@repo/middleware";

const environment = getEnvironment(env);

app.use("*", enhancedCors({ environment }));
// Development: allows all origins
// Production: restricts origins
```

## License

MIT
