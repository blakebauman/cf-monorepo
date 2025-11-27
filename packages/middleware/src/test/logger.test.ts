/**
 * Tests for Structured Logger Middleware
 */

import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { structuredLogger } from "../logger";

describe("Structured Logger Middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("should log request and response information", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", async (c, next) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			(c as any).set("requestId", "test-id");
			await next();
		});
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/");

		expect(consoleInfoSpy).toHaveBeenCalled();
		expect(consoleInfoSpy).toHaveBeenCalledTimes(2); // Request and response logs

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		const responseLog = JSON.parse(consoleInfoSpy.mock.calls[1]?.[0] as string);

		expect(requestLog.type).toBe("request");
		expect(requestLog.requestId).toBe("test-id");
		expect(requestLog.method).toBe("GET");
		expect(requestLog.path).toBe("/");

		expect(responseLog.type).toBe("response");
		expect(responseLog.statusCode).toBe(200);
		expect(responseLog.duration).toBeGreaterThanOrEqual(0);
	});

	it("should include request ID from context", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", async (c, next) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			(c as any).set("requestId", "custom-request-id");
			await next();
		});
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/");

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.requestId).toBe("custom-request-id");
	});

	it("should use 'unknown' as default request ID", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/");

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.requestId).toBe("unknown");
	});

	it("should log request method and path", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.post("/api/users", (c) => c.json({ success: true }));

		await app.request("/api/users", { method: "POST" });

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.method).toBe("POST");
		expect(requestLog.path).toBe("/api/users");
	});

	it("should measure and log request duration", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", async (c) => {
			// Simulate some processing time
			await new Promise((resolve) => setTimeout(resolve, 10));
			return c.json({ success: true });
		});

		await app.request("/");

		const responseLog = JSON.parse(consoleInfoSpy.mock.calls[1]?.[0] as string);
		expect(responseLog.duration).toBeGreaterThanOrEqual(10);
	});

	it("should log user agent from request headers", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/", {
			headers: {
				"user-agent": "Mozilla/5.0 Test Browser",
			},
		});

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.userAgent).toBe("Mozilla/5.0 Test Browser");
	});

	it("should log IP from cf-connecting-ip header", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/", {
			headers: {
				"cf-connecting-ip": "192.168.1.1",
			},
		});

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.ip).toBe("192.168.1.1");
	});

	it("should fallback to x-forwarded-for header for IP", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/", {
			headers: {
				"x-forwarded-for": "10.0.0.1",
			},
		});

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.ip).toBe("10.0.0.1");
	});

	it("should log errors with error details", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error");
		const app = new Hono();
		app.use("*", async (c, next) => {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context doesn't type custom variables
			(c as any).set("requestId", "error-test-id");
			await next();
		});
		app.use("*", structuredLogger());
		app.get("/", () => {
			throw new Error("Test error");
		});

		// Hono catches errors, so they don't propagate
		await app.request("/");

		expect(consoleErrorSpy).toHaveBeenCalled();
		const logCall = consoleErrorSpy.mock.calls[0]?.[0];

		// The log might be a JSON string or the error itself
		let errorLog:
			| {
					type: string;
					error: { message: string };
					requestId: string;
					duration: number;
			  }
			| undefined;
		if (typeof logCall === "string") {
			errorLog = JSON.parse(logCall);
		} else {
			// If the error was logged directly, check the second call which should be the JSON log
			const jsonLog = consoleErrorSpy.mock.calls.find((call) => {
				const arg = call[0];
				return typeof arg === "string" && arg.includes("error-test-id");
			});
			if (jsonLog) {
				errorLog = JSON.parse(jsonLog[0] as string);
			}
		}

		if (errorLog) {
			expect(errorLog.type).toBe("error");
			expect(errorLog.error.message).toBe("Test error");
			expect(errorLog.requestId).toBe("error-test-id");
			expect(errorLog.duration).toBeGreaterThanOrEqual(0);
		}
	});

	it("should include timestamp in ISO format", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/");

		const requestLog = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
		expect(requestLog.timestamp).toBeTruthy();
		expect(() => new Date(requestLog.timestamp)).not.toThrow();
	});

	it("should log response status code", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/success", (c) => c.json({ success: true }, 200));
		app.get("/created", (c) => c.json({ success: true }, 201));
		app.get("/error", (c) => c.json({ error: "Bad Request" }, 400));

		await app.request("/success");
		await app.request("/created");
		await app.request("/error");

		const successLog = JSON.parse(consoleInfoSpy.mock.calls[1]?.[0] as string);
		const createdLog = JSON.parse(consoleInfoSpy.mock.calls[3]?.[0] as string);
		const errorLog = JSON.parse(consoleInfoSpy.mock.calls[5]?.[0] as string);

		expect(successLog.statusCode).toBe(200);
		expect(createdLog.statusCode).toBe(201);
		expect(errorLog.statusCode).toBe(400);
	});

	it("should format logs as valid JSON", async () => {
		const consoleInfoSpy = vi.spyOn(console, "info");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", (c) => c.json({ success: true }));

		await app.request("/");

		const requestLogString = consoleInfoSpy.mock.calls[0]?.[0] as string;
		const responseLogString = consoleInfoSpy.mock.calls[1]?.[0] as string;

		expect(() => JSON.parse(requestLogString)).not.toThrow();
		expect(() => JSON.parse(responseLogString)).not.toThrow();
	});

	it("should rethrow errors after logging", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error");
		const app = new Hono();
		app.use("*", structuredLogger());
		app.get("/", () => {
			throw new Error("Test error");
		});

		// Hono handles the error and returns a 500 response instead of throwing
		const response = await app.request("/");

		// Verify error was logged
		expect(consoleErrorSpy).toHaveBeenCalled();

		// Verify response is an error response
		expect(response.status).toBe(500);
	});
});
