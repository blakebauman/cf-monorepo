/**
 * Tests for Request ID Middleware
 */

import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { requestId } from "../request-id";

describe("Request ID Middleware", () => {
	it("should generate a request ID if not provided", async () => {
		const app = new Hono();
		app.use("*", requestId());
		app.get("/", (c) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			return c.json({ requestId: (c as any).get("requestId") as string });
		});

		const response = await app.request("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Request-ID")).toBeTruthy();
		expect(response.headers.get("X-Request-ID")).toMatch(/^[\w-]+$/);

		const body = (await response.json()) as { requestId: string };
		expect(body.requestId).toBe(response.headers.get("X-Request-ID"));
	});

	it("should forward existing request ID from header", async () => {
		const app = new Hono();
		app.use("*", requestId());
		app.get("/", (c) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			return c.json({ requestId: (c as any).get("requestId") as string });
		});

		const existingId = "test-request-id-123";
		const response = await app.request("/", {
			headers: {
				"X-Request-ID": existingId,
			},
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Request-ID")).toBe(existingId);

		const body = (await response.json()) as { requestId: string };
		expect(body.requestId).toBe(existingId);
	});

	it("should store request ID in context for downstream use", async () => {
		const app = new Hono();
		app.use("*", requestId());
		app.get("/", (c) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			const id = (c as any).get("requestId") as string;
			expect(id).toBeTruthy();
			expect(typeof id).toBe("string");
			return c.json({ success: true });
		});

		const response = await app.request("/");
		expect(response.status).toBe(200);
	});

	it("should add request ID to response headers after processing", async () => {
		const app = new Hono();
		app.use("*", requestId());
		app.get("/", (c) => {
			// Simulate some processing
			c.header("X-Custom-Header", "test");
			return c.json({ data: "test" });
		});

		const response = await app.request("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("X-Request-ID")).toBeTruthy();
		expect(response.headers.get("X-Custom-Header")).toBe("test");
	});

	it("should generate unique IDs for different requests", async () => {
		const app = new Hono();
		app.use("*", requestId());
		app.get("/", (c) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			return c.json({ requestId: (c as any).get("requestId") as string });
		});

		const response1 = await app.request("/");
		const response2 = await app.request("/");

		const id1 = response1.headers.get("X-Request-ID");
		const id2 = response2.headers.get("X-Request-ID");

		expect(id1).toBeTruthy();
		expect(id2).toBeTruthy();
		expect(id1).not.toBe(id2);
	});

	it("should work with multiple routes", async () => {
		const app = new Hono();
		app.use("*", requestId());

		app.get("/users", (c) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			return c.json({ requestId: (c as any).get("requestId") as string });
		});
		app.post("/users", (c) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			return c.json({ requestId: (c as any).get("requestId") as string });
		});

		const getResponse = await app.request("/users");
		const postResponse = await app.request("/users", { method: "POST" });

		expect(getResponse.headers.get("X-Request-ID")).toBeTruthy();
		expect(postResponse.headers.get("X-Request-ID")).toBeTruthy();
		expect(getResponse.headers.get("X-Request-ID")).not.toBe(
			postResponse.headers.get("X-Request-ID")
		);
	});
});
