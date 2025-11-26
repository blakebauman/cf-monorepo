/**
 * Mock utilities for testing Workers and shared packages
 */

import type { Env } from "@cf-monorepo/types";
import { vi } from "vitest";

/**
 * Creates a mock Cloudflare Workers environment
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
	return {
		ENVIRONMENT: "test",
		BETTER_AUTH_SECRET: "test-secret-key-for-testing-purposes-only",
		BETTER_AUTH_URL: "http://localhost:8787",
		DATABASE_URL: "postgresql://test:test@localhost:5432/test",
		HYPERDRIVE: createMockHyperdrive(),
		...overrides,
	} as Env;
}

/**
 * Creates a mock Hyperdrive binding
 */
export function createMockHyperdrive() {
	return {
		connect: vi.fn().mockResolvedValue({
			query: vi.fn(),
			end: vi.fn(),
		}),
	};
}

/**
 * Creates a mock KV namespace
 */
export function createMockKV() {
	const storage = new Map<string, string>();

	return {
		get: vi.fn().mockImplementation(async (key: string) => {
			return storage.get(key) || null;
		}),
		put: vi.fn().mockImplementation(async (key: string, value: string) => {
			storage.set(key, value);
		}),
		delete: vi.fn().mockImplementation(async (key: string) => {
			storage.delete(key);
		}),
		list: vi.fn().mockImplementation(async () => {
			return {
				keys: Array.from(storage.keys()).map((key) => ({ name: key })),
				list_complete: true,
			};
		}),
	};
}

/**
 * Creates a mock R2 bucket
 */
export function createMockR2() {
	const storage = new Map<string, ArrayBuffer>();

	return {
		get: vi.fn().mockImplementation(async (key: string) => {
			const data = storage.get(key);
			return data
				? {
						body: new ReadableStream({
							start(controller) {
								controller.enqueue(new Uint8Array(data));
								controller.close();
							},
						}),
						arrayBuffer: () => Promise.resolve(data),
						text: () => Promise.resolve(new TextDecoder().decode(data)),
						json: () => Promise.resolve(JSON.parse(new TextDecoder().decode(data))),
					}
				: null;
		}),
		put: vi.fn().mockImplementation(async (key: string, value: ArrayBuffer) => {
			storage.set(key, value);
		}),
		delete: vi.fn().mockImplementation(async (key: string) => {
			storage.delete(key);
		}),
		list: vi.fn().mockImplementation(async () => {
			return {
				objects: Array.from(storage.keys()).map((key) => ({ key })),
				truncated: false,
			};
		}),
	};
}

/**
 * Creates a mock D1 database
 */
export function createMockD1() {
	return {
		prepare: vi.fn().mockReturnValue({
			bind: vi.fn().mockReturnThis(),
			first: vi.fn().mockResolvedValue({}),
			all: vi.fn().mockResolvedValue({ results: [], meta: {} }),
			run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
		}),
		batch: vi.fn().mockResolvedValue([]),
		exec: vi.fn().mockResolvedValue({ results: [], meta: {} }),
	};
}

/**
 * Creates a mock ExecutionContext
 */
export function createMockExecutionContext() {
	const promises: Promise<unknown>[] = [];

	return {
		waitUntil: vi.fn().mockImplementation((promise: Promise<unknown>) => {
			promises.push(promise);
		}),
		passThroughOnException: vi.fn(),
		_promises: promises, // For testing purposes
	};
}

/**
 * Creates a mock Request object
 */
export function createMockRequest(url = "http://localhost:8787", init: RequestInit = {}): Request {
	return new Request(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "test-agent",
		},
		...init,
	});
}

/**
 * Creates a mock Response object
 */
export function createMockResponse(body?: BodyInit, init: ResponseInit = {}): Response {
	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": "application/json",
		},
		...init,
	});
}

/**
 * Mock implementation for fetch that can be customized
 *
 * @param customHandler - Optional function to customize responses based on URL/method
 * @returns A mock fetch function that can be further customized with vi.fn() methods
 *
 * @example
 * ```ts
 * const mockFetch = createMockFetch((input) => {
 *   const url = typeof input === "string" ? input : input.url;
 *   if (url.includes("/api/users")) {
 *     return createMockResponse(JSON.stringify({ users: [] }), { status: 200 });
 *   }
 *   return createMockResponse(JSON.stringify({ error: "Not found" }), { status: 404 });
 * });
 * ```
 */
export function createMockFetch(
	customHandler?: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>
) {
	return vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
		// If custom handler provided, use it
		if (customHandler) {
			const response = await customHandler(input, init);
			return response;
		}

		// Default successful response
		return createMockResponse(JSON.stringify({ success: true, data: null }), { status: 200 });
	});
}

/**
 * Creates mock timers for testing time-dependent code
 */
export function createMockTimers() {
	return {
		setTimeout: vi.fn().mockImplementation((fn: () => void, ms: number) => {
			return setTimeout(fn, ms);
		}),
		clearTimeout: vi.fn().mockImplementation(clearTimeout),
		setInterval: vi.fn().mockImplementation((fn: () => void, ms: number) => {
			return setInterval(fn, ms);
		}),
		clearInterval: vi.fn().mockImplementation(clearInterval),
		Date: {
			now: vi.fn().mockReturnValue(Date.now()),
		},
	};
}

/**
 * Creates a complete mock environment for Workers testing
 */
export function createMockWorkerEnvironment(envOverrides: Partial<Env> = {}) {
	const env = createMockEnv(envOverrides);
	const ctx = createMockExecutionContext();
	const fetch = createMockFetch();

	return {
		env,
		ctx,
		fetch,
		request: createMockRequest(),
		response: createMockResponse(),
	};
}
