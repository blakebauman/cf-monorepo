/**
 * Tests for DTO utilities
 */

import { describe, expect, it } from "vitest";
import { BaseDTO, DTOTransformers } from "../src/dto";

describe("BaseDTO", () => {
	const testData = {
		id: 1,
		name: "John Doe",
		email: "john@example.com",
		password: "secret123",
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-02T00:00:00Z"),
		role: null,
	};

	describe("toDTO", () => {
		it("should exclude specified fields", () => {
			const result = BaseDTO.toDTO(testData, { exclude: ["password"] });

			expect(result).not.toHaveProperty("password");
			expect(result).toHaveProperty("email");
		});

		it("should include only specified fields when include is provided", () => {
			const result = BaseDTO.toDTO(testData, { include: ["id", "name"] });

			expect(result).toEqual({ id: 1, name: "John Doe" });
		});

		it("should serialize dates to ISO strings", () => {
			const result = BaseDTO.toDTO(testData, { serializeDates: true });

			expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
			expect(result.updatedAt).toBe("2024-01-02T00:00:00.000Z");
		});

		it("should not serialize dates when serializeDates is false", () => {
			const result = BaseDTO.toDTO(testData, { serializeDates: false });

			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it("should remove null values when removeNulls is true", () => {
			const result = BaseDTO.toDTO(testData, { removeNulls: true });

			expect(result).not.toHaveProperty("role");
		});

		it("should keep null values when removeNulls is false", () => {
			const result = BaseDTO.toDTO(testData, { removeNulls: false });

			expect(result).toHaveProperty("role");
			expect(result.role).toBeNull();
		});

		it("should combine multiple options", () => {
			const result = BaseDTO.toDTO(testData, {
				exclude: ["password"],
				serializeDates: true,
				removeNulls: true,
			});

			expect(result).not.toHaveProperty("password");
			expect(result).not.toHaveProperty("role");
			expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
		});
	});

	describe("toDTOs", () => {
		it("should transform multiple items", () => {
			const items = [testData, { ...testData, id: 2 }];
			const result = BaseDTO.toDTOs(items, { exclude: ["password"] });

			expect(result).toHaveLength(2);
			expect(result[0]).not.toHaveProperty("password");
			expect(result[1]).not.toHaveProperty("password");
		});
	});

	describe("pick", () => {
		it("should pick only specified fields", () => {
			const result = BaseDTO.pick(testData, ["id", "name", "email"]);

			expect(result).toEqual({
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			});
		});
	});

	describe("omit", () => {
		it("should omit specified fields", () => {
			const result = BaseDTO.omit(testData, ["password", "createdAt", "updatedAt"]);

			expect(result).not.toHaveProperty("password");
			expect(result).not.toHaveProperty("createdAt");
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("name");
		});
	});

	describe("sanitize", () => {
		it("should escape HTML entities", () => {
			const malicious = {
				name: "<script>alert('xss')</script>",
				bio: "Quote: \" and apostrophe: '",
			};

			const result = BaseDTO.sanitize(malicious);

			expect(result.name).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;");
			expect(result.bio).toBe("Quote: &quot; and apostrophe: &#x27;");
		});

		it("should not affect non-string fields", () => {
			const data = {
				id: 123,
				name: "<b>Test</b>",
			};

			const result = BaseDTO.sanitize(data);

			expect(result.id).toBe(123);
			expect(result.name).toBe("&lt;b&gt;Test&lt;&#x2F;b&gt;");
		});
	});
});

describe("DTOTransformers", () => {
	const testData = {
		id: 1,
		email: "test@example.com",
		password: "secret",
		passwordHash: "hashed",
		token: "jwt-token",
		createdAt: new Date("2024-01-01"),
		role: null,
	};

	describe("secure", () => {
		it("should remove sensitive fields and serialize dates", () => {
			const result = DTOTransformers.secure(testData);

			expect(result).not.toHaveProperty("password");
			expect(result).not.toHaveProperty("passwordHash");
			expect(result).not.toHaveProperty("token");
			expect(typeof result.createdAt).toBe("string");
		});
	});

	describe("clean", () => {
		it("should remove null values and serialize dates", () => {
			const result = DTOTransformers.clean(testData);

			expect(result).not.toHaveProperty("role");
			expect(typeof result.createdAt).toBe("string");
		});
	});

	describe("public", () => {
		it("should create public-safe response", () => {
			const result = DTOTransformers.public(testData);

			expect(result).not.toHaveProperty("password");
			expect(result).not.toHaveProperty("passwordHash");
			expect(result).not.toHaveProperty("token");
			expect(result).not.toHaveProperty("role");
			expect(typeof result.createdAt).toBe("string");
		});
	});
});
