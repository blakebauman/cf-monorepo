/**
 * Example Cloudflare Worker with Hono, Better Auth, Drizzle, and Hyperdrive
 * Production-ready with OpenAPI, request tracking, and layered architecture
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuth } from "@repo/auth";
import { createDb } from "@repo/db";
import { isBaseError } from "@repo/errors";
import {
	enhancedCors,
	errorHandler,
	notFoundHandler,
	rateLimiter,
	requestId,
	securityHeaders,
	structuredLogger,
} from "@repo/middleware";
import { SuccessResponseSchema, standardErrorResponses } from "@repo/openapi";
import type { Env } from "@repo/types";
import { errorResponse, successResponse } from "@repo/utils";
import { Scalar } from "@scalar/hono-api-reference";
import { registerUserRoutes } from "./routes";
import { createServices } from "./services";
import type { Context } from "./types";

const app = new OpenAPIHono<Context>();

// ============================================================================
// Middleware (order matters - apply in sequence)
// ============================================================================

// 1. Request ID - must be first to track all requests
app.use("*", requestId());

// 2. Structured logging - logs with request ID
app.use("*", structuredLogger());

// 3. Security headers
app.use("*", securityHeaders());

// 4. Enhanced CORS - environment-aware
app.use(
	"*",
	enhancedCors({
		environment: "development", // Will be determined from env at runtime
		// Configure production origins in production
		// origins: ["https://yourdomain.com"],
	})
);

// 5. Services injection middleware - creates services for each request
app.use("*", async (c, next) => {
	const db = createDb(c.env);
	const services = createServices(db);
	c.set("services", services);
	await next();
});

// 6. Rate limiting middleware (applies if RATE_LIMITER binding exists)
app.use(
	"/api/*",
	rateLimiter({
		limit: {
			requests: 100,
			window: 60, // 100 requests per minute
		},
	})
);

// ============================================================================
// OpenAPI Documentation
// ============================================================================

app.doc("/openapi.json", {
	openapi: "3.1.0",
	info: {
		version: "1.0.0",
		title: "Example Worker API",
		description: "Production-ready API with OpenAPI documentation and layered architecture",
	},
	servers: [
		{
			url: "https://example-worker.your-subdomain.workers.dev",
			description: "Production",
		},
		{
			url: "http://localhost:8787",
			description: "Development",
		},
	],
});

// Scalar UI for API documentation
app.get("/docs", Scalar({ theme: "purple" }));

// ============================================================================
// Health Check
// ============================================================================

const HealthResponseSchema = SuccessResponseSchema.extend({
	data: { message: "string" },
}).openapi("HealthResponse");

app.openapi(
	{
		method: "get",
		path: "/",
		summary: "Health check",
		description: "Returns API health status",
		responses: {
			200: {
				description: "API is healthy",
				content: {
					"application/json": {
						schema: HealthResponseSchema,
					},
				},
			},
			...standardErrorResponses,
		},
	},
	(c) => {
		return c.json(successResponse({ message: "Example Worker API" }) as never);
	}
);

// ============================================================================
// Authentication Routes
// ============================================================================

// Auth routes - mount Better Auth handler (not OpenAPI)
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

// Get current user (protected route)
app.openapi(
	{
		method: "get",
		path: "/api/user",
		summary: "Get current user",
		description: "Returns the currently authenticated user",
		security: [
			{
				bearerAuth: [],
			},
		],
		responses: {
			200: {
				description: "User retrieved successfully",
				content: {
					"application/json": {
						schema: SuccessResponseSchema,
					},
				},
			},
			...standardErrorResponses,
		},
	},
	async (c) => {
		const auth = createAuth(c.env);
		const session = await auth.api.getSession({ headers: c.req.raw.headers });

		if (!session) {
			const requestId = c.get("requestId");
			return c.json(
				{
					...errorResponse("Unauthorized"),
					requestId,
				},
				401
			) as never;
		}

		return c.json(successResponse(session.user)) as never;
	}
);

// ============================================================================
// API Routes
// ============================================================================

// Register user routes
registerUserRoutes(app);

// ============================================================================
// Error Handlers
// ============================================================================

// Enhanced error handler with BaseError support
app.onError((err, c) => {
	const requestId = c.get("requestId");

	// Handle custom BaseError instances
	if (isBaseError(err)) {
		console.error("BaseError:", {
			requestId,
			error: err.toJSON(),
		});

		return c.json(
			{
				success: false,
				error: err.code,
				message: err.expose ? err.message : "An error occurred",
				requestId,
			},
			err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500 | 502
		);
	}

	// Fallback to default error handler
	return errorHandler()(err, c);
});

// 404 handler
app.notFound(notFoundHandler());

// ============================================================================
// Export
// ============================================================================

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
};
