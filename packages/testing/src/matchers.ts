/**
 * Custom Vitest matchers for Workers testing
 */

import { expect } from "vitest";

/**
 * Matcher result type for custom matchers
 */
interface MatcherResult {
	pass: boolean;
	message: () => string;
}

interface CustomMatchers<R = unknown> {
	toBeValidResponse(): R;
	toBeValidApiResponse(): R;
	toHaveSecurityHeaders(): R;
	toHaveCorsHeaders(): R;
	toBeWithinPerformanceBudget(maxMs: number): R;
	toMatchWorkerResponse(expected: Partial<Response>): R;
}

declare module "vitest" {
	// biome-ignore lint/suspicious/noExplicitAny: Vitest's Assertion interface uses any as default
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Validates that a response is properly formatted
 */
// biome-ignore lint/suspicious/noExplicitAny: Vitest matcher context requires any
function toBeValidResponse(this: any, received: Response): MatcherResult {
	const pass =
		received instanceof Response &&
		typeof received.status === "number" &&
		received.status >= 100 &&
		received.status < 600;

	return {
		pass,
		message: () =>
			pass
				? `Expected ${received} not to be a valid Response`
				: `Expected ${received} to be a valid Response`,
	};
}

/**
 * Validates that a response follows API response format
 */
// biome-ignore lint/suspicious/noExplicitAny: Vitest matcher context requires any
async function toBeValidApiResponse(this: any, received: Response): Promise<MatcherResult> {
	if (!(received instanceof Response)) {
		return {
			pass: false,
			message: () => `Expected ${received} to be a Response object`,
		};
	}

	let data: { success?: boolean; data?: unknown; error?: { code?: string; message?: string } };
	try {
		data = await received.clone().json();
	} catch {
		return {
			pass: false,
			message: () => `Expected ${received} to have valid JSON body`,
		};
	}

	const hasSuccess = typeof data.success === "boolean";

	// Check if data has the appropriate field based on success value
	let hasData = false;
	if (hasSuccess) {
		hasData = data.success ? "data" in data : "error" in data;
	}

	// Validate error structure if success is false
	const hasValidError =
		hasSuccess && !data.success
			? data.error !== undefined &&
				typeof data.error.code === "string" &&
				typeof data.error.message === "string"
			: true;

	const pass = hasSuccess && hasData && hasValidError;

	return {
		pass,
		message: () =>
			pass
				? `Expected ${JSON.stringify(data)} not to be a valid API response format`
				: `Expected ${JSON.stringify(data)} to be a valid API response format with success, data/error fields`,
	};
}

/**
 * Validates that a response has security headers
 */
// biome-ignore lint/suspicious/noExplicitAny: Vitest matcher context requires any
function toHaveSecurityHeaders(this: any, received: Response): MatcherResult {
	if (!(received instanceof Response)) {
		return {
			pass: false,
			message: () => `Expected ${received} to be a Response object`,
		};
	}

	const securityHeaders = [
		"X-Content-Type-Options",
		"X-Frame-Options",
		"X-XSS-Protection",
		"Strict-Transport-Security",
	];

	const missingHeaders = securityHeaders.filter((header) => !received.headers.has(header));

	const pass = missingHeaders.length === 0;

	return {
		pass,
		message: () =>
			pass
				? "Expected response not to have security headers"
				: `Expected response to have security headers. Missing: ${missingHeaders.join(", ")}`,
	};
}

/**
 * Validates that a response has CORS headers
 */
// biome-ignore lint/suspicious/noExplicitAny: Vitest matcher context requires any
function toHaveCorsHeaders(this: any, received: Response): MatcherResult {
	if (!(received instanceof Response)) {
		return {
			pass: false,
			message: () => `Expected ${received} to be a Response object`,
		};
	}

	const corsHeaders = [
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Headers",
	];

	const missingHeaders = corsHeaders.filter((header) => !received.headers.has(header));

	const pass = missingHeaders.length === 0;

	return {
		pass,
		message: () =>
			pass
				? "Expected response not to have CORS headers"
				: `Expected response to have CORS headers. Missing: ${missingHeaders.join(", ")}`,
	};
}

/**
 * Validates that an operation completed within performance budget
 */
// biome-ignore lint/suspicious/noExplicitAny: Vitest matcher context requires any
function toBeWithinPerformanceBudget(this: any, received: number, maxMs: number): MatcherResult {
	if (typeof received !== "number") {
		return {
			pass: false,
			message: () => `Expected ${received} to be a number (duration in ms)`,
		};
	}

	const pass = received <= maxMs;

	return {
		pass,
		message: () =>
			pass
				? `Expected operation (${received}ms) to exceed performance budget of ${maxMs}ms`
				: `Expected operation (${received}ms) to be within performance budget of ${maxMs}ms`,
	};
}

/**
 * Validates that a response matches expected properties
 */
function toMatchWorkerResponse(
	// biome-ignore lint/suspicious/noExplicitAny: Vitest matcher context requires any
	this: any,
	received: Response,
	expected: Partial<Response>
): MatcherResult {
	if (!(received instanceof Response)) {
		return {
			pass: false,
			message: () => `Expected ${received} to be a Response object`,
		};
	}

	const failures: string[] = [];

	if (expected.status !== undefined && received.status !== expected.status) {
		failures.push(`status: expected ${expected.status}, got ${received.status}`);
	}

	if (expected.statusText !== undefined && received.statusText !== expected.statusText) {
		failures.push(`statusText: expected ${expected.statusText}, got ${received.statusText}`);
	}

	// Check headers if provided
	if (expected.headers) {
		const expectedHeaders =
			expected.headers instanceof Headers ? expected.headers : new Headers(expected.headers);

		for (const [key, value] of expectedHeaders.entries()) {
			const receivedValue = received.headers.get(key);
			if (receivedValue !== value) {
				failures.push(`header ${key}: expected ${value}, got ${receivedValue}`);
			}
		}
	}

	const pass = failures.length === 0;

	return {
		pass,
		message: () =>
			pass
				? "Expected response not to match expected properties"
				: `Expected response to match expected properties. Failures:\n${failures.join("\n")}`,
	};
}

// Register the matchers
expect.extend({
	toBeValidResponse,
	toBeValidApiResponse,
	toHaveSecurityHeaders,
	toHaveCorsHeaders,
	toBeWithinPerformanceBudget,
	toMatchWorkerResponse,
});
