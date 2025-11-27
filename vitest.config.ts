import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["**/test/**/*.{test,spec}.{js,ts,tsx}"],
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
		projects: [
			// Workers tests - use Workers pool
			// Note: For multiple workers, you can create separate project configs
			// or use environment variables to specify the config path
			defineWorkersConfig({
				test: {
					name: "workers",
					include: ["apps/**/test/**/*.{test,spec}.{js,ts,tsx}"],
					poolOptions: {
						workers: {
							// Default to example-worker for starter template
							// Override with VITEST_WRANGLER_CONFIG env var if needed
							wrangler: {
								configPath:
									process.env.VITEST_WRANGLER_CONFIG || "./apps/example-worker/wrangler.jsonc",
							},
							miniflare: {
								compatibilityDate: "2024-09-23",
								compatibilityFlags: ["nodejs_compat"],
							},
						},
					},
				},
			}),
			// Package tests - use Node.js environment
			{
				test: {
					name: "packages",
					include: ["packages/**/test/**/*.{test,spec}.{js,ts,tsx}"],
					environment: "node",
				},
			},
		],
	},
});
