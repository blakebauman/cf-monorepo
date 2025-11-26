#!/bin/bash
# Deploy a specific worker to Cloudflare

set -e

WORKER_NAME="${1}"
ENVIRONMENT="${2:-production}"

if [ -z "$WORKER_NAME" ]; then
	echo "❌ Worker name required"
	echo "Usage: ./scripts/deployment/deploy-worker.sh <worker-name> [environment]"
	echo ""
	echo "Available workers:"
	ls -d apps/*/ | sed 's/apps\///' | sed 's/\///'
	exit 1
fi

if [ ! -d "apps/$WORKER_NAME" ]; then
	echo "❌ Worker '$WORKER_NAME' not found in apps/"
	exit 1
fi

echo "🚀 Deploying $WORKER_NAME to $ENVIRONMENT..."

cd "apps/$WORKER_NAME"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
pnpm type-check
pnpm lint

# Build check
echo "🔨 Building..."
pnpm build

# Deploy
echo "📤 Deploying to Cloudflare..."
if [ "$ENVIRONMENT" == "production" ]; then
	wrangler deploy
else
	wrangler deploy --env "$ENVIRONMENT"
fi

echo "✅ Deployment complete!"

