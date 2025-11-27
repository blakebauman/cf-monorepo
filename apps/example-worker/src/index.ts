/**
 * Example Cloudflare Worker with Hono, Better Auth, Drizzle, and Hyperdrive
 * Production-ready with OpenAPI, request tracking, and middleware
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import { createAuth } from "@repo/auth";
import { createDb } from "@repo/db";
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
import { createServices } from "./services";

type Context = {
	Bindings: Env;
	Variables: {
		requestId: string;
	};
};

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

// 5. Rate limiting middleware (applies if RATE_LIMITER binding exists)
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
		description: "Production-ready API with OpenAPI documentation",
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
// Schemas
// ============================================================================

const UserSchema = z
	.object({
		id: z.union([z.number(), z.string()]).openapi({
			example: 123,
		}),
		email: z.string().email().openapi({
			example: "user@example.com",
		}),
		name: z.string().nullable().openapi({
			example: "John Doe",
		}),
		createdAt: z.union([z.date(), z.string()]).nullable().openapi({
			example: "2024-01-01T00:00:00Z",
		}),
		updatedAt: z.union([z.date(), z.string()]).nullable().openapi({
			example: "2024-01-01T00:00:00Z",
		}),
	})
	.openapi("User");

// Health check response using shared schema
const HealthResponseSchema = SuccessResponseSchema.extend({
	data: z.object({
		message: z.string(),
	}),
}).openapi("HealthResponse");

// User response using shared schema
const UserResponseSchema = SuccessResponseSchema.extend({
	data: UserSchema,
}).openapi("UserResponse");

// Users list response using shared schema
const UsersResponseSchema = SuccessResponseSchema.extend({
	data: z.array(UserSchema),
}).openapi("UsersResponse");

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
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
						schema: UserResponseSchema,
					},
				},
			},
			...standardErrorResponses,
		},
	},
	async (c) => {
		try {
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
		} catch (error) {
			const requestId = c.get("requestId");
			return c.json(
				{
					...errorResponse(error instanceof Error ? error.message : "Internal server error"),
					requestId,
				},
				500
			) as never;
		}
	}
);

// Get all users (public route for demonstration)
app.openapi(
	{
		method: "get",
		path: "/api/users",
		summary: "Get all users",
		description: "Returns a list of all users (for demonstration)",
		responses: {
			200: {
				description: "Users retrieved successfully",
				content: {
					"application/json": {
						schema: UsersResponseSchema,
					},
				},
			},
			...standardErrorResponses,
		},
	},
	async (c) => {
		try {
			const db = createDb(c.env);
			const services = createServices(db);
			const allUsers = await services.user.findAll();
			return c.json(successResponse(allUsers)) as never;
		} catch (error) {
			const requestId = c.get("requestId");
			return c.json(
				{
					...errorResponse(error instanceof Error ? error.message : "Internal server error"),
					requestId,
				},
				500
			) as never;
		}
	}
);

// ============================================================================
// Error Handlers
// ============================================================================

// Global error handler
app.onError(errorHandler());

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
