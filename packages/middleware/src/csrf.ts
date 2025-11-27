/**
 * CSRF Protection Middleware
 * Wrapper around Hono's built-in CSRF middleware with environment-aware defaults
 */

import type { MiddlewareHandler } from "hono";
import { csrf } from "hono/csrf";

export interface CsrfConfig {
	/**
	 * Origin to validate against
	 * Can be:
	 * - string: exact origin match
	 * - string[]: multiple allowed origins
	 * - function: custom validation logic
	 *
	 * Default: Uses BETTER_AUTH_URL from env
	 */
	origin?: string | string[] | ((origin: string) => boolean);
	/**
	 * Environment (determines if CSRF is enabled)
	 * CSRF is typically disabled in test environments
	 */
	environment?: "development" | "production" | "test";
}

/**
 * CSRF protection middleware
 * Protects against Cross-Site Request Forgery attacks
 *
 * @example
 * ```typescript
 * import { csrfProtection } from "@repo/middleware";
 *
 * // Basic usage
 * app.use("*", csrfProtection());
 *
 * // With specific origin
 * app.use("*", csrfProtection({
 *   origin: "https://example.com"
 * }));
 *
 * // With multiple origins
 * app.use("*", csrfProtection({
 *   origin: ["https://example.com", "https://app.example.com"]
 * }));
 *
 * // With custom validation
 * app.use("*", csrfProtection({
 *   origin: (origin) => origin.endsWith(".example.com")
 * }));
 * ```
 */
export function csrfProtection(config: CsrfConfig = {}): MiddlewareHandler {
	return async (c, next) => {
		// Get environment from config or context
		const environment =
			config.environment ||
			(c.env as { ENVIRONMENT?: "development" | "production" | "test" })?.ENVIRONMENT ||
			"development";

		// Skip CSRF protection in test environment
		if (environment === "test") {
			return next();
		}

		// Determine origin
		let origin: string | string[] | ((origin: string) => boolean) | undefined;

		if (config.origin) {
			origin = config.origin;
		} else {
			// Try to get origin from environment
			const authUrl = (c.env as { BETTER_AUTH_URL?: string })?.BETTER_AUTH_URL;
			if (authUrl) {
				origin = authUrl;
			}
		}

		// Apply CSRF middleware
		return csrf({ origin })(c, next);
	};
}

/**
 * CSRF protection for specific routes (e.g., auth routes)
 * Convenience wrapper for applying CSRF to specific path patterns
 *
 * @example
 * ```typescript
 * import { csrfForRoutes } from "@repo/middleware";
 *
 * // Protect all /api/auth routes
 * app.use("/api/auth/*", csrfForRoutes());
 *
 * // With custom origin
 * app.use("/api/auth/*", csrfForRoutes({
 *   origin: "https://example.com"
 * }));
 * ```
 */
export function csrfForRoutes(config: CsrfConfig = {}): MiddlewareHandler {
	return csrfProtection(config);
}
