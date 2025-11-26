/**
 * Global Error Handler Middleware
 * Handles errors consistently with request ID tracking
 */

import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

interface ErrorResponse {
	success: false;
	error: string;
	requestId: string;
	message?: string;
}

/**
 * Global error handler with request ID tracking
 */
export function errorHandler(): ErrorHandler {
	return (err, c) => {
		const requestId = c.get("requestId") ?? "unknown";

		// Log error with structured format
		const errorLog = {
			timestamp: new Date().toISOString(),
			requestId,
			error: {
				message: err instanceof Error ? err.message : "Unknown error",
				stack: err instanceof Error ? err.stack : undefined,
				name: err instanceof Error ? err.name : "Error",
			},
			path: c.req.path,
			method: c.req.method,
		};

		console.error(JSON.stringify({ type: "error", ...errorLog }));

		// Handle HTTPException
		if (err instanceof HTTPException) {
			const response: ErrorResponse = {
				success: false,
				error: err.message,
				requestId,
			};

			return c.json(response, err.status);
		}

		// Handle unknown errors
		const response: ErrorResponse = {
			success: false,
			error: "Internal Server Error",
			requestId,
		};

		// Only expose error details in development
		const isDevelopment = c.env?.ENVIRONMENT === "development";
		if (isDevelopment && err instanceof Error) {
			response.message = err.message;
		}

		return c.json(response, 500);
	};
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(): NotFoundHandler {
	return (c) => {
		const requestId = c.get("requestId") ?? "unknown";

		const response: ErrorResponse = {
			success: false,
			error: "Not Found",
			requestId,
		};

		return c.json(response, 404);
	};
}
