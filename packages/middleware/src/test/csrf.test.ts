/**
 * Tests for CSRF Protection Middleware
 */

import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { csrfForRoutes, csrfProtection } from "../csrf";

interface Env {
	ENVIRONMENT?: "development" | "production" | "test";
	BETTER_AUTH_URL?: string;
}

describe("CSRF Protection Middleware", () => {
	let app: Hono<{ Bindings: Env }>;

	beforeEach(() => {
		app = new Hono<{ Bindings: Env }>();
	});

	describe("csrfProtection", () => {
		it("should allow GET requests without CSRF token", async () => {
			app.use("*", csrfProtection());
			app.get("/", (c) => c.json({ success: true }));

			const response = await app.request("/", {
				method: "GET",
			});

			expect(response.status).toBe(200);
		});

		it("should allow HEAD requests without CSRF token", async () => {
			app.use("*", csrfProtection());
			app.get("/", (c) => c.json({ success: true }));

			const response = await app.request("/", {
				method: "HEAD",
			});

			expect(response.status).toBe(200);
		});

		it("should block POST requests without origin header when origin is configured", async () => {
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.post("/", (c) => c.json({ success: true }));

			const response = await app.request("/", {
				method: "POST",
			});

			expect(response.status).toBe(403);
		});

		it("should allow POST requests with matching origin", async () => {
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.post("/", (c) => c.json({ success: true }));

			const response = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://example.com",
				},
			});

			expect(response.status).toBe(200);
		});

		it("should block POST requests with non-matching origin", async () => {
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.post("/", (c) => c.json({ success: true }));

			const response = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(response.status).toBe(403);
		});

		it("should support multiple allowed origins", async () => {
			app.use(
				"*",
				csrfProtection({
					origin: ["https://example.com", "https://app.example.com"],
				})
			);
			app.post("/", (c) => c.json({ success: true }));

			const response1 = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://example.com",
				},
			});

			const response2 = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://app.example.com",
				},
			});

			expect(response1.status).toBe(200);
			expect(response2.status).toBe(200);
		});

		it("should support custom origin validation function", async () => {
			app.use(
				"*",
				csrfProtection({
					origin: (origin) => origin.endsWith(".example.com"),
				})
			);
			app.post("/", (c) => c.json({ success: true }));

			const validResponse = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://api.example.com",
				},
			});

			const invalidResponse = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(validResponse.status).toBe(200);
			expect(invalidResponse.status).toBe(403);
		});

		it("should use BETTER_AUTH_URL from environment if no origin specified", async () => {
			app.use("*", async (c, next) => {
				c.env = { BETTER_AUTH_URL: "https://example.com" };
				await next();
			});
			app.use("*", csrfProtection());
			app.post("/", (c) => c.json({ success: true }));

			const validResponse = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://example.com",
				},
			});

			const invalidResponse = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://other.com",
				},
			});

			expect(validResponse.status).toBe(200);
			expect(invalidResponse.status).toBe(403);
		});

		it("should skip CSRF protection in test environment", async () => {
			app.use("*", async (c, next) => {
				c.env = { ENVIRONMENT: "test" };
				await next();
			});
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.post("/", (c) => c.json({ success: true }));

			const response = await app.request("/", {
				method: "POST",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(response.status).toBe(200);
		});

		it("should protect PUT requests", async () => {
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.put("/", (c) => c.json({ success: true }));

			const validResponse = await app.request("/", {
				method: "PUT",
				headers: {
					Origin: "https://example.com",
				},
			});

			const invalidResponse = await app.request("/", {
				method: "PUT",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(validResponse.status).toBe(200);
			expect(invalidResponse.status).toBe(403);
		});

		it("should protect DELETE requests", async () => {
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.delete("/", (c) => c.json({ success: true }));

			const validResponse = await app.request("/", {
				method: "DELETE",
				headers: {
					Origin: "https://example.com",
				},
			});

			const invalidResponse = await app.request("/", {
				method: "DELETE",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(validResponse.status).toBe(200);
			expect(invalidResponse.status).toBe(403);
		});

		it("should protect PATCH requests", async () => {
			app.use("*", csrfProtection({ origin: "https://example.com" }));
			app.patch("/", (c) => c.json({ success: true }));

			const validResponse = await app.request("/", {
				method: "PATCH",
				headers: {
					Origin: "https://example.com",
				},
			});

			const invalidResponse = await app.request("/", {
				method: "PATCH",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(validResponse.status).toBe(200);
			expect(invalidResponse.status).toBe(403);
		});
	});

	describe("csrfForRoutes", () => {
		it("should protect specific routes", async () => {
			app.use("/api/auth/*", csrfForRoutes({ origin: "https://example.com" }));
			app.post("/api/auth/login", (c) => c.json({ success: true }));
			app.post("/api/public", (c) => c.json({ success: true }));

			const authResponse = await app.request("/api/auth/login", {
				method: "POST",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			const publicResponse = await app.request("/api/public", {
				method: "POST",
				headers: {
					Origin: "https://malicious.com",
				},
			});

			expect(authResponse.status).toBe(403); // Protected
			expect(publicResponse.status).toBe(200); // Not protected
		});

		it("should work with environment-based origin", async () => {
			app.use("*", async (c, next) => {
				c.env = { BETTER_AUTH_URL: "https://example.com" };
				await next();
			});
			app.use("/api/auth/*", csrfForRoutes());
			app.post("/api/auth/login", (c) => c.json({ success: true }));

			const response = await app.request("/api/auth/login", {
				method: "POST",
				headers: {
					Origin: "https://example.com",
				},
			});

			expect(response.status).toBe(200);
		});
	});
});
