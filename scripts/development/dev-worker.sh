#!/bin/bash
# Development script to start a specific worker with proper environment

set -e

WORKER_NAME="${1:-example-worker}"

if [ ! -d "apps/$WORKER_NAME" ]; then
	echo "❌ Worker '$WORKER_NAME' not found in apps/"
	echo "Available workers:"
	ls -d apps/*/ | sed 's/apps\///' | sed 's/\///'
	exit 1
fi

echo "🚀 Starting development server for $WORKER_NAME..."
cd "apps/$WORKER_NAME"

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
	echo "⚠️  Warning: .dev.vars not found"
	echo "📝 Copy .dev.vars.example to .dev.vars and configure your environment variables"
	echo ""
	read -p "Continue anyway? (y/N) " -n 1 -r
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]; then
		exit 1
	fi
fi

# Start wrangler dev
pnpm dev

