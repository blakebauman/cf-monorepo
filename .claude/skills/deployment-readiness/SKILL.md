---
name: deployment-readiness
description: Comprehensive deployment validation for Cloudflare Workers, ensuring production readiness through automated checks of code quality, configuration, security, and environment setup.
---

# Deployment Readiness

This skill provides comprehensive validation before deploying Cloudflare Workers to production, ensuring all aspects of the deployment are verified and optimized.

## When to Use

This skill is automatically invoked when:
- Planning deployments with `just deploy`
- Using deployment-related commands
- Preparing for production releases
- Validating environment configurations

## Capabilities

### Pre-Deployment Validation
- Git repository status and branch validation
- Build and TypeScript compilation verification
- Test suite execution and validation
- Code quality checks with Biome
- Dependency synchronization verification

### Environment Configuration
- Cloudflare binding validation (Hyperdrive, KV, R2, etc.)
- Environment variable completeness check
- Secret configuration verification
- Production vs development environment validation

### Security Assessment
- Hardcoded secret detection
- Security header configuration validation
- CORS policy verification
- Input validation pattern checks
- Authentication configuration review

### Performance Analysis
- Bundle size analysis and optimization suggestions
- Workers runtime constraint validation
- Memory usage estimation
- CPU time optimization recommendations
- Connection pooling configuration review

## Validation Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Test suite passes completely
- [ ] Biome linting and formatting compliance
- [ ] No debugging code in production build
- [ ] Security vulnerabilities addressed

### Configuration
- [ ] Wrangler.jsonc properly configured
- [ ] All required bindings defined
- [ ] Environment variables set
- [ ] Secrets configured in Cloudflare
- [ ] Compatibility flags appropriate

### Database & Storage
- [ ] Database migrations applied
- [ ] Hyperdrive configuration validated
- [ ] KV namespace permissions set
- [ ] R2 bucket policies configured
- [ ] Connection limits appropriate

### Monitoring & Observability
- [ ] Error handling implemented
- [ ] Structured logging configured
- [ ] Health check endpoints available
- [ ] Performance monitoring setup
- [ ] Alerting configured

## Example Usage

### Single Worker Deployment
```bash
# Validates specific worker before deployment
just deploy-worker my-api
# Comprehensive checks run automatically
```

### Full Monorepo Deployment
```bash
# Validates all workers and dependencies
just deploy
# Multi-worker coordination and validation
```

### Environment-Specific Validation
The skill adapts checks based on target environment:

**Development**
- Local configuration validation
- `.dev.vars` file completeness
- Development binding setup

**Staging** 
- Staging environment parity
- Integration test validation
- Performance baseline checks

**Production**
- Zero-downtime deployment strategy
- Backup and rollback procedures
- Security hardening validation
- Performance optimization verification

## Integration

Works with existing deployment workflows:
- Cloudflare Workers Builds integration
- GitHub Actions workflow validation
- Manual deployment command enhancement
- CI/CD pipeline integration

## Error Recovery

Provides guidance for common deployment issues:
- Failed deployment rollback strategies
- Configuration mismatch resolution
- Binding connectivity problems
- Performance regression handling
- Security issue remediation

## Reporting

Generates comprehensive reports including:
- Deployment readiness score
- Critical issues requiring attention
- Performance optimization recommendations
- Security enhancement suggestions
- Post-deployment validation steps