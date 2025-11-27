/**
 * Tests for validation helpers
 */

import { z } from "@hono/zod-openapi";
import { ValidationError } from "@repo/errors";
import { describe, expect, it } from "vitest";
import {
	allValid,
	parseOrNull,
	parseOrThrow,
	validate,
	validateBatch,
} from "../src/helpers/validation";

describe("Validation Helpers", () => {
	const UserSchema = z.object({
		name: z.string().min(1),
		email: z.string().email(),
		age: z.number().int().positive(),
	});

	describe("parseOrThrow", () => {
		it("should parse valid data", () => {
			const data = { name: "John", email: "john@example.com", age: 30 };
			const result = parseOrThrow(UserSchema, data);

			expect(result).toEqual(data);
		});

		it("should throw ValidationError on invalid data", () => {
			const data = { name: "", email: "invalid", age: -1 };

			expect(() => parseOrThrow(UserSchema, data)).toThrow(ValidationError);
		});

		it("should include field information in error", () => {
			const data = { name: "John", email: "invalid", age: 30 };

			try {
				parseOrThrow(UserSchema, data);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ValidationError);
				if (error instanceof ValidationError) {
					expect(error.context).toHaveProperty("errors");
					const errors = error.context?.errors as Array<{ field: string; message: string }>;
					expect(errors.some((e) => e.field === "email")).toBe(true);
				}
			}
		});
	});

	describe("parseOrNull", () => {
		it("should parse valid data", () => {
			const data = { name: "John", email: "john@example.com", age: 30 };
			const result = parseOrNull(UserSchema, data);

			expect(result).toEqual(data);
		});

		it("should return null on invalid data", () => {
			const data = { name: "", email: "invalid", age: -1 };
			const result = parseOrNull(UserSchema, data);

			expect(result).toBeNull();
		});
	});

	describe("validate", () => {
		it("should return success with valid data", () => {
			const data = { name: "John", email: "john@example.com", age: 30 };
			const result = validate(UserSchema, data);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(data);
			}
		});

		it("should return errors with invalid data", () => {
			const data = { name: "", email: "invalid", age: -1 };
			const result = validate(UserSchema, data);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toHaveLength(3);
				expect(result.errors.some((e) => e.field === "name")).toBe(true);
				expect(result.errors.some((e) => e.field === "email")).toBe(true);
				expect(result.errors.some((e) => e.field === "age")).toBe(true);
			}
		});

		it("should include error messages", () => {
			const data = { name: "", email: "invalid", age: -1 };
			const result = validate(UserSchema, data);

			if (!result.success) {
				const emailError = result.errors.find((e) => e.field === "email");
				expect(emailError?.message).toBeTruthy();
			}
		});
	});

	describe("validateBatch", () => {
		it("should validate multiple items", () => {
			const items = [
				{ name: "John", email: "john@example.com", age: 30 },
				{ name: "Jane", email: "jane@example.com", age: 25 },
			];

			const results = validateBatch(UserSchema, items);

			expect(results).toHaveLength(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
		});

		it("should identify invalid items", () => {
			const items = [
				{ name: "John", email: "john@example.com", age: 30 },
				{ name: "", email: "invalid", age: -1 },
				{ name: "Jane", email: "jane@example.com", age: 25 },
			];

			const results = validateBatch(UserSchema, items);

			expect(results).toHaveLength(3);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(false);
			expect(results[2].success).toBe(true);
		});
	});

	describe("allValid", () => {
		it("should return true when all items are valid", () => {
			const results = [
				{ success: true as const, data: { name: "John" } },
				{ success: true as const, data: { name: "Jane" } },
			];

			expect(allValid(results)).toBe(true);
		});

		it("should return false when any item is invalid", () => {
			const results = [
				{ success: true as const, data: { name: "John" } },
				{ success: false as const, errors: [{ field: "name", message: "Required" }] },
			];

			expect(allValid(results)).toBe(false);
		});
	});
});
