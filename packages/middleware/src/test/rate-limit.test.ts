/**
 * Tests for Rate Limit Middleware
 */

import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { rateLimiter } from "../rate-limit";

interface RateLimiterBinding {
	limit: (options: { key: string; limit: number; window: number }) => Promise<{
		success: boolean;
		limit: number;
		remaining: number;
		reset: number;
	}>;
}

interface Env {
	RATE_LIMITER?: RateLimiterBinding;
}

describe("Rate Limit Middleware", () => {
	let mockLimiter: RateLimiterBinding;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});

		mockLimiter = {
			limit: vi.fn().mockResolvedValue({
				success: true,
				limit: 10,
				remaining: 9,
				reset: Date.now() + 60000,
			}),
		};
	});

	it("should allow requests within rate limit", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		// Without actual binding, should skip rate limiting
		expect(response.status).toBe(200);
	});

	it("should block requests exceeding rate limit", async () => {
		mockLimiter.limit = vi.fn().mockResolvedValue({
			success: false,
			limit: 10,
			remaining: 0,
			reset: Date.now() + 60000,
		});

		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(response.status).toBe(429);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.success).toBe(false);
		expect(body.error).toBe("Rate limit exceeded");
	});

	it("should add rate limit headers to response", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
		expect(response.headers.get("X-RateLimit-Remaining")).toBe("9");
		expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
	});

	it("should use cf-connecting-ip as default identifier", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(mockLimiter.limit).toHaveBeenCalledWith({
			key: "192.168.1.1",
			limit: 10,
			window: 60,
		});
	});

	it("should fallback to x-forwarded-for if cf-connecting-ip not available", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/", {
			headers: { "x-forwarded-for": "10.0.0.1" },
		});

		expect(mockLimiter.limit).toHaveBeenCalledWith({
			key: "10.0.0.1",
			limit: 10,
			window: 60,
		});
	});

	it("should use 'unknown' if no IP headers present", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/");

		expect(mockLimiter.limit).toHaveBeenCalledWith({
			key: "unknown",
			limit: 10,
			window: 60,
		});
	});

	it("should support custom identifier function", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
				identifier: (c) => c.req.header("x-api-key") ?? "anonymous",
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/", {
			headers: { "x-api-key": "user-123" },
		});

		expect(mockLimiter.limit).toHaveBeenCalledWith({
			key: "user-123",
			limit: 10,
			window: 60,
		});
	});

	it("should include request ID in rate limit error", async () => {
		mockLimiter.limit = vi.fn().mockResolvedValue({
			success: false,
			limit: 10,
			remaining: 0,
			reset: Date.now() + 60000,
		});

		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			(c as any).set("requestId", "test-rate-limit-id");
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(response.status).toBe(429);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
			requestId: string;
		};
		expect(body.requestId).toBe("test-rate-limit-id");
	});

	it("should support custom error message", async () => {
		mockLimiter.limit = vi.fn().mockResolvedValue({
			success: false,
			limit: 10,
			remaining: 0,
			reset: Date.now() + 60000,
		});

		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
				errorMessage: "Too many requests, please try again later",
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(response.status).toBe(429);
		const body = (await response.json()) as {
			success: boolean;
			error: string;
		};
		expect(body.error).toBe("Too many requests, please try again later");
	});

	it("should fail open if rate limiter throws error", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error");
		mockLimiter.limit = vi.fn().mockRejectedValue(new Error("Rate limiter service unavailable"));

		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});
		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(response.status).toBe(200);
		expect(consoleErrorSpy).toHaveBeenCalledWith("Rate limiter error:", expect.any(Error));
	});

	it("should skip rate limiting if no binding configured", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use(
			"*",
			rateLimiter({
				limit: { requests: 10, window: 60 },
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(response.status).toBe(200);
	});

	it("should handle different rate limit configurations", async () => {
		const app = new Hono<{ Bindings: Env }>();

		app.use("*", async (c, next) => {
			c.env = { RATE_LIMITER: mockLimiter };
			await next();
		});

		// Strict rate limit for auth endpoints
		app.use(
			"/auth/*",
			rateLimiter({
				limit: { requests: 5, window: 60 },
			})
		);

		// Relaxed rate limit for public endpoints
		app.use(
			"/api/*",
			rateLimiter({
				limit: { requests: 100, window: 60 },
			})
		);

		app.post("/auth/login", (c) => c.json({ success: true }));
		app.get("/api/data", (c) => c.json({ success: true }));

		const authResponse = await app.request("/auth/login", {
			method: "POST",
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		const apiResponse = await app.request("/api/data", {
			headers: { "cf-connecting-ip": "192.168.1.1" },
		});

		expect(authResponse.status).toBe(200);
		expect(apiResponse.status).toBe(200);

		// Verify different limits were called
		const calls = (mockLimiter.limit as ReturnType<typeof vi.fn>).mock.calls;
		expect(calls[0]?.[0]).toMatchObject({ limit: 5, window: 60 });
		expect(calls[1]?.[0]).toMatchObject({ limit: 100, window: 60 });
	});
});
