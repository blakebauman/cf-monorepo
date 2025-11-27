#!/bin/bash
# Initial setup script for the Cloudflare Workers monorepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on macOS or Linux
OS="$(uname)"
if [[ "$OS" == "Darwin" ]]; then
    PLATFORM="macOS"
elif [[ "$OS" == "Linux" ]]; then
    PLATFORM="Linux"
else
    print_error "Unsupported operating system: $OS"
    exit 1
fi

print_section "Cloudflare Workers Monorepo Setup"
echo "Platform: $PLATFORM"
echo "Starting initial setup..."

# Check prerequisites
print_section "Checking Prerequisites"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if version is 20+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -lt 20 ]; then
        print_warning "Node.js version 20+ recommended. Current: $NODE_VERSION"
    fi
else
    print_error "Node.js not found. Please install Node.js 20+."
    echo "Visit: https://nodejs.org/ or use nvm/volta"
    exit 1
fi

# Check pnpm
if command -v pnpm >/dev/null 2>&1; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm found: v$PNPM_VERSION"
else
    print_error "pnpm not found. Installing pnpm..."
    npm install -g pnpm@9
    print_success "pnpm installed"
fi

# Check Just
if command -v just >/dev/null 2>&1; then
    JUST_VERSION=$(just --version)
    print_success "Just task runner found: $JUST_VERSION"
else
    print_warning "Just task runner not found."
    echo "Install with:"
    if [[ "$PLATFORM" == "macOS" ]]; then
        echo "  brew install just"
    else
        echo "  cargo install just"
        echo "  Or download from: https://just.systems/man/en/installation.html"
    fi
    echo ""
    echo "You can use pnpm scripts as alternative."
fi

# Check Git
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version)
    print_success "Git found: $GIT_VERSION"
else
    print_error "Git not found. Please install Git."
    exit 1
fi

# Install dependencies
print_section "Installing Dependencies"
print_info "Installing project dependencies..."
pnpm install
print_success "Dependencies installed"

# Setup Git hooks
print_section "Setting up Git Hooks"
if command -v lefthook >/dev/null 2>&1; then
    print_info "Setting up Lefthook git hooks..."
    pnpm lefthook install
    print_success "Git hooks configured"
else
    print_warning "Lefthook not found. Git hooks will be installed with dependencies."
fi

# Generate environment files
print_section "Setting up Environment Files"

# Function to create env file if it doesn't exist
create_env_file() {
    local file_path="$1"
    local template="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "$template" > "$file_path"
        print_success "Created $file_path"
    else
        print_info "$file_path already exists"
    fi
}

# Create .env.example
ENV_EXAMPLE="# Cloudflare Workers Monorepo Environment Variables

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-must-be-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:8787

# Optional: OAuth Configuration
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret

# Optional: Monitoring and Logging
# LOG_AGGREGATION_ENDPOINT=https://logs.example.com
# LOG_AGGREGATION_API_KEY=your-log-api-key

# Environment
ENVIRONMENT=development"

create_env_file ".env.example" "$ENV_EXAMPLE"

# Create example worker .dev.vars
WORKER_DEV_VARS="# Example Worker Development Variables

# Database (for local development)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-must-be-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:8787

# Environment
ENVIRONMENT=development"

create_env_file "apps/example-worker/.dev.vars.example" "$WORKER_DEV_VARS"

# Create packages/db/.env.example
DB_ENV="# Database Package Environment Variables

# Database URL for migrations and schema operations
DATABASE_URL=postgresql://user:password@localhost:5432/dbname"

create_env_file "packages/db/.env.example" "$DB_ENV"

# Check for actual environment files
print_section "Environment Configuration"
print_info "Environment file templates created."
echo ""
echo "Next steps for environment setup:"
echo "1. Copy .env.example to .env and update with your values"
echo "2. Copy apps/example-worker/.dev.vars.example to apps/example-worker/.dev.vars"
echo "3. Copy packages/db/.env.example to packages/db/.env"
echo "4. Set up your database (see DATABASE_SETUP.md)"
echo ""

# Validate project structure
print_section "Validating Project Structure"

REQUIRED_DIRS=(
    "apps"
    "packages"
    "turbo"
    ".github/workflows"
    ".cursor/rules"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "Directory $dir exists"
    else
        print_error "Missing directory: $dir"
    fi
done

REQUIRED_FILES=(
    "package.json"
    "turbo.json"
    "biome.json"
    "lefthook.yml"
    "vitest.config.ts"
    "tsconfig.json"
    "tsconfig.base.json"
    "pnpm-workspace.yaml"
    "Justfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "File $file exists"
    else
        print_error "Missing file: $file"
    fi
done

# Run initial checks
print_section "Running Initial Checks"

print_info "Running type check..."
if pnpm type-check >/dev/null 2>&1; then
    print_success "Type check passed"
else
    print_warning "Type check failed - you may need to set up environment files"
fi

print_info "Running linting..."
if pnpm lint >/dev/null 2>&1; then
    print_success "Linting passed"
else
    print_warning "Linting issues found - run 'pnpm lint' for details"
fi

print_info "Running format check..."
if pnpm format:check >/dev/null 2>&1; then
    print_success "Formatting check passed"
else
    print_warning "Formatting issues found - run 'pnpm format' to fix"
fi

# Final instructions
print_section "Setup Complete!"

echo "🎉 Cloudflare Workers monorepo setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up your environment variables (see .env.example files)"
echo "2. Set up your database (see DATABASE_SETUP.md)"
echo "3. Configure Cloudflare resources (see SETUP.md)"
echo ""
echo "Development commands:"
echo "  just dev              # Start all workers in development"
echo "  just check            # Run all checks"
echo "  just new-worker       # Create a new worker"
echo "  just db-setup         # Set up database"
echo ""
echo "For help:"
echo "  just                  # List all available commands"
echo "  cat README.md         # Read the documentation"
echo ""
echo "Happy coding! 🚀"