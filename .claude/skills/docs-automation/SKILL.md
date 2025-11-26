---
name: docs-automation
description: Automated documentation generation for Cloudflare Workers monorepo. Creates API documentation from OpenAPI specs, generates package READMEs, and maintains architecture documentation with intelligent content generation.
---

# Documentation Automation

This skill provides intelligent documentation generation and maintenance for the Cloudflare Workers monorepo, ensuring comprehensive and up-to-date documentation across all components.

## When to Use

This skill is automatically invoked when:
- Creating new workers or packages
- Updating API endpoints or schemas
- Modifying shared packages
- Planning deployment documentation
- Generating architectural documentation

## Capabilities

### API Documentation Generation
- Auto-generates API documentation from OpenAPI specifications
- Creates interactive documentation with Swagger/Redoc
- Generates client SDK documentation
- Maintains API versioning documentation
- Creates endpoint usage examples

### Package Documentation
- Auto-generates README files for new packages
- Maintains consistent documentation structure
- Creates usage examples and API references
- Documents package dependencies and relationships
- Generates changelog entries

### Architecture Documentation
- Creates system architecture diagrams
- Documents service interactions and data flows
- Maintains decision records (ADRs)
- Generates deployment guides
- Creates troubleshooting documentation

## Documentation Templates

### Worker README Template
```markdown
# {Worker Name}

{Description based on package.json and code analysis}

## Features

{Auto-detected from code analysis}
- API endpoints and functionality
- Authentication integration
- Database operations
- External service integrations

## Environment Variables

{Auto-detected from code}
| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | Database connection string | Yes |
| BETTER_AUTH_SECRET | Authentication secret | Yes |

## API Endpoints

{Generated from Hono routes or OpenAPI specs}

## Development

\`\`\`bash
# Start development server
just dev-worker {worker-name}

# Run tests
pnpm test

# Deploy
just deploy-worker {worker-name}
\`\`\`
```

### Package README Template
```markdown
# @cf-monorepo/{package-name}

{Description and purpose}

## Installation

\`\`\`bash
pnpm add @cf-monorepo/{package-name}
\`\`\`

## Usage

{Auto-generated examples from exports and types}

## API Reference

{Generated from TypeScript definitions}
```

## OpenAPI Documentation

### Automatic Generation
```typescript
// Detects OpenAPI schemas in code
import { OpenAPIHono } from '@hono/zod-openapi';

// Auto-generates documentation for routes
app.openapi(createUserRoute, async (c) => {
  // Implementation details become examples
});
```

### Interactive Documentation
- Swagger UI integration with custom styling
- Redoc integration for detailed documentation
- Code examples in multiple programming languages
- Try-it-out functionality with authentication
- Download options for OpenAPI specs

### Documentation Deployment
- Automated deployment to Cloudflare Pages
- Version-specific documentation hosting
- Search functionality across documentation
- Mobile-responsive documentation design
- SEO optimization for documentation

## Architecture Documentation

### System Diagrams
```mermaid
# Auto-generated architecture diagrams
graph TD
    A[Client] --> B[Cloudflare Workers]
    B --> C[Hyperdrive]
    C --> D[Neon Postgres]
    B --> E[KV Storage]
    B --> F[R2 Bucket]
```

### Data Flow Documentation
- Request/response flow diagrams
- Database interaction patterns
- Authentication flow documentation
- Error handling flow charts
- Performance optimization guides

### Decision Records
```markdown
# ADR-001: Database Choice - Neon Postgres

## Status
Accepted

## Context
{Auto-generated context based on code analysis}

## Decision
{Extracted from implementation patterns}

## Consequences
{Analyzed from code structure and patterns}
```

## Code Examples Generation

### Automatic Example Creation
```typescript
// Analyzes function signatures to create examples
export const createUser = async (data: CreateUserData): Promise<User> => {
  // Function implementation
};

// Generated example:
/*
const newUser = await createUser({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
});
*/
```

### Integration Examples
- Complete workflow examples
- Error handling examples
- Performance optimization examples
- Security implementation examples
- Testing pattern examples

## Documentation Maintenance

### Automated Updates
- Documentation syncing with code changes
- Outdated documentation detection
- Link validation and maintenance
- Version compatibility documentation
- Breaking change documentation

### Quality Assurance
- Documentation completeness checking
- Writing style consistency
- Technical accuracy validation
- Example code testing
- Link and reference validation

## Integration Workflows

### CI/CD Integration
```yaml
# Documentation generation in CI
- name: Generate Documentation
  run: |
    pnpm docs:generate
    pnpm docs:validate
    pnpm docs:deploy
```

### Development Workflow
1. **Code Analysis**: Scan for new functions, endpoints, types
2. **Documentation Generation**: Create/update relevant documentation
3. **Validation**: Ensure documentation accuracy and completeness
4. **Integration**: Update navigation and cross-references
5. **Deployment**: Publish to documentation site

### Git Integration
- Automatic documentation commits
- Documentation pull request creation
- Review process for documentation changes
- Documentation change tracking
- Version tagging for documentation

## Documentation Standards

### Writing Guidelines
- Clear and concise language
- Consistent terminology usage
- Comprehensive but focused content
- Practical examples and use cases
- Accessibility considerations

### Structure Standards
- Consistent heading hierarchy
- Standard section organization
- Cross-referencing patterns
- Code example formatting
- Image and diagram standards

### Technical Standards
- Markdown formatting consistency
- Code syntax highlighting
- Link formatting and validation
- Metadata and frontmatter standards
- Search optimization

## Specialized Documentation

### Security Documentation
- Security implementation guides
- Vulnerability disclosure procedures
- Security best practices
- Compliance documentation
- Incident response procedures

### Performance Documentation
- Performance optimization guides
- Benchmarking results
- Monitoring and alerting setup
- Troubleshooting guides
- Capacity planning documentation

### Migration Guides
- Version upgrade procedures
- Breaking change documentation
- Migration scripts and tools
- Rollback procedures
- Testing migration procedures

## Documentation Analytics

### Usage Tracking
- Documentation page view analytics
- Search query analysis
- User journey tracking
- Content effectiveness metrics
- Feedback collection and analysis

### Content Optimization
- Popular content identification
- Gap analysis for missing documentation
- Content freshness monitoring
- User satisfaction tracking
- Continuous improvement suggestions