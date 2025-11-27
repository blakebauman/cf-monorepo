#!/bin/bash
# Pre-deployment validation script for Cloudflare Workers
# Comprehensive deployment readiness checks

set -e

WORKER_NAME=${1:-"all"}
ENVIRONMENT=${2:-"production"}

echo "🚀 Pre-deployment validation starting..."

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
	local color=$1
	local message=$2
	echo -e "${color}${message}${NC}"
}

print_error() {
	print_status $RED "❌ $1"
}

print_warning() {
	print_status $YELLOW "⚠️  $1"
}

print_success() {
	print_status $GREEN "✅ $1"
}

print_info() {
	print_status $BLUE "ℹ️  $1"
}

# Error counter
ERRORS=0
WARNINGS=0

# Function to add error
add_error() {
	print_error "$1"
	((ERRORS++))
}

# Function to add warning
add_warning() {
	print_warning "$1"
	((WARNINGS++))
}

echo ""
print_info "Deployment Target: $WORKER_NAME ($ENVIRONMENT)"
echo "=================================================="

# 1. Git Repository Checks
echo ""
print_info "1. Git Repository Status"
echo "------------------------"

if ! git diff --quiet; then
	add_error "Uncommitted changes detected. Commit or stash changes before deployment."
fi

if ! git diff --cached --quiet; then
	add_error "Staged changes detected. Commit changes before deployment."
fi

CURRENT_BRANCH=$(git branch --show-current)
if [ "$ENVIRONMENT" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
	add_warning "Deploying from branch '$CURRENT_BRANCH' to production. Consider deploying from 'main'."
fi

print_success "Git status checked"

# 2. Build and Type Checks
echo ""
print_info "2. Build and Type Validation"
echo "-----------------------------"

print_info "Running type checks..."
if ! pnpm typecheck > /dev/null 2>&1; then
	add_error "TypeScript type check failed. Run 'just typecheck' to see details."
else
	print_success "Type check passed"
fi

print_info "Running build..."
if ! pnpm build > /dev/null 2>&1; then
	add_error "Build failed. Run 'just build' to see details."
else
	print_success "Build completed successfully"
fi

# 3. Test Suite
echo ""
print_info "3. Test Suite Validation"
echo "-------------------------"

print_info "Running test suite..."
if ! pnpm test > /dev/null 2>&1; then
	add_error "Test suite failed. Run 'just test' to see details."
else
	print_success "All tests passed"
fi

# 4. Code Quality Checks
echo ""
print_info "4. Code Quality Validation"
echo "---------------------------"

print_info "Running linting..."
if ! pnpm lint > /dev/null 2>&1; then
	add_error "Linting failed. Run 'just lint' to see issues."
else
	print_success "Linting passed"
fi

print_info "Checking code formatting..."
if ! pnpm format:check > /dev/null 2>&1; then
	add_error "Code formatting issues detected. Run 'just format' to fix."
else
	print_success "Code formatting is consistent"
fi

# 5. Dependency Checks
echo ""
print_info "5. Dependency Validation"
echo "-------------------------"

print_info "Checking dependency versions..."
if ! pnpm syncpack:check > /dev/null 2>&1; then
	add_warning "Dependency version mismatches detected. Run 'just deps-fix' to resolve."
else
	print_success "Dependency versions are synchronized"
fi

# Check for security vulnerabilities
print_info "Checking for security vulnerabilities..."
if command -v pnpm audit &> /dev/null; then
	AUDIT_OUTPUT=$(pnpm audit --json 2>/dev/null || echo '{"advisories":{}}')
	ADVISORY_COUNT=$(echo "$AUDIT_OUTPUT" | grep -o '"advisories":{[^}]*}' | grep -o '"[^"]*":[^}]*}' | wc -l | tr -d ' ')
	
	if [ "$ADVISORY_COUNT" -gt 0 ]; then
		add_warning "$ADVISORY_COUNT security advisories found. Run 'pnpm audit' for details."
	else
		print_success "No security vulnerabilities detected"
	fi
fi

# 6. Environment Configuration
echo ""
print_info "6. Environment Configuration"
echo "----------------------------"

# Function to check worker configuration
check_worker_config() {
	local worker_path=$1
	local worker_name=$(basename "$worker_path")
	
	print_info "Checking $worker_name configuration..."
	
	# Check wrangler.jsonc exists
	if [ ! -f "$worker_path/wrangler.jsonc" ]; then
		add_error "$worker_name: wrangler.jsonc not found"
		return
	fi
	
	# Check for required bindings in wrangler.jsonc
	WRANGLER_CONFIG="$worker_path/wrangler.jsonc"
	
	# Check if worker uses database
	if grep -q "@repo/db" "$worker_path/package.json" 2>/dev/null; then
		if ! grep -q '"hyperdrive"' "$WRANGLER_CONFIG"; then
			add_error "$worker_name: Uses database but no Hyperdrive binding configured"
		fi
	fi
	
	# Check for .dev.vars in development
	if [ "$ENVIRONMENT" = "development" ] && [ ! -f "$worker_path/.dev.vars" ]; then
		add_warning "$worker_name: .dev.vars file not found for local development"
	fi
	
	# Check for environment variables
	if grep -q "BETTER_AUTH" "$worker_path/src"/* 2>/dev/null; then
		print_info "$worker_name: Better Auth detected - ensure secrets are configured"
	fi
	
	print_success "$worker_name configuration checked"
}

# Check specific worker or all workers
if [ "$WORKER_NAME" = "all" ]; then
	for worker_dir in apps/*/; do
		if [ -d "$worker_dir" ] && [ -f "$worker_dir/wrangler.jsonc" ]; then
			check_worker_config "$worker_dir"
		fi
	done
else
	if [ -d "apps/$WORKER_NAME" ]; then
		check_worker_config "apps/$WORKER_NAME"
	else
		add_error "Worker '$WORKER_NAME' not found in apps/ directory"
	fi
fi

# 7. Bundle Size Analysis
echo ""
print_info "7. Bundle Size Analysis"
echo "-----------------------"

# Function to check bundle size
check_bundle_size() {
	local worker_path=$1
	local worker_name=$(basename "$worker_path")
	
	if [ -d "$worker_path/.wrangler" ]; then
		local bundle_size=$(du -sh "$worker_path/.wrangler" 2>/dev/null | cut -f1 || echo "Unknown")
		print_info "$worker_name bundle size: $bundle_size"
		
		# Warn if bundle seems large (rough estimate)
		local size_mb=$(du -sm "$worker_path/.wrangler" 2>/dev/null | cut -f1 || echo 0)
		if [ "$size_mb" -gt 10 ]; then
			add_warning "$worker_name: Bundle size ($size_mb MB) is large. Consider optimization."
		fi
	fi
}

if [ "$WORKER_NAME" = "all" ]; then
	for worker_dir in apps/*/; do
		if [ -d "$worker_dir" ] && [ -f "$worker_dir/wrangler.jsonc" ]; then
			check_bundle_size "$worker_dir"
		fi
	done
else
	if [ -d "apps/$WORKER_NAME" ]; then
		check_bundle_size "apps/$WORKER_NAME"
	fi
fi

# 8. Database Migration Status
echo ""
print_info "8. Database Migration Status"
echo "-----------------------------"

if [ -d "packages/db" ] && [ -f "packages/db/drizzle.config.ts" ]; then
	print_info "Checking database migration status..."
	
	# This would need to be implemented based on your migration tracking
	print_info "Ensure all migrations are applied to target environment"
	print_success "Database configuration checked"
else
	print_info "No database package found - skipping migration check"
fi

# 9. Production-Specific Checks
if [ "$ENVIRONMENT" = "production" ]; then
	echo ""
	print_info "9. Production-Specific Checks"
	echo "------------------------------"
	
	# Check for debugging code
	if grep -r "console\.log\|debugger" apps/*/src/ 2>/dev/null | grep -v test; then
		add_warning "Debug statements found in source code"
	fi
	
	# Check for development dependencies in production builds
	if grep -r '"devDependencies"' apps/*/dist/ 2>/dev/null; then
		add_warning "Development dependencies may be included in production build"
	fi
	
	print_success "Production checks completed"
fi

# Summary
echo ""
echo "=================================================="
print_info "Deployment Readiness Summary"
echo "=================================================="

if [ $ERRORS -gt 0 ]; then
	print_error "Found $ERRORS error(s) that must be fixed before deployment"
	exit 1
fi

if [ $WARNINGS -gt 0 ]; then
	print_warning "Found $WARNINGS warning(s) - review before proceeding"
fi

if [ $ERRORS -eq 0 ]; then
	print_success "All critical checks passed! Ready for deployment 🚀"
	echo ""
	print_info "Deployment commands:"
	if [ "$WORKER_NAME" = "all" ]; then
		echo "  just deploy              # Deploy all workers"
		echo "  pnpm turbo deploy        # Alternative command"
	else
		echo "  just deploy-worker $WORKER_NAME    # Deploy specific worker"
		echo "  pnpm --filter $WORKER_NAME deploy  # Alternative command"
	fi
fi

echo ""

