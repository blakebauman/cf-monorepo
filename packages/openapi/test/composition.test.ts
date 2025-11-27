/**
 * Tests for schema composition helpers
 */

import { z } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";
import {
	createInputSchema,
	updateInputSchema,
	withAudit,
	withId,
	withSoftDelete,
	withTimestamps,
} from "../src/helpers/composition";

describe("Schema Composition Helpers", () => {
	const BaseSchema = z.object({
		name: z.string(),
		email: z.string().email(),
	});

	describe("withTimestamps", () => {
		it("should add createdAt and updatedAt fields", () => {
			const schema = withTimestamps(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-02"),
			});

			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("updatedAt");
		});

		it("should allow null timestamps", () => {
			const schema = withTimestamps(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				createdAt: null,
				updatedAt: null,
			});

			expect(result.createdAt).toBeNull();
			expect(result.updatedAt).toBeNull();
		});

		it("should allow ISO date strings", () => {
			const schema = withTimestamps(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			});

			expect(result.createdAt).toBe("2024-01-01T00:00:00Z");
			expect(result.updatedAt).toBe("2024-01-02T00:00:00Z");
		});
	});

	describe("withSoftDelete", () => {
		it("should add deletedAt field", () => {
			const schema = withSoftDelete(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				deletedAt: new Date("2024-01-01"),
			});

			expect(result).toHaveProperty("deletedAt");
		});

		it("should allow null deletedAt", () => {
			const schema = withSoftDelete(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				deletedAt: null,
			});

			expect(result.deletedAt).toBeNull();
		});
	});

	describe("withId", () => {
		it("should add numeric ID by default", () => {
			const schema = withId(BaseSchema);
			const result = schema.parse({
				id: 123,
				name: "John",
				email: "john@example.com",
			});

			expect(result.id).toBe(123);
		});

		it("should add string ID when specified", () => {
			const schema = withId(BaseSchema, "string");
			const result = schema.parse({
				id: "abc123",
				name: "John",
				email: "john@example.com",
			});

			expect(result.id).toBe("abc123");
		});

		it("should add UUID when specified", () => {
			const schema = withId(BaseSchema, "uuid");
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = schema.parse({
				id: validUuid,
				name: "John",
				email: "john@example.com",
			});

			expect(result.id).toBe(validUuid);
		});
	});

	describe("withAudit", () => {
		it("should add createdBy and updatedBy fields", () => {
			const schema = withAudit(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				createdBy: 1,
				updatedBy: 2,
			});

			expect(result.createdBy).toBe(1);
			expect(result.updatedBy).toBe(2);
		});

		it("should allow null audit fields", () => {
			const schema = withAudit(BaseSchema);
			const result = schema.parse({
				name: "John",
				email: "john@example.com",
				createdBy: null,
				updatedBy: null,
			});

			expect(result.createdBy).toBeNull();
			expect(result.updatedBy).toBeNull();
		});
	});

	describe("createInputSchema", () => {
		it("should omit id and timestamp fields", () => {
			const FullSchema = withTimestamps(withId(BaseSchema));
			const InputSchema = createInputSchema(FullSchema);

			const result = InputSchema.parse({
				name: "John",
				email: "john@example.com",
			});

			expect(result).not.toHaveProperty("id");
			expect(result).not.toHaveProperty("createdAt");
			expect(result).not.toHaveProperty("updatedAt");
		});
	});

	describe("updateInputSchema", () => {
		it("should omit id and timestamps and make all fields optional", () => {
			const FullSchema = withTimestamps(withId(BaseSchema));
			const UpdateSchema = updateInputSchema(FullSchema);

			// Should allow empty object
			const result1 = UpdateSchema.parse({});
			expect(result1).toEqual({});

			// Should allow partial updates
			const result2 = UpdateSchema.parse({ name: "Jane" });
			expect(result2).toEqual({ name: "Jane" });

			// Should not allow id
			expect(() => UpdateSchema.parse({ id: 1 })).toThrow();
		});
	});

	describe("Composition", () => {
		it("should allow combining multiple helpers", () => {
			const schema = withAudit(withSoftDelete(withTimestamps(withId(BaseSchema))));

			const result = schema.parse({
				id: 1,
				name: "John",
				email: "john@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
				createdBy: 1,
				updatedBy: 1,
			});

			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("email");
			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("updatedAt");
			expect(result).toHaveProperty("deletedAt");
			expect(result).toHaveProperty("createdBy");
			expect(result).toHaveProperty("updatedBy");
		});
	});
});
