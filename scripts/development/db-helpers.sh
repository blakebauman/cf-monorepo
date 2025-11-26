#!/bin/bash
# Database helper scripts for development

set -e

COMMAND="${1:-help}"

case "$COMMAND" in
	generate)
		echo "📦 Generating Drizzle migrations..."
		pnpm db:generate
		;;
	migrate)
		echo "🚀 Running database migrations..."
		pnpm db:migrate
		;;
	studio)
		echo "🎨 Opening Drizzle Studio..."
		pnpm db:studio
		;;
	setup)
		echo "🔧 Setting up database..."
		pnpm db:generate
		pnpm db:migrate
		echo "✅ Database setup complete!"
		;;
	reset)
		echo "⚠️  WARNING: This will reset your database!"
		read -p "Are you sure? Type 'yes' to continue: " -r
		if [[ $REPLY == "yes" ]]; then
			echo "🔄 Resetting database..."
			# Add your reset logic here
			echo "✅ Database reset complete"
		else
			echo "❌ Reset cancelled"
		fi
		;;
	help|*)
		echo "Database Helper Scripts"
		echo ""
		echo "Usage: ./scripts/development/db-helpers.sh [command]"
		echo ""
		echo "Commands:"
		echo "  generate  - Generate Drizzle migrations from schema"
		echo "  migrate   - Run pending database migrations"
		echo "  studio    - Open Drizzle Studio (database GUI)"
		echo "  setup     - Generate and run migrations (full setup)"
		echo "  reset     - Reset database (WARNING: destructive)"
		echo "  help      - Show this help message"
		;;
esac

