# Security Policy

## Supported Versions

We actively support security updates for the latest version of this monorepo template.

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: Send details to the repository maintainers
2. **Private Security Advisory**: Use GitHub's private security advisory feature if available

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

We aim to respond to security reports within 48 hours and provide an initial assessment within 7 days.

## Security Best Practices

This monorepo follows security best practices:

- **No secrets in code**: All secrets are managed via environment variables or Cloudflare secrets
- **Dependency scanning**: Regular security audits via `pnpm audit`
- **Input validation**: All user inputs are validated using Zod schemas
- **SQL injection prevention**: Using Drizzle ORM with parameterized queries
- **Security headers**: Middleware includes security headers (CSP, HSTS, etc.)
- **Rate limiting**: Built-in rate limiting middleware for API protection

## Security Updates

Security updates are released as patches and should be applied promptly. We recommend:

- Regularly running `pnpm audit` to check for vulnerabilities
- Keeping dependencies up to date
- Reviewing security advisories from dependencies

