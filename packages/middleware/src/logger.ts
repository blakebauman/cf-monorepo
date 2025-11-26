/**
 * Structured JSON Logger Middleware
 * Logs requests and responses in structured JSON format
 */

import type { MiddlewareHandler } from "hono";

interface LogEntry {
	timestamp: string;
	requestId: string;
	method: string;
	path: string;
	statusCode?: number;
	duration?: number;
	userAgent?: string;
	ip?: string;
	error?: {
		message: string;
		stack?: string;
	};
}

/**
 * Structured JSON logger middleware
 * Logs request/response information in JSON format for production
 */
export function structuredLogger(): MiddlewareHandler {
	return async (c, next) => {
		const start = Date.now();
		const requestId = c.get("requestId") ?? "unknown";
		const method = c.req.method;
		const path = c.req.path;
		const userAgent = c.req.header("user-agent");
		const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for");

		// Log request
		const requestLog: LogEntry = {
			timestamp: new Date().toISOString(),
			requestId,
			method,
			path,
			userAgent,
			ip,
		};

		console.info(JSON.stringify({ type: "request", ...requestLog }));

		try {
			await next();

			const duration = Date.now() - start;
			const statusCode = c.res.status;

			// Log response
			const responseLog: LogEntry = {
				...requestLog,
				statusCode,
				duration,
			};

			console.info(JSON.stringify({ type: "response", ...responseLog }));
		} catch (error) {
			const duration = Date.now() - start;

			// Log error
			const errorLog: LogEntry = {
				...requestLog,
				duration,
				error: {
					message: error instanceof Error ? error.message : "Unknown error",
					stack: error instanceof Error ? error.stack : undefined,
				},
			};

			console.error(JSON.stringify({ type: "error", ...errorLog }));

			throw error;
		}
	};
}
