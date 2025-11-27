/**
 * Cloudflare Rate Limiter Middleware
 * Uses Cloudflare's RateLimiter binding for rate limiting
 */

import type { MiddlewareHandler } from "hono";

export interface RateLimitConfig {
	/**
	 * Rate limit identifier function
	 * Default: uses CF-Connecting-IP or X-Forwarded-For header
	 */
	identifier?: (c: {
		req: { header: (name: string) => string | undefined };
		env: { RATE_LIMITER?: unknown };
	}) => string;
	/**
	 * Rate limit configuration
	 */
	limit: {
		/**
		 * Number of requests allowed
		 */
		requests: number;
		/**
		 * Time window in seconds
		 */
		window: number;
	};
	/**
	 * Custom error message
	 */
	errorMessage?: string;
}

/**
 * Cloudflare Rate Limiter middleware
 * Requires RATE_LIMITER binding in wrangler.jsonc
 * Accesses rate limiter from c.env.RATE_LIMITER
 */
export function rateLimiter(config: RateLimitConfig): MiddlewareHandler {
	const {
		identifier = (c) => {
			// Use Cloudflare's connecting IP or fallback to forwarded IP
			return c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
		},
		limit,
		errorMessage = "Rate limit exceeded",
	} = config;

	return async (c, next) => {
		// Check if rate limiter is available
		const limiter = (
			c.env as { RATE_LIMITER?: RateLimitConfig["limit"] extends infer L ? L : never }
		)?.RATE_LIMITER;

		if (!limiter || typeof limiter !== "object" || !("limit" in limiter)) {
			// If no rate limiter binding, skip rate limiting
			return next();
		}

		const id = identifier(c);

		try {
			// Get rate limit status
			const result = await (
				limiter as {
					limit: (options: { key: string; limit: number; window: number }) => Promise<{
						success: boolean;
						limit: number;
						remaining: number;
						reset: number;
					}>;
				}
			).limit({
				key: id,
				limit: limit.requests,
				window: limit.window,
			});

			const { success, limit: rateLimit, remaining, reset } = result;

			// Add rate limit headers
			c.header("X-RateLimit-Limit", rateLimit.toString());
			c.header("X-RateLimit-Remaining", remaining.toString());
			c.header("X-RateLimit-Reset", reset.toString());

			if (!success) {
				const requestId = c.get("requestId") ?? "unknown";

				return c.json(
					{
						success: false,
						error: errorMessage,
						requestId,
					},
					429
				);
			}

			await next();
		} catch (error) {
			// If rate limiter fails, log and continue (fail open)
			console.error("Rate limiter error:", error);
			await next();
		}
	};
}
