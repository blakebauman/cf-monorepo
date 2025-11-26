import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		globals: true,
		// Use Workers pool for testing Workers runtime
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.toml" },
				miniflare: {
					// Miniflare options for testing
					compatibilityDate: "2024-09-23",
					compatibilityFlags: ["nodejs_compat"],
				},
			},
		},
		include: ["**/*.{test,spec}.{js,ts,tsx}"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/.wrangler/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"**/node_modules/**",
				"**/dist/**",
				"**/.wrangler/**",
				"**/*.config.*",
				"**/drizzle/**",
				"**/turbo/**",
			],
		},
		// Separate configuration for different test types
		workspace: [
			{
				// Workers tests - use Workers pool
				test: {
					name: "workers",
					include: ["apps/**/*.{test,spec}.{js,ts,tsx}"],
					pool: "workers",
					poolOptions: {
						workers: {
							wrangler: { configPath: "./apps/example-worker/wrangler.jsonc" },
							miniflare: {
								compatibilityDate: "2024-09-23",
								compatibilityFlags: ["nodejs_compat"],
							},
						},
					},
				},
			},
			{
				// Package tests - use Node.js environment
				test: {
					name: "packages",
					include: ["packages/**/*.{test,spec}.{js,ts,tsx}"],
					environment: "node",
				},
			},
		],
	},
});
