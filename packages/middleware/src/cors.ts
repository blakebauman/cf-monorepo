/**
 * Enhanced CORS Middleware
 * Environment-aware CORS configuration
 */

import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";

export interface CorsConfig {
	/**
	 * Allowed origins
	 * - Development: defaults to ["*"] or ["http://localhost:*"]
	 * - Production: should be specific domains
	 */
	origins?: string[] | ((origin: string) => boolean);
	/**
	 * Allowed headers
	 */
	allowHeaders?: string[];
	/**
	 * Allowed methods
	 */
	allowMethods?: string[];
	/**
	 * Allow credentials
	 */
	credentials?: boolean;
	/**
	 * Expose headers
	 */
	exposeHeaders?: string[];
	/**
	 * Max age for preflight
	 */
	maxAge?: number;
	/**
	 * Environment (dev/prod) - determines default origins
	 * Can also be determined from c.env.ENVIRONMENT
	 */
	environment?: "development" | "production";
}

/**
 * Enhanced CORS middleware with environment-aware defaults
 */
export function enhancedCors(config: CorsConfig = {}): MiddlewareHandler {
	const {
		environment = "development",
		allowHeaders = ["Content-Type", "Authorization", "X-Request-ID"],
		allowMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		credentials = true,
		exposeHeaders = ["X-Request-ID"],
		maxAge = 86400,
	} = config;

	return async (c, next) => {
		// Determine environment from config or env binding
		const env =
			(c.env as { ENVIRONMENT?: "development" | "production" })?.ENVIRONMENT ?? environment;

		// Default origins based on environment
		let defaultOrigins: string | string[] | ((origin: string) => string | null | undefined);
		if (config.origins) {
			if (typeof config.origins === "function") {
				// Convert boolean function to string function
				defaultOrigins = (origin: string) =>
					(config.origins as (origin: string) => boolean)(origin) ? origin : null;
			} else {
				defaultOrigins = config.origins;
			}
		} else if (env === "production") {
			defaultOrigins = []; // Production should specify origins
		} else {
			defaultOrigins = "*"; // Development allows all
		}

		return cors({
			origin: defaultOrigins,
			allowHeaders,
			allowMethods,
			credentials,
			exposeHeaders,
			maxAge,
		})(c, next);
	};
}
