/**
 * Tests for BaseRepository
 */

import type { SQL } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { BaseRepository } from "../repository/base-repository";
import type { Database } from "../repository/transactions";

// Create a test table schema
const testTable = pgTable("test_items", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

type TestItem = typeof testTable.$inferSelect;
type NewTestItem = typeof testTable.$inferInsert;

// Concrete implementation for testing
class TestRepository extends BaseRepository<TestItem> {
	constructor(db: Database) {
		super(db, testTable);
	}

	protected getIdColumn(): SQL {
		return testTable.id as unknown as SQL;
	}

	protected getDefaultOrderBy(): SQL {
		return testTable.createdAt as unknown as SQL;
	}
}

describe("BaseRepository", () => {
	describe("findById", () => {
		it("should return null when record not found", async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.findById(999);

			expect(result).toBeNull();
		});

		it("should return record when found", async () => {
			const mockItem: TestItem = {
				id: 1,
				name: "Test Item",
				description: "Test Description",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([mockItem]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.findById(1);

			expect(result).toEqual(mockItem);
		});
	});

	describe("findByIdOrThrow", () => {
		it("should throw NotFoundError when record not found", async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);

			await expect(repo.findByIdOrThrow(999, "Test Item")).rejects.toThrow("Test Item not found");
		});

		it("should return record when found", async () => {
			const mockItem: TestItem = {
				id: 1,
				name: "Test Item",
				description: "Test Description",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([mockItem]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.findByIdOrThrow(1);

			expect(result).toEqual(mockItem);
		});
	});

	describe("exists", () => {
		it("should return false when record does not exist", async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.exists(999);

			expect(result).toBe(false);
		});

		it("should return true when record exists", async () => {
			const mockItem: TestItem = {
				id: 1,
				name: "Test Item",
				description: "Test Description",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([mockItem]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.exists(1);

			expect(result).toBe(true);
		});
	});

	describe("count", () => {
		it("should return 0 for empty table", async () => {
			const mockSelect = { total: 0 };
			const mockDb = {
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						where: vi.fn().mockResolvedValue([mockSelect]),
					})),
				})),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.count();

			expect(result).toBe(0);
		});

		it("should return correct count", async () => {
			const mockSelect = { total: 42 };
			const mockQuery = vi.fn().mockResolvedValue([mockSelect]);
			const mockDb = {
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						where: mockQuery,
					})),
				})),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.count();

			expect(result).toBe(42);
		});

		it("should apply where clause when provided", async () => {
			const mockSelect = { total: 10 };
			const whereSpy = vi.fn().mockResolvedValue([mockSelect]);
			const mockDb = {
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						where: whereSpy,
					})),
				})),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.count(eq(testTable.name, "Test"));

			expect(result).toBe(10);
			expect(whereSpy).toHaveBeenCalled();
		});
	});

	describe("create", () => {
		it("should insert and return new record", async () => {
			const newItem: NewTestItem = {
				name: "New Item",
				description: "New Description",
			};

			const createdItem: TestItem = {
				id: 1,
				...newItem,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const valuesSpy = vi.fn(() => ({
				returning: vi.fn().mockResolvedValue([createdItem]),
			}));

			const insertSpy = vi.fn(() => ({
				values: valuesSpy,
			}));

			const mockDb = {
				insert: insertSpy,
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.create(newItem);

			expect(result).toEqual(createdItem);
			expect(insertSpy).toHaveBeenCalled();
			expect(valuesSpy).toHaveBeenCalledWith(newItem);
		});

		it("should throw DatabaseError when insert fails", async () => {
			const mockDb = {
				insert: vi.fn(() => ({
					values: vi.fn(() => ({
						returning: vi.fn().mockRejectedValue(new Error("Insert failed")),
					})),
				})),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);

			await expect(repo.create({ name: "Test", description: "Test" })).rejects.toThrow(
				"Failed to create record"
			);
		});
	});

	describe("createMany", () => {
		it("should insert multiple records and return them", async () => {
			const newItems: NewTestItem[] = [
				{ name: "Item 1", description: "Desc 1" },
				{ name: "Item 2", description: "Desc 2" },
			];

			const createdItems: TestItem[] = newItems.map((item, index) => ({
				id: index + 1,
				...item,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			let callCount = 0;
			const mockTx = {
				insert: vi.fn().mockReturnThis(),
				values: vi.fn().mockReturnThis(),
				returning: vi.fn().mockImplementation(async () => {
					const item = [createdItems[callCount]];
					callCount++;
					return item;
				}),
			};

			const mockDb = {
				transaction: vi.fn(async (fn) => fn(mockTx)),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.createMany(newItems);

			expect(result).toEqual(createdItems);
			expect(result).toHaveLength(2);
		});

		it("should return empty array for empty input", async () => {
			const mockTx = {
				insert: vi.fn().mockReturnThis(),
				values: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([]),
			};

			const mockDb = {
				transaction: vi.fn(async (fn) => fn(mockTx)),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.createMany([]);

			expect(result).toEqual([]);
		});
	});

	describe("update", () => {
		it("should update and return null when record not found", async () => {
			const mockDb = {
				update: vi.fn().mockReturnThis(),
				set: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.update(999, { name: "Updated" });

			expect(result).toBeNull();
		});

		it("should update and return updated record", async () => {
			const updatedItem: TestItem = {
				id: 1,
				name: "Updated Item",
				description: "Updated Description",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDb = {
				update: vi.fn().mockReturnThis(),
				set: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([updatedItem]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.update(1, { name: "Updated Item" });

			expect(result).toEqual(updatedItem);
		});
	});

	describe("delete", () => {
		it("should delete and return true when record exists", async () => {
			const deletedItem: TestItem = {
				id: 1,
				name: "Deleted Item",
				description: "Deleted Description",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([deletedItem]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.delete(1);

			expect(result).toBe(true);
		});

		it("should return false when record not found", async () => {
			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([]),
			} as unknown as Database;

			const repo = new TestRepository(mockDb);
			const result = await repo.delete(999);

			expect(result).toBe(false);
		});
	});
});
