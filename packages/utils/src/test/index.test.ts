/**
 * Tests for utility functions
 */

import { describe, expect, it } from "vitest";

import {
	errorResponse,
	isValidEmail,
	paginatedResponse,
	safeJsonParse,
	successResponse,
} from "../index";

describe("Utility Functions", () => {
	describe("successResponse", () => {
		it("should create a successful response with data", () => {
			const data = { id: 1, name: "Test" };
			const response = successResponse(data);

			expect(response).toEqual({
				success: true,
				data,
			});
		});

		it("should include optional message", () => {
			const data = { id: 1 };
			const response = successResponse(data, "Operation successful");

			expect(response).toEqual({
				success: true,
				data,
				message: "Operation successful",
			});
		});

		it("should handle null data", () => {
			const response = successResponse(null);

			expect(response).toEqual({
				success: true,
				data: null,
			});
		});

		it("should handle array data", () => {
			const data = [1, 2, 3];
			const response = successResponse(data);

			expect(response).toEqual({
				success: true,
				data,
			});
		});
	});

	describe("errorResponse", () => {
		it("should create an error response", () => {
			const response = errorResponse("VALIDATION_ERROR");

			expect(response).toEqual({
				success: false,
				error: "VALIDATION_ERROR",
			});
		});

		it("should include optional message", () => {
			const response = errorResponse("NOT_FOUND", "Resource not found");

			expect(response).toEqual({
				success: false,
				error: "NOT_FOUND",
				message: "Resource not found",
			});
		});

		it("should handle different error codes", () => {
			const errors = ["AUTH_ERROR", "SERVER_ERROR", "RATE_LIMIT_ERROR"];

			for (const error of errors) {
				const response = errorResponse(error);
				expect(response.success).toBe(false);
				expect(response.error).toBe(error);
			}
		});
	});

	describe("paginatedResponse", () => {
		it("should create a paginated response", () => {
			const data = [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			];
			const response = paginatedResponse(data, 1, 10, 25);

			expect(response).toEqual({
				success: true,
				data,
				pagination: {
					page: 1,
					limit: 10,
					total: 25,
					totalPages: 3,
				},
			});
		});

		it("should calculate total pages correctly", () => {
			const data = [1, 2, 3, 4, 5];

			// 25 items, 10 per page = 3 pages
			const response1 = paginatedResponse(data, 1, 10, 25);
			expect(response1.pagination.totalPages).toBe(3);

			// 30 items, 10 per page = 3 pages
			const response2 = paginatedResponse(data, 1, 10, 30);
			expect(response2.pagination.totalPages).toBe(3);

			// 31 items, 10 per page = 4 pages
			const response3 = paginatedResponse(data, 1, 10, 31);
			expect(response3.pagination.totalPages).toBe(4);
		});

		it("should handle empty data arrays", () => {
			const response = paginatedResponse([], 1, 10, 0);

			expect(response).toEqual({
				success: true,
				data: [],
				pagination: {
					page: 1,
					limit: 10,
					total: 0,
					totalPages: 0,
				},
			});
		});

		it("should handle different page numbers", () => {
			const data = [{ id: 1 }];

			const response1 = paginatedResponse(data, 1, 10, 100);
			expect(response1.pagination.page).toBe(1);

			const response2 = paginatedResponse(data, 5, 10, 100);
			expect(response2.pagination.page).toBe(5);
		});

		it("should handle different page sizes", () => {
			const data = Array.from({ length: 20 }, (_, i) => ({ id: i }));

			const response1 = paginatedResponse(data, 1, 20, 100);
			expect(response1.pagination.totalPages).toBe(5); // 100 / 20 = 5

			const response2 = paginatedResponse(data, 1, 25, 100);
			expect(response2.pagination.totalPages).toBe(4); // 100 / 25 = 4
		});
	});

	describe("safeJsonParse", () => {
		it("should parse valid JSON", () => {
			const json = '{"name":"Test","value":123}';
			const result = safeJsonParse(json, {});

			expect(result).toEqual({ name: "Test", value: 123 });
		});

		it("should return fallback for invalid JSON", () => {
			const json = "invalid json";
			const fallback = { default: true };
			const result = safeJsonParse(json, fallback);

			expect(result).toEqual(fallback);
		});

		it("should handle empty strings", () => {
			const result = safeJsonParse("", { default: true });
			expect(result).toEqual({ default: true });
		});

		it("should parse arrays", () => {
			const json = "[1,2,3,4,5]";
			const result = safeJsonParse<number[]>(json, []);

			expect(result).toEqual([1, 2, 3, 4, 5]);
		});

		it("should parse null", () => {
			const json = "null";
			const result = safeJsonParse(json, { fallback: true });

			expect(result).toBeNull();
		});

		it("should parse booleans", () => {
			const trueResult = safeJsonParse("true", false);
			const falseResult = safeJsonParse("false", true);

			expect(trueResult).toBe(true);
			expect(falseResult).toBe(false);
		});

		it("should parse numbers", () => {
			const result = safeJsonParse<number>("42", 0);
			expect(result).toBe(42);
		});

		it("should handle nested objects", () => {
			const json = '{"user":{"name":"Test","nested":{"value":true}}}';
			const result = safeJsonParse(json, {});

			expect(result).toEqual({
				user: {
					name: "Test",
					nested: {
						value: true,
					},
				},
			});
		});
	});

	describe("isValidEmail", () => {
		it("should validate correct email addresses", () => {
			const validEmails = [
				"test@example.com",
				"user.name@example.com",
				"user+tag@example.co.uk",
				"user_name@example-domain.com",
				"123@example.com",
			];

			for (const email of validEmails) {
				expect(isValidEmail(email)).toBe(true);
			}
		});

		it("should reject invalid email addresses", () => {
			const invalidEmails = [
				"",
				"invalid",
				"@example.com",
				"user@",
				"user @example.com",
				"user@example",
				"user@.com",
				// Note: "user..name@example.com" passes the simple regex validation
				// though it's technically invalid per RFC 5322
			];

			for (const email of invalidEmails) {
				expect(isValidEmail(email)).toBe(false);
			}
		});

		it("should handle edge cases", () => {
			expect(isValidEmail("a@b.c")).toBe(true);
			expect(isValidEmail("a@b")).toBe(false);
			expect(isValidEmail("@.")).toBe(false);
		});

		it("should reject emails with spaces", () => {
			expect(isValidEmail("user name@example.com")).toBe(false);
			expect(isValidEmail("user@exam ple.com")).toBe(false);
		});

		it("should reject emails without @ symbol", () => {
			expect(isValidEmail("userexample.com")).toBe(false);
		});

		it("should reject emails without domain", () => {
			expect(isValidEmail("user@")).toBe(false);
			expect(isValidEmail("user@.")).toBe(false);
		});
	});
});
