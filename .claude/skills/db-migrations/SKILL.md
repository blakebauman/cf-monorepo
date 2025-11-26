---
name: db-migrations
description: Intelligent database migration management for Drizzle ORM with Better Auth integration in Cloudflare Workers environment. Analyzes schema changes, validates migrations, and guides production deployment strategies.
---

# Database Migration Management

This skill provides intelligent assistance for database operations in the Cloudflare Workers monorepo, specifically focusing on Drizzle ORM with Better Auth integration.

## When to Use

This skill is automatically invoked when:
- Working with database schema files
- Generating or applying migrations  
- Setting up Better Auth
- Planning database deployments

## Capabilities

### Schema Analysis
- Detects breaking changes in database schema modifications
- Validates Better Auth compatibility with custom schema
- Suggests optimal indexes for new columns and relationships
- Identifies potential performance impacts

### Migration Intelligence
- Generates safe migration strategies for production environments
- Provides rollback plans for complex schema changes
- Validates migration order and dependencies
- Ensures Neon Postgres and Hyperdrive compatibility

### Best Practices Enforcement
- Enforces naming conventions for tables and columns
- Suggests appropriate data types for Cloudflare Workers constraints
- Validates foreign key relationships and constraints
- Ensures proper timezone handling for timestamps

## Example Usage

### Schema Modification
When you modify schema files in `packages/db/src/schema/`, this skill will:

1. Analyze the changes for breaking modifications
2. Suggest appropriate migration strategies
3. Validate Better Auth table compatibility
4. Recommend indexes for performance

### Migration Generation
When running `just db-generate`, this skill provides:

1. Review of generated SQL for safety
2. Suggestions for multi-step migrations when needed
3. Validation against production constraints
4. Documentation of migration purpose and impact

### Production Deployment
For production migrations, this skill offers:

1. Zero-downtime deployment strategies
2. Backup and rollback procedures  
3. Connection pooling considerations for Hyperdrive
4. Monitoring and validation steps

## Integration

Works seamlessly with existing commands:
- `just db-generate` - Enhanced migration generation
- `just db-migrate` - Guided migration application
- `just db-setup` - Comprehensive setup validation
- `just auth-schema` - Better Auth integration

## Error Recovery

Provides guidance for common migration issues:
- Failed migrations and partial application
- Schema drift between environments
- Better Auth table conflicts
- Connection timeout with large migrations