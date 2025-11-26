#!/bin/bash
# Deploy all workers to Cloudflare

set -e

ENVIRONMENT="${1:-production}"

echo "🚀 Deploying all workers to $ENVIRONMENT..."
echo ""

# Find all workers
WORKERS=$(find apps -name "wrangler.jsonc" -o -name "wrangler.toml" | xargs dirname | xargs -n1 basename)

if [ -z "$WORKERS" ]; then
	echo "❌ No workers found in apps/"
	exit 1
fi

echo "Found workers:"
echo "$WORKERS" | sed 's/^/  - /'
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
	exit 1
fi

# Deploy each worker
for worker in $WORKERS; do
	echo ""
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	echo "Deploying $worker..."
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	
	cd "apps/$worker"
	
	# Pre-deployment checks
	pnpm type-check
	pnpm lint
	pnpm build
	
	# Deploy
	if [ "$ENVIRONMENT" == "production" ]; then
		wrangler deploy
	else
		wrangler deploy --env "$ENVIRONMENT"
	fi
	
	cd - > /dev/null
	
	# Wait between deployments to avoid rate limits
	sleep 5
done

echo ""
echo "✅ All workers deployed successfully!"

