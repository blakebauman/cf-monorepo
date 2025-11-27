# Changesets

This directory contains [Changesets](https://github.com/changesets/changesets) for managing versioning and changelogs in this monorepo.

## Creating a Changeset

When you make changes that should be versioned, create a changeset:

```bash
pnpm changeset
# or
just changeset
```

This will:
1. Prompt you to select which packages changed
2. Ask for the type of change (patch, minor, major)
3. Request a description of the changes

## Changeset Types

- **patch**: Bug fixes, small updates (1.0.0 → 1.0.1)
- **minor**: New features, non-breaking changes (1.0.0 → 1.1.0)
- **major**: Breaking changes (1.0.0 → 2.0.0)

## Release Process

1. Create changesets as you make changes
2. Commit changesets with your code changes
3. When ready to release, merge to `main` branch
4. GitHub Actions will automatically create a release PR
5. Review and merge the release PR to publish versions

## Manual Release

If you need to manually create a release:

```bash
# Version packages based on changesets
pnpm changeset version
# or
just version

# Publish packages (if configured)
pnpm changeset publish
# or
just publish
```

## Best Practices

- Create a changeset for every user-facing change
- Be descriptive in your changeset messages
- Group related changes in a single changeset when possible
- Don't create changesets for internal-only changes (unless versioning is needed)
