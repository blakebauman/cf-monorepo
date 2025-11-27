/**
 * Tests for Error Handler Middleware
 */

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorHandler, notFoundHandler } from "../error-handler";

describe("Error Handler Middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("should handle HTTPException with correct status code", async () => {
		const app = new Hono();
		app.onError(errorHandler());

		app.get("/", (_c) => {
			throw new HTTPException(400, { message: "Bad Request" });
		});

		const response = await app.request("/");

		expect(response.status).toBe(400);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.success).toBe(false);
		expect(body.error).toBe("Bad Request");
		expect(body.requestId).toBeTruthy();
	});

	it("should handle generic errors with 500 status", async () => {
		const app = new Hono();
		app.onError(errorHandler());

		app.get("/", () => {
			throw new Error("Something went wrong");
		});

		const response = await app.request("/");

		expect(response.status).toBe(500);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.success).toBe(false);
		expect(body.error).toBe("Internal Server Error");
		expect(body.requestId).toBeTruthy();
	});

	it("should include request ID in error response", async () => {
		const app = new Hono();
		app.use("*", async (c, next) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			(c as any).set("requestId", "test-request-id");
			await next();
		});
		app.onError(errorHandler());

		app.get("/", () => {
			throw new Error("Test error");
		});

		const response = await app.request("/");

		expect(response.status).toBe(500);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.requestId).toBe("test-request-id");
	});

	it("should use 'unknown' request ID when not set", async () => {
		const app = new Hono();
		app.onError(errorHandler());

		app.get("/", () => {
			throw new Error("Test error");
		});

		const response = await app.request("/");

		expect(response.status).toBe(500);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.requestId).toBe("unknown");
	});

	it("should expose error details in development mode", async () => {
		interface Env {
			ENVIRONMENT: "development" | "production";
		}

		const app = new Hono<{ Bindings: Env }>();
		app.onError(errorHandler());

		app.get("/", (c) => {
			// Simulate development environment
			c.env = { ENVIRONMENT: "development" };
			throw new Error("Detailed error message");
		});

		const response = await app.request("/");

		expect(response.status).toBe(500);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
			message?: string;
		};
		expect(body.message).toBe("Detailed error message");
	});

	it("should not expose error details in production mode", async () => {
		interface Env {
			ENVIRONMENT: "development" | "production";
		}

		const app = new Hono<{ Bindings: Env }>();
		app.onError(errorHandler());

		app.get("/", (c) => {
			// Simulate production environment
			c.env = { ENVIRONMENT: "production" };
			throw new Error("Sensitive error details");
		});

		const response = await app.request("/");

		expect(response.status).toBe(500);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
			message?: string;
		};
		expect(body.message).toBeUndefined();
		expect(body.error).toBe("Internal Server Error");
	});

	it("should log errors to console", async () => {
		const consoleSpy = vi.spyOn(console, "error");
		const app = new Hono();
		app.onError(errorHandler());

		app.get("/", () => {
			throw new Error("Test error");
		});

		await app.request("/");

		expect(consoleSpy).toHaveBeenCalled();
		const logCall = consoleSpy.mock.calls[0]?.[0];
		expect(logCall).toBeTruthy();
		const logData = JSON.parse(logCall as string);
		expect(logData.type).toBe("error");
		expect(logData.error.message).toBe("Test error");
	});

	it("should handle different HTTP exception status codes", async () => {
		const app = new Hono();
		app.onError(errorHandler());

		app.get("/unauthorized", () => {
			throw new HTTPException(401, { message: "Unauthorized" });
		});

		app.get("/forbidden", () => {
			throw new HTTPException(403, { message: "Forbidden" });
		});

		app.get("/not-found", () => {
			throw new HTTPException(404, { message: "Not Found" });
		});

		const responses = await Promise.all([
			app.request("/unauthorized"),
			app.request("/forbidden"),
			app.request("/not-found"),
		]);

		expect(responses[0]?.status).toBe(401);
		expect(responses[1]?.status).toBe(403);
		expect(responses[2]?.status).toBe(404);
	});
});

describe("Not Found Handler", () => {
	it("should return 404 for unknown routes", async () => {
		const app = new Hono();
		app.notFound(notFoundHandler());

		const response = await app.request("/unknown-route");

		expect(response.status).toBe(404);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.success).toBe(false);
		expect(body.error).toBe("Not Found");
	});

	it("should include request ID in 404 response", async () => {
		const app = new Hono();
		app.use("*", async (c, next) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			(c as any).set("requestId", "test-404-id");
			await next();
		});
		app.notFound(notFoundHandler());

		const response = await app.request("/unknown");

		expect(response.status).toBe(404);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.requestId).toBe("test-404-id");
	});

	it("should use 'unknown' request ID when not set", async () => {
		const app = new Hono();
		app.notFound(notFoundHandler());

		const response = await app.request("/unknown");

		expect(response.status).toBe(404);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.requestId).toBe("unknown");
	});

	it("should return 404 for any HTTP method on unknown routes", async () => {
		const app = new Hono();
		app.notFound(notFoundHandler());

		const responses = await Promise.all([
			app.request("/unknown", { method: "GET" }),
			app.request("/unknown", { method: "POST" }),
			app.request("/unknown", { method: "PUT" }),
			app.request("/unknown", { method: "DELETE" }),
		]);

		for (const response of responses) {
			expect(response.status).toBe(404);
		}
	});
});
