# Changesets

This directory contains changesets - markdown files that describe the changes you've made to the packages in this monorepo.

## How to use

### Creating a changeset

When you make a change that should be documented, run:

```bash
just changeset
# or
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the type of change (major, minor, patch)
3. Write a summary of the changes

### Versioning

When ready to release, run:

```bash
just version
# or
pnpm version
```

This will:
- Consume all changesets
- Update package versions
- Update CHANGELOG.md files

### Publishing (if applicable)

For public packages, run:

```bash
just publish
# or
pnpm release
```

## Change types

- **major**: Breaking changes
- **minor**: New features (backwards compatible)
- **patch**: Bug fixes (backwards compatible)

## More information

See [changesets documentation](https://github.com/changesets/changesets) for more details.

