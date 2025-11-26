/**
 * CORS configuration for different environments
 */

import type { Env } from "@cf-monorepo/types";
import { ENVIRONMENTS, getEnvironment } from "./index";

export interface CorsConfig {
	origins: string[];
	methods: string[];
	allowedHeaders: string[];
	exposedHeaders: string[];
	credentials: boolean;
	maxAge: number;
}

/**
 * Gets CORS configuration for the current environment
 */
export function getCorsConfig(env: Partial<Env>): CorsConfig {
	const environment = getEnvironment(env);

	const baseConfig: CorsConfig = {
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
			"Origin",
			"X-Request-ID",
		],
		exposedHeaders: [
			"X-Request-ID",
			"X-RateLimit-Limit",
			"X-RateLimit-Remaining",
			"X-RateLimit-Reset",
		],
		credentials: true,
		maxAge: 86400, // 24 hours
		origins: [],
	};

	switch (environment) {
		case ENVIRONMENTS.DEVELOPMENT:
			return {
				...baseConfig,
				origins: [
					"http://localhost:3000",
					"http://localhost:3001",
					"http://localhost:5173", // Vite
					"http://localhost:8787", // Wrangler dev
					"http://127.0.0.1:3000",
					"http://127.0.0.1:8787",
				],
			};

		case ENVIRONMENTS.STAGING:
			return {
				...baseConfig,
				origins: [
					"https://staging.example.com",
					"https://staging-app.example.com",
					// Add your staging domains
				],
			};

		case ENVIRONMENTS.PRODUCTION:
			return {
				...baseConfig,
				origins: [
					"https://example.com",
					"https://www.example.com",
					"https://app.example.com",
					// Add your production domains
				],
			};

		default:
			return {
				...baseConfig,
				origins: ["*"], // Fallback - not recommended for production
			};
	}
}

/**
 * Checks if an origin is allowed
 */
export function isOriginAllowed(origin: string, env: Partial<Env>): boolean {
	const config = getCorsConfig(env);

	// Allow all origins if "*" is specified
	if (config.origins.includes("*")) {
		return true;
	}

	// Check exact match
	if (config.origins.includes(origin)) {
		return true;
	}

	// Check wildcard patterns (simple implementation)
	for (const allowedOrigin of config.origins) {
		if (allowedOrigin.includes("*")) {
			const pattern = new RegExp(allowedOrigin.replace(/\*/g, ".*").replace(/\./g, "\\."));
			if (pattern.test(origin)) {
				return true;
			}
		}
	}

	return false;
}
