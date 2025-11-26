---
name: worker-scaffolding
description: Intelligent scaffolding for new Cloudflare Workers with optimal architecture, dependencies, and configuration. Analyzes existing patterns and generates Workers following monorepo best practices.
---

# Worker Scaffolding

This skill enhances the creation of new Cloudflare Workers by analyzing existing patterns and generating optimal configurations based on project requirements.

## When to Use

This skill is automatically invoked when:
- Creating new workers with `just new-worker`
- Setting up Worker configurations
- Planning Worker architecture
- Configuring bindings and dependencies

## Capabilities

### Intelligent Analysis
- Analyzes existing workers for common patterns and architectures
- Identifies optimal shared package combinations based on requirements
- Suggests appropriate Cloudflare bindings (Hyperdrive, KV, R2, etc.)
- Recommends middleware stack from `@cf-monorepo/middleware`

### Configuration Generation
- Auto-configures `wrangler.jsonc` with appropriate settings
- Generates TypeScript interfaces matching selected bindings
- Creates optimal `package.json` with minimal dependencies
- Sets up proper development environment files

### Architecture Guidance
- Suggests framework choice (basic Workers vs Hono)
- Guides authentication integration with Better Auth
- Recommends database patterns with Drizzle ORM
- Advises on performance optimization strategies

## Example Usage

### Interactive Scaffolding
When you run `just new-worker`, this skill enhances the process by:

1. Analyzing your existing workers to identify patterns
2. Suggesting optimal dependency combinations
3. Auto-configuring bindings based on selected features
4. Generating type-safe interfaces and examples

### Architecture Decisions
For each new worker, the skill guides:

**Framework Selection**
- Basic Workers API for simple endpoints
- Hono framework for full-featured applications
- Hybrid approaches for specific use cases

**Feature Integration** 
- Authentication setup with Better Auth
- Database integration with Drizzle ORM
- Caching strategies with KV storage
- File handling with R2 buckets

### Configuration Templates

**Basic API Worker**
```typescript
interface Env {
  // Minimal environment for simple APIs
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Implementation
  },
};
```

**Full-Stack Hono Worker**
```typescript
import { Hono } from 'hono';
import type { Env } from '@cf-monorepo/types';
import { createDb } from '@cf-monorepo/db';
// Additional imports based on features
```

## Integration

Enhances existing scaffolding commands:
- `just new-worker` - AI-enhanced worker creation
- `just new-package` - Smart package scaffolding
- `pnpm turbo gen worker` - Turborepo generator integration

## Best Practices

The skill enforces monorepo best practices:
- Proper workspace dependency usage (`workspace:*`)
- Consistent TypeScript configuration
- Optimal bundle size considerations
- Security and performance patterns
- Testing setup with Vitest Workers pool

## Generated Structure

Each scaffolded worker includes:
- Optimized `wrangler.jsonc` configuration
- Type-safe environment interfaces  
- Proper middleware setup
- Test file templates
- Documentation and examples
- Development environment configuration