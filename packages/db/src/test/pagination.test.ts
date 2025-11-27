/**
 * Tests for pagination utilities
 */

import { describe, expect, it } from "vitest";

import { calculateOffset, createPaginationMetadata } from "../repository/pagination";

describe("Pagination Utilities", () => {
	describe("calculateOffset", () => {
		it("should calculate correct offset for first page", () => {
			expect(calculateOffset(1, 10)).toBe(0);
		});

		it("should calculate correct offset for subsequent pages", () => {
			expect(calculateOffset(2, 10)).toBe(10);
			expect(calculateOffset(3, 10)).toBe(20);
			expect(calculateOffset(5, 20)).toBe(80);
		});

		it("should handle different page sizes", () => {
			expect(calculateOffset(1, 25)).toBe(0);
			expect(calculateOffset(2, 25)).toBe(25);
			expect(calculateOffset(3, 50)).toBe(100);
		});

		it("should handle page 0", () => {
			// calculateOffset does (page - 1) * limit, so page 0 gives -10
			expect(calculateOffset(0, 10)).toBe(-10);
		});

		it("should handle negative page numbers", () => {
			// calculateOffset does (page - 1) * limit, so negative pages give negative offsets
			expect(calculateOffset(-1, 10)).toBe(-20);
			expect(calculateOffset(-5, 10)).toBe(-60);
		});
	});

	describe("createPaginationMetadata", () => {
		it("should create correct metadata for first page", () => {
			const meta = createPaginationMetadata(100, { page: 1, limit: 10 });

			expect(meta).toEqual({
				page: 1,
				limit: 10,
				total: 100,
				totalPages: 10,
				hasNextPage: true,
				hasPreviousPage: false,
			});
		});

		it("should create correct metadata for middle page", () => {
			const meta = createPaginationMetadata(100, { page: 5, limit: 10 });

			expect(meta).toEqual({
				page: 5,
				limit: 10,
				total: 100,
				totalPages: 10,
				hasNextPage: true,
				hasPreviousPage: true,
			});
		});

		it("should create correct metadata for last page", () => {
			const meta = createPaginationMetadata(100, { page: 10, limit: 10 });

			expect(meta).toEqual({
				page: 10,
				limit: 10,
				total: 100,
				totalPages: 10,
				hasNextPage: false,
				hasPreviousPage: true,
			});
		});

		it("should handle partial last page", () => {
			const meta = createPaginationMetadata(25, { page: 3, limit: 10 });

			expect(meta).toEqual({
				page: 3,
				limit: 10,
				total: 25,
				totalPages: 3,
				hasNextPage: false,
				hasPreviousPage: true,
			});
		});

		it("should handle empty results", () => {
			const meta = createPaginationMetadata(0, { page: 1, limit: 10 });

			expect(meta).toEqual({
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0,
				hasNextPage: false,
				hasPreviousPage: false,
			});
		});

		it("should handle single item", () => {
			const meta = createPaginationMetadata(1, { page: 1, limit: 10 });

			expect(meta).toEqual({
				page: 1,
				limit: 10,
				total: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPreviousPage: false,
			});
		});

		it("should handle exact page boundary", () => {
			const meta = createPaginationMetadata(20, { page: 2, limit: 10 });

			expect(meta).toEqual({
				page: 2,
				limit: 10,
				total: 20,
				totalPages: 2,
				hasNextPage: false,
				hasPreviousPage: true,
			});
		});

		it("should throw error for page 0", () => {
			expect(() => createPaginationMetadata(100, { page: 0, limit: 10 })).toThrow(
				"Page must be greater than 0"
			);
		});

		it("should throw error for negative page", () => {
			expect(() => createPaginationMetadata(100, { page: -5, limit: 10 })).toThrow(
				"Page must be greater than 0"
			);
		});

		it("should handle large datasets", () => {
			const meta = createPaginationMetadata(10000, { page: 50, limit: 100 });

			expect(meta).toEqual({
				page: 50,
				limit: 100,
				total: 10000,
				totalPages: 100,
				hasNextPage: true,
				hasPreviousPage: true,
			});
		});
	});
});
