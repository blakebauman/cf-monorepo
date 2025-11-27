/**
 * Tests for Security Headers Middleware
 */

import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { securityHeaders } from "../security";

describe("Security Headers Middleware", () => {
	it("should add default security headers", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
		expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
	});

	it("should set Content Security Policy headers", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		const csp = response.headers.get("Content-Security-Policy");
		expect(csp).toBeTruthy();
		expect(csp).toContain("default-src 'self'");
	});

	it("should allow custom frame options", async () => {
		const app = new Hono();
		app.use("*", securityHeaders({ frameOptions: "SAMEORIGIN" }));
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
	});

	it("should allow custom CSP configuration", async () => {
		const app = new Hono();
		app.use(
			"*",
			securityHeaders({
				contentSecurityPolicy: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'", "https://cdn.example.com"],
					styleSrc: ["'self'", "'unsafe-inline'"],
				},
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		const csp = response.headers.get("Content-Security-Policy");
		expect(csp).toContain("script-src 'self' https://cdn.example.com");
		expect(csp).toContain("style-src 'self' 'unsafe-inline'");
	});

	it("should set Permissions-Policy headers", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		const permissionsPolicy = response.headers.get("Permissions-Policy");
		expect(permissionsPolicy).toBeTruthy();
	});

	it("should set HSTS header with includeSubDomains", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		const hsts = response.headers.get("Strict-Transport-Security");
		expect(hsts).toContain("max-age=31536000");
		expect(hsts).toContain("includeSubDomains");
	});

	it("should allow custom HSTS configuration", async () => {
		const app = new Hono();
		app.use(
			"*",
			securityHeaders({
				strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
			})
		);
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		const hsts = response.headers.get("Strict-Transport-Security");
		expect(hsts).toContain("max-age=63072000");
		expect(hsts).toContain("preload");
	});

	it("should allow custom referrer policy", async () => {
		const app = new Hono();
		app.use("*", securityHeaders({ referrerPolicy: "no-referrer" }));
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
	});

	it("should work with multiple routes", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());

		app.get("/public", (c) => c.json({ public: true }));
		app.get("/admin", (c) => c.json({ admin: true }));

		const publicResponse = await app.request("/public");
		const adminResponse = await app.request("/admin");

		expect(publicResponse.headers.get("X-Frame-Options")).toBe("DENY");
		expect(adminResponse.headers.get("X-Frame-Options")).toBe("DENY");
	});

	it("should apply headers to error responses", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/error", (c) => {
			return c.json({ error: "Something went wrong" }, 500);
		});

		const response = await app.request("/error");

		expect(response.status).toBe(500);
		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
	});

	it("should set X-Content-Type-Options to prevent MIME sniffing", async () => {
		const app = new Hono();
		app.use("*", securityHeaders());
		app.get("/", (c) => c.json({ success: true }));

		const response = await app.request("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
	});
});
