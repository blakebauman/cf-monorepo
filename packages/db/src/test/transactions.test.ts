/**
 * Tests for transaction utilities
 */

import { describe, expect, it, vi } from "vitest";

import type { Database, Transaction } from "../repository/transactions";
import { withTransaction, withTransactionRetry } from "../repository/transactions";

describe("Transaction Utilities", () => {
	describe("withTransaction", () => {
		it("should execute function within transaction", async () => {
			const mockDb = {
				transaction: vi.fn((fn) => {
					const tx = {} as Transaction;
					return fn(tx);
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("result");

			const result = await withTransaction(mockDb, testFn);

			expect(mockDb.transaction).toHaveBeenCalledTimes(1);
			expect(testFn).toHaveBeenCalledTimes(1);
			expect(result).toBe("result");
		});

		it("should pass transaction to callback", async () => {
			let capturedTx: Transaction | null = null;
			const mockDb = {
				transaction: vi.fn((fn) => {
					const tx = { _isMockTx: true } as unknown as Transaction;
					return fn(tx);
				}),
			} as unknown as Database;

			await withTransaction(mockDb, async (tx) => {
				capturedTx = tx;
				return "result";
			});

			expect(capturedTx).toBeDefined();
			expect((capturedTx as unknown as { _isMockTx: boolean })._isMockTx).toBe(true);
		});

		it("should propagate errors from transaction", async () => {
			const mockDb = {
				transaction: vi.fn((fn) => {
					const tx = {} as Transaction;
					return fn(tx);
				}),
			} as unknown as Database;

			const testError = new Error("Transaction failed");
			const testFn = vi.fn().mockRejectedValue(testError);

			await expect(withTransaction(mockDb, testFn)).rejects.toThrow("Transaction failed");
		});

		it("should return value from transaction function", async () => {
			const mockDb = {
				transaction: vi.fn((fn) => {
					const tx = {} as Transaction;
					return fn(tx);
				}),
			} as unknown as Database;

			const result = await withTransaction(mockDb, async () => {
				return { id: 1, name: "test" };
			});

			expect(result).toEqual({ id: 1, name: "test" });
		});
	});

	describe("withTransactionRetry", () => {
		it("should execute function successfully on first try", async () => {
			const mockDb = {
				transaction: vi.fn((fn) => {
					const tx = {} as Transaction;
					return fn(tx);
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("success");

			const result = await withTransactionRetry(mockDb, testFn, { maxRetries: 3 });

			expect(testFn).toHaveBeenCalledTimes(1);
			expect(result).toBe("success");
		});

		it("should retry on failure and eventually succeed", async () => {
			let transactionCallCount = 0;
			const mockDb = {
				transaction: vi.fn((fn) => {
					transactionCallCount++;
					const tx = {} as Transaction;
					if (transactionCallCount < 3) {
						throw new Error("Temporary failure");
					}
					return fn(tx);
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("success");

			const result = await withTransactionRetry(mockDb, testFn, { maxRetries: 5, retryDelay: 1 });

			expect(mockDb.transaction).toHaveBeenCalledTimes(3);
			expect(result).toBe("success");
		});

		it("should throw after max attempts exceeded", async () => {
			const mockDb = {
				transaction: vi.fn(() => {
					throw new Error("Persistent failure");
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("success");

			await expect(
				withTransactionRetry(mockDb, testFn, { maxRetries: 3, retryDelay: 1 })
			).rejects.toThrow("Persistent failure");

			expect(mockDb.transaction).toHaveBeenCalledTimes(4); // maxRetries + 1 initial attempt
		});

		it("should use default max retries if not specified", async () => {
			const mockDb = {
				transaction: vi.fn(() => {
					throw new Error("Failure");
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("success");

			await expect(withTransactionRetry(mockDb, testFn, { retryDelay: 1 })).rejects.toThrow(
				"Failure"
			);

			// Default is 3 retries + 1 initial attempt = 4 total
			expect(mockDb.transaction).toHaveBeenCalledTimes(4);
		});

		it("should use default delay if not specified", async () => {
			let transactionCallCount = 0;
			const mockDb = {
				transaction: vi.fn((fn) => {
					transactionCallCount++;
					const tx = {} as Transaction;
					if (transactionCallCount < 2) {
						throw new Error("Temporary failure");
					}
					return fn(tx);
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("success");

			const startTime = Date.now();
			await withTransactionRetry(mockDb, testFn, { maxRetries: 3 });
			const duration = Date.now() - startTime;

			// Should have some delay (default is 100ms), but keep test fast
			expect(duration).toBeGreaterThanOrEqual(50);
		});

		it("should respect custom delay between retries", async () => {
			let transactionCallCount = 0;
			const mockDb = {
				transaction: vi.fn((fn) => {
					transactionCallCount++;
					const tx = {} as Transaction;
					if (transactionCallCount < 2) {
						throw new Error("Temporary failure");
					}
					return fn(tx);
				}),
			} as unknown as Database;

			const testFn = vi.fn().mockResolvedValue("success");

			const startTime = Date.now();
			await withTransactionRetry(mockDb, testFn, { maxRetries: 3, retryDelay: 50 });
			const duration = Date.now() - startTime;

			// Should have at least one delay of 50ms
			expect(duration).toBeGreaterThanOrEqual(40);
		});
	});
});
