/**
 * Test helper utilities
 */

import { vi } from "vitest";

/**
 * Waits for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function until it succeeds or max attempts reached
 */
export async function retry<T>(fn: () => Promise<T>, maxAttempts = 3, delay = 100): Promise<T> {
	let attempts = 0;
	let lastError: Error | undefined;

	while (attempts < maxAttempts) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			attempts++;
			if (attempts < maxAttempts) {
				await wait(delay);
			}
		}
	}

	if (!lastError) {
		throw new Error("Retry failed but no error was captured");
	}
	throw lastError;
}

/**
 * Creates a test context with common setup
 */
export function createTestContext() {
	const mocks = {
		fetch: vi.fn(),
		console: {
			log: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		},
		Date: {
			now: vi.fn().mockReturnValue(new Date("2024-01-01T00:00:00Z").getTime()),
		},
	};

	return {
		mocks,
		cleanup: () => {
			vi.clearAllMocks();
		},
	};
}

/**
 * Validates HTTP response structure
 */
export function validateResponse(response: Response, expectedStatus: number) {
	expect(response.status).toBe(expectedStatus);
	expect(response.headers.get("Content-Type")).toContain("application/json");
}

/**
 * Validates API response format
 */
export async function validateApiResponse(response: Response, expectedSuccess = true) {
	validateResponse(response, expectedSuccess ? 200 : 400);

	const data = (await response.json()) as {
		success: boolean;
		data?: unknown;
		error?: { code: string; message: string };
	};
	expect(data).toHaveProperty("success", expectedSuccess);

	if (expectedSuccess) {
		expect(data).toHaveProperty("data");
	} else {
		expect(data).toHaveProperty("error");
		expect(data.error).toHaveProperty("code");
		expect(data.error).toHaveProperty("message");
	}

	return data;
}

/**
 * Tests rate limiting functionality
 *
 * @param makeRequest - Function that makes a request and returns a Response
 * @param limit - Maximum number of requests allowed before rate limiting
 * @param timeWindow - Time window in milliseconds for the rate limit (used for validation and documentation)
 *
 * @example
 * ```ts
 * // Basic rate limit test
 * await testRateLimit(() => fetch("/api/endpoint"), 10);
 *
 * // With custom time window
 * await testRateLimit(() => fetch("/api/endpoint"), 10, 60000); // 60 second window
 *
 * // With fake timers to test time-based reset
 * vi.useFakeTimers();
 * const responses = await testRateLimit(() => fetch("/api/endpoint"), 10, 60000);
 * vi.advanceTimersByTime(60001); // Advance past time window
 * const resetResponse = await fetch("/api/endpoint");
 * expect(resetResponse.status).toBe(200); // Should be allowed again
 * ```
 */
export async function testRateLimit(
	makeRequest: () => Promise<Response>,
	limit: number,
	timeWindow = 60000
) {
	// Validate time window is positive
	if (timeWindow <= 0) {
		throw new Error(`timeWindow must be positive, got ${timeWindow}`);
	}

	const responses: Response[] = [];

	// Make requests up to the limit
	for (let i = 0; i < limit; i++) {
		const response = await makeRequest();
		responses.push(response);
		expect(response.status).toBe(200);
	}

	// Next request should be rate limited
	const rateLimitedResponse = await makeRequest();
	expect(rateLimitedResponse.status).toBe(429);

	// Note: To test time-based rate limit reset, use fake timers in your test:
	// vi.useFakeTimers();
	// await testRateLimit(makeRequest, limit, timeWindow);
	// vi.advanceTimersByTime(timeWindow + 1);
	// const resetResponse = await makeRequest();
	// expect(resetResponse.status).toBe(200);

	return responses;
}

/**
 * Tests authentication middleware
 */
export async function testAuthMiddleware(makeRequest: (token?: string) => Promise<Response>) {
	// Test without token
	const unauthenticatedResponse = await makeRequest();
	expect(unauthenticatedResponse.status).toBe(401);

	// Test with invalid token
	const invalidTokenResponse = await makeRequest("invalid-token");
	expect(invalidTokenResponse.status).toBe(401);

	// Test with valid token
	const validTokenResponse = await makeRequest("valid-token");
	expect(validTokenResponse.status).toBe(200);
}

/**
 * Tests CORS headers
 */
export function testCorsHeaders(response: Response, origin = "*") {
	expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
	expect(response.headers.get("Access-Control-Allow-Methods")).toBeTruthy();
	expect(response.headers.get("Access-Control-Allow-Headers")).toBeTruthy();
}

/**
 * Tests security headers
 */
export function testSecurityHeaders(response: Response) {
	expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
	expect(response.headers.get("X-Frame-Options")).toBe("DENY");
	expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
	expect(response.headers.get("Strict-Transport-Security")).toBeTruthy();
}

/**
 * Performance testing helper
 */
export async function measurePerformance<T>(
	fn: () => Promise<T>,
	label = "operation"
): Promise<{ result: T; duration: number }> {
	const startTime = performance.now();
	const result = await fn();
	const endTime = performance.now();
	const duration = endTime - startTime;

	// biome-ignore lint/suspicious/noConsoleLog: Test helper for performance measurement
	console.log(`${label} took ${duration.toFixed(2)}ms`);

	return { result, duration };
}

/**
 * Memory usage testing helper
 */
export function measureMemory(label = "memory") {
	if (typeof performance !== "undefined" && "memory" in performance) {
		const memory = (
			performance as {
				memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
			}
		).memory;
		if (memory) {
			// biome-ignore lint/suspicious/noConsoleLog: Test helper for memory measurement
			console.log(`${label}:`, {
				used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
				total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
				limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
			});
		}
	}
}

/**
 * Database testing helper
 */
export function createDbTestHelper() {
	const queries: string[] = [];

	return {
		mockQuery: vi.fn().mockImplementation((sql: string) => {
			queries.push(sql);
			return Promise.resolve({ rows: [], rowCount: 0 });
		}),
		getQueries: () => queries,
		clearQueries: () => {
			queries.length = 0;
		},
		expectQuery: (expectedSql: string) => {
			expect(queries).toContain(expectedSql);
		},
	};
}

/**
 * Environment testing helper
 */
export function withMockEnv<T>(env: Record<string, string>, fn: () => T): T {
	const originalEnv = { ...process.env };

	try {
		Object.assign(process.env, env);
		return fn();
	} finally {
		process.env = originalEnv;
	}
}

/**
 * Worker testing helper
 */
export async function testWorkerHandler(
	handler: (
		request: Request,
		env: Record<string, unknown>,
		ctx: ExecutionContext
	) => Promise<Response>,
	request: Request,
	env: Record<string, unknown> = {},
	ctx: ExecutionContext = {} as ExecutionContext
) {
	try {
		const response = await handler(request, env, ctx);
		return response;
	} catch (error) {
		throw new Error(`Worker handler failed: ${error}`);
	}
}

/**
 * Snapshot testing helper for responses
 */
export async function snapshotResponse(response: Response) {
	const data = {
		status: response.status,
		statusText: response.statusText,
		headers: Object.fromEntries(response.headers.entries()),
		body: await response.text(),
	};

	expect(data).toMatchSnapshot();
}
