# Cloudflare Workers Monorepo - Task Runner
# Run `just` to see all available commands

# Default recipe - show help
default:
    @just --list

# ============================================
# Installation & Setup
# ============================================

# Install all dependencies
install:
    pnpm install

# Clean all build artifacts and node_modules
clean:
    pnpm clean
    rm -rf node_modules .turbo

# Full clean and reinstall
reinstall: clean install

# ============================================
# Development
# ============================================

# Start development server for all workers
dev:
    pnpm dev

# Start development for a specific worker
dev-worker name:
    pnpm --filter {{name}} dev

# ============================================
# Code Quality
# ============================================

# Run all checks (lint, format, types)
check:
    pnpm check
    pnpm type-check

# Fix all auto-fixable issues
fix:
    pnpm check:fix

# Run linter only
lint:
    pnpm lint

# Fix lint issues
lint-fix:
    pnpm lint:fix

# Check formatting
format-check:
    pnpm format:check

# Format all files
format:
    pnpm format

# Type check all packages
typecheck:
    pnpm type-check

# Check dependency versions with syncpack
deps-check:
    pnpm syncpack:check

# Fix dependency version mismatches
deps-fix:
    pnpm syncpack

# ============================================
# Build & Deploy
# ============================================

# Build all packages
build:
    pnpm build

# Deploy all workers
deploy:
    pnpm turbo deploy

# Deploy a specific worker
deploy-worker name:
    pnpm --filter {{name}} deploy

# ============================================
# Database
# ============================================

# Generate database migrations
db-generate:
    pnpm db:generate

# Run database migrations
db-migrate:
    pnpm db:migrate

# Open Drizzle Studio
db-studio:
    pnpm db:studio

# Full database setup (schema + migrations)
db-setup:
    pnpm db:setup

# Generate Better Auth schema
auth-schema:
    pnpm auth:generate-schema

# ============================================
# Testing
# ============================================

# Run all tests
test:
    pnpm test

# Run tests in watch mode
test-watch:
    pnpm test:watch

# Run tests with coverage
test-coverage:
    pnpm test:coverage

# ============================================
# Generators
# ============================================

# Create a new worker
new-worker:
    pnpm turbo gen worker

# Create a new shared package
new-package:
    pnpm turbo gen package

# ============================================
# Versioning
# ============================================

# Create a new changeset
changeset:
    pnpm changeset

# Version packages based on changesets
version:
    pnpm changeset version

# Publish packages
publish:
    pnpm changeset publish

# ============================================
# Utilities
# ============================================

# Show outdated dependencies
outdated:
    pnpm outdated -r

# Update all dependencies interactively
update-deps:
    pnpm update -r -i

# List all workspace packages
packages:
    pnpm ls -r --depth -1

# Show Turborepo task graph
graph:
    pnpm turbo run build --graph

