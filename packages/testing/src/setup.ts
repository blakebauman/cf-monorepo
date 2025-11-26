/**
 * Test setup utilities and global configuration
 */

import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import "./matchers"; // Register custom matchers

/**
 * Global test setup configuration
 */
export interface TestSetupOptions {
	/** Whether to mock console methods */
	mockConsole?: boolean;
	/** Whether to mock timers */
	mockTimers?: boolean;
	/** Whether to mock fetch */
	mockFetch?: boolean;
	/** Global timeout for tests in ms */
	testTimeout?: number;
	/** Whether to clear mocks before each test */
	clearMocksBetweenTests?: boolean;
}

/**
 * Sets up global test environment
 */
export function setupTestEnvironment(options: TestSetupOptions = {}) {
	const {
		mockConsole = false,
		mockTimers = false,
		mockFetch = true,
		testTimeout = 30000,
		clearMocksBetweenTests = true,
	} = options;

	// Set global test timeout
	beforeAll(() => {
		vi.setConfig({ testTimeout });
	});

	// Mock console if requested
	if (mockConsole) {
		beforeAll(() => {
			vi.stubGlobal("console", {
				log: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				info: vi.fn(),
				debug: vi.fn(),
			});
		});
	}

	// Mock timers if requested
	if (mockTimers) {
		beforeAll(() => {
			vi.useFakeTimers();
		});

		afterAll(() => {
			vi.useRealTimers();
		});
	}

	// Mock fetch if requested
	if (mockFetch) {
		beforeAll(() => {
			global.fetch = vi.fn().mockImplementation(async () => {
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			});
		});
	}

	// Clear mocks between tests
	if (clearMocksBetweenTests) {
		beforeEach(() => {
			vi.clearAllMocks();
		});
	}

	// Global cleanup
	afterAll(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});
}

/**
 * Sets up database testing environment
 */
export function setupDatabaseTests() {
	// Mock database connection
	beforeEach(() => {
		vi.stubGlobal("db", {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			}),
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([{}]),
				}),
			}),
			update: vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{}]),
					}),
				}),
			}),
			delete: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue({}),
			}),
			transaction: vi.fn().mockImplementation(async (fn) => {
				return await fn({
					select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([]) }),
					insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
					update: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue({}) }),
					delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
				});
			}),
		});
	});
}

/**
 * Sets up authentication testing environment
 */
export function setupAuthTests() {
	beforeEach(() => {
		vi.stubGlobal("auth", {
			api: {
				getSession: vi.fn().mockResolvedValue(null),
				signIn: vi.fn().mockResolvedValue({ session: {}, user: {} }),
				signOut: vi.fn().mockResolvedValue({}),
				signUp: vi.fn().mockResolvedValue({ user: {} }),
			},
			handler: vi.fn().mockImplementation(async () => {
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}),
		});
	});
}

/**
 * Sets up Workers environment testing
 */
export function setupWorkersTests() {
	beforeEach(() => {
		// Mock Workers globals
		vi.stubGlobal(
			"Request",
			class MockRequest extends Request {
				constructor(input: RequestInfo | URL, init?: RequestInit) {
					super(typeof input === "string" ? input : input.toString(), init);
				}
			}
		);

		vi.stubGlobal("Response", class MockResponse extends Response {});

		vi.stubGlobal("Headers", class MockHeaders extends Headers {});
	});
}

/**
 * Sets up performance testing environment
 */
export function setupPerformanceTests() {
	beforeEach(() => {
		// Mock performance API
		vi.stubGlobal("performance", {
			now: vi.fn().mockReturnValue(Date.now()),
			mark: vi.fn(),
			measure: vi.fn(),
			getEntriesByType: vi.fn().mockReturnValue([]),
			memory: {
				usedJSHeapSize: 1024 * 1024, // 1MB
				totalJSHeapSize: 2 * 1024 * 1024, // 2MB
				jsHeapSizeLimit: 4 * 1024 * 1024, // 4MB
			},
		});
	});
}

/**
 * Sets up security testing environment
 */
export function setupSecurityTests() {
	beforeEach(() => {
		// Mock crypto API
		vi.stubGlobal("crypto", {
			getRandomValues: vi.fn().mockImplementation((array) => {
				for (let i = 0; i < array.length; i++) {
					array[i] = Math.floor(Math.random() * 256);
				}
				return array;
			}),
			randomUUID: vi.fn().mockReturnValue("550e8400-e29b-41d4-a716-446655440000"),
			subtle: {
				digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
				sign: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
				verify: vi.fn().mockResolvedValue(true),
			},
		});
	});
}

/**
 * Complete test environment setup with all features
 */
export function setupFullTestEnvironment() {
	setupTestEnvironment();
	setupDatabaseTests();
	setupAuthTests();
	setupWorkersTests();
	setupPerformanceTests();
	setupSecurityTests();
}
