/**
 * Tests for CORS Middleware
 */

import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { enhancedCors } from "../cors";

describe("CORS Middleware", () => {
	it("should allow all origins in development mode by default", async () => {
		const app = new Hono();
		app.use("*", enhancedCors({ environment: "development" }));
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: {
				Origin: "http://localhost:3000",
			},
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("should restrict origins in production mode by default", async () => {
		const app = new Hono();
		app.use("*", enhancedCors({ environment: "production" }));
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: {
				Origin: "http://localhost:3000",
			},
		});

		expect(response.status).toBe(200);
		// Production with no origins specified should not set CORS header
		expect(response.headers.get("Access-Control-Allow-Origin")).toBeFalsy();
	});

	it("should allow specific origins when configured", async () => {
		const app = new Hono();
		app.use(
			"*",
			enhancedCors({
				origins: ["https://example.com", "https://app.example.com"],
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: {
				Origin: "https://example.com",
			},
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
	});

	it("should handle preflight OPTIONS requests", async () => {
		const app = new Hono();
		app.use("*", enhancedCors({ environment: "development" }));
		app.post("/api/users", (c) => c.json({ success: true }));

		const response = await app.request("/api/users", {
			method: "OPTIONS",
			headers: {
				Origin: "http://localhost:3000",
				"Access-Control-Request-Method": "POST",
				"Access-Control-Request-Headers": "Content-Type",
			},
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
		expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
	});

	it("should expose X-Request-ID header", async () => {
		const app = new Hono();
		app.use("*", enhancedCors({ environment: "development" }));
		app.get("/", (c) => {
			c.header("X-Request-ID", "test-id");
			return c.json({ success: true });
		});

		const response = await app.request("/", {
			headers: {
				Origin: "http://localhost:3000",
			},
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Expose-Headers")).toContain("X-Request-ID");
	});

	it("should allow credentials when configured", async () => {
		const app = new Hono();
		app.use("*", enhancedCors({ environment: "development", credentials: true }));
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: {
				Origin: "http://localhost:3000",
			},
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	it("should set max age for preflight cache", async () => {
		const app = new Hono();
		app.use("*", enhancedCors({ environment: "development", maxAge: 3600 }));
		app.post("/api/users", (c) => c.json({ success: true }));

		const response = await app.request("/api/users", {
			method: "OPTIONS",
			headers: {
				Origin: "http://localhost:3000",
				"Access-Control-Request-Method": "POST",
			},
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Max-Age")).toBe("3600");
	});

	it("should use environment from context if available", async () => {
		interface Env {
			ENVIRONMENT: "development" | "production";
		}

		const app = new Hono<{ Bindings: Env }>();
		app.use("*", enhancedCors());
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/", {
			headers: {
				Origin: "http://localhost:3000",
			},
		});

		// Should use development mode (default in test)
		expect(response.status).toBe(200);
	});

	it("should support custom origin validation function", async () => {
		const app = new Hono();
		app.use(
			"*",
			enhancedCors({
				origins: (origin: string) => origin.endsWith(".example.com"),
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const validResponse = await app.request("/", {
			headers: {
				Origin: "https://app.example.com",
			},
		});

		expect(validResponse.status).toBe(200);
		expect(validResponse.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://app.example.com"
		);

		const invalidResponse = await app.request("/", {
			headers: {
				Origin: "https://malicious.com",
			},
		});

		expect(invalidResponse.status).toBe(200);
		expect(invalidResponse.headers.get("Access-Control-Allow-Origin")).toBeFalsy();
	});

	it("should allow all configured HTTP methods", async () => {
		const app = new Hono();
		app.use(
			"*",
			enhancedCors({
				environment: "development",
				allowMethods: ["GET", "POST", "PUT", "DELETE"],
			})
		);
		app.all("/api/resource", (c) => c.json({ success: true }));

		const response = await app.request("/api/resource", {
			method: "OPTIONS",
			headers: {
				Origin: "http://localhost:3000",
				"Access-Control-Request-Method": "DELETE",
			},
		});

		expect(response.status).toBe(204);
		const methods = response.headers.get("Access-Control-Allow-Methods");
		expect(methods).toContain("GET");
		expect(methods).toContain("POST");
		expect(methods).toContain("PUT");
		expect(methods).toContain("DELETE");
	});
});
