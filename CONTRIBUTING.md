# Contributing

Thank you for your interest in contributing to this project!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Git hooks are installed automatically via Lefthook

## Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting. Before committing:

```bash
# Check for issues
pnpm check

# Fix auto-fixable issues
pnpm check:fix
```

The pre-commit hook will automatically run Biome on staged files.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). The commit-msg hook enforces this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```
feat(auth): add OAuth2 support for Google
fix(db): resolve connection pooling issue on high load
docs: update README with new installation steps
refactor(utils): simplify error handling logic
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass: `pnpm check && pnpm type-check && pnpm build`
4. Submit a pull request

## Testing

Run type checks before submitting:

```bash
pnpm type-check
```

## Questions?

Feel free to open an issue for any questions or concerns.

