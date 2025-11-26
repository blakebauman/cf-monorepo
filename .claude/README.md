# Claude Code Development Workflow

This directory contains a comprehensive Claude Code configuration for enhanced development workflows in the Cloudflare Workers monorepo.

## Overview

The workflow includes:
- **5 Sub-agents** for specialized development assistance
- **4 Skills** for common development tasks  
- **4 Hooks** for automated quality checks and notifications

## Sub-Agents

### `dev-assistant`
General development assistant for Cloudflare Workers patterns.
- Context-aware development guidance
- Architecture decision support
- Auto-import suggestions for shared packages

### `security-auditor`
Comprehensive security specialist for Workers applications.
- Security vulnerability detection
- Configuration security validation
- Authentication/authorization review
- Compliance and standards guidance

### `perf-optimizer`
Performance optimization specialist for edge computing.
- Bundle size analysis and optimization
- Database query performance review
- Workers runtime constraint guidance
- Memory and CPU optimization strategies

### `test-strategist`
Comprehensive testing strategist for distributed systems.
- Test plan design for edge computing
- Testing pattern implementation
- CI/CD testing integration
- Quality assurance strategies

### `api-designer`
API design specialist for RESTful Workers APIs.
- OpenAPI specification creation
- Consistent error handling patterns
- API versioning strategies
- Documentation and client SDK guidance

## Skills

### `db-migrations`
Database migration management with Drizzle ORM and Better Auth integration.
- Schema analysis and migration generation
- Breaking change detection
- Production deployment guidance

### `worker-scaffolding`  
Intelligent scaffolding for new Cloudflare Workers.
- Architecture pattern recognition
- Optimal dependency selection
- Configuration generation

### `deployment-readiness`
Comprehensive deployment validation for production readiness.
- Pre-deployment checks and validation
- Environment configuration verification
- Security and performance assessment

### `docs-automation`
Automated documentation generation and maintenance.
- API documentation from OpenAPI specs
- Package README generation
- Architecture documentation creation

## Hooks

### Quality Gate (`quality-gate`)
**Trigger:** Before code modifications (Edit/Write/MultiEdit tools)
- Security pattern validation
- Workers optimization checks
- Debug statement detection

### Bash Safety (`bash-safety`)
**Trigger:** Before bash command execution
- Destructive command warnings
- Command execution logging

### Deployment Check (`deployment-check`)
**Trigger:** When user mentions "deploy", "release", or "production"
- Comprehensive pre-deployment validation
- Environment and configuration checks
- Security and performance assessment

### Activity Log (`activity-log`)
**Trigger:** After tool usage
- Development activity logging
- Audit trail maintenance
- Categorized event handling

## Configuration

The workflow is configured via `.claude/config.json` with hooks mapped to specific tool usage patterns.

## Integration with Existing Tools

The Claude Code workflow integrates seamlessly with existing monorepo tools:

### Just Commands
```bash
# Enhanced with Claude Code assistance
just new-worker           # Now includes AI scaffolding
just dev                  # With intelligent development assistance  
just deploy               # With pre-deployment validation
just db-generate          # With migration intelligence
```

### Development Process
1. **Code Creation**: Sub-agents provide context-aware assistance
2. **Quality Checks**: Hooks validate code before modifications
3. **Database Changes**: Skills guide migration best practices
4. **Deployment**: Comprehensive readiness validation

### Existing Tooling
- **Turborepo**: Works alongside generators and caching
- **Biome**: Complements linting with architectural guidance
- **Lefthook**: Pre-commit hooks work with Claude Code quality gates
- **Vitest**: Test guidance integrated with deployment checks

## Getting Started

The workflow is automatically active when using Claude Code in this repository. The configuration provides:

1. **Immediate value** - Quality checks and guidance without setup
2. **Progressive enhancement** - Deeper assistance as you use Claude Code more
3. **Non-intrusive** - Works alongside existing development practices

## Customization

You can extend the workflow by:

1. **Adding Skills**: Create new `.md` files in `.claude/skills/`
2. **Configuring Hooks**: Modify `.claude/config.json` for different triggers
3. **Sub-agent Specialization**: Enhance agent capabilities in `.claude/agents/`

## Best Practices

- Skills and sub-agents automatically activate based on context
- Hooks provide real-time feedback without blocking development
- All components are designed to enhance, not replace, existing workflows
- Documentation and examples are included in each component