/**
 * Request ID Middleware
 * Generates or forwards request IDs for request tracing
 */

import type { MiddlewareHandler } from "hono";
import { nanoid } from "nanoid";

const REQUEST_ID_HEADER = "X-Request-ID";
const REQUEST_ID_VARIABLE = "requestId";

/**
 * Middleware to generate or forward request IDs
 * - Checks for existing X-Request-ID header
 * - Generates new ID if not present
 * - Adds to response headers
 * - Stores in context variables for logging
 */
export function requestId(): MiddlewareHandler {
	return async (c, next) => {
		// Check for existing request ID in header
		const existingId = c.req.header(REQUEST_ID_HEADER);

		// Generate new ID if not present (using nanoid for compact IDs)
		const requestId = existingId ?? nanoid();

		// Store in context variables for downstream use
		c.set(REQUEST_ID_VARIABLE, requestId);

		// Call next middleware
		await next();

		// Add request ID to response headers
		c.header(REQUEST_ID_HEADER, requestId);
	};
}
