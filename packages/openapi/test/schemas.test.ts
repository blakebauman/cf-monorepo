/**
 * Tests for common field schemas
 */

import { describe, expect, it } from "vitest";
import {
	Base64Schema,
	DateStringSchema,
	EmailSchema,
	HexColorSchema,
	JwtSchema,
	NonNegativeIntSchema,
	PhoneSchema,
	PositiveIntSchema,
	SlugSchema,
	UrlSchema,
	UuidSchema,
} from "../src/schemas/common";

describe("Common Field Schemas", () => {
	describe("EmailSchema", () => {
		it("should validate valid email addresses", () => {
			expect(EmailSchema.parse("user@example.com")).toBe("user@example.com");
			expect(EmailSchema.parse("test+tag@domain.co.uk")).toBe("test+tag@domain.co.uk");
		});

		it("should convert to lowercase", () => {
			expect(EmailSchema.parse("USER@EXAMPLE.COM")).toBe("user@example.com");
		});

		it("should reject invalid emails", () => {
			expect(() => EmailSchema.parse("not-an-email")).toThrow();
			expect(() => EmailSchema.parse("@example.com")).toThrow();
			expect(() => EmailSchema.parse("user@")).toThrow();
		});
	});

	describe("UuidSchema", () => {
		it("should validate valid UUIDs", () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			expect(UuidSchema.parse(validUuid)).toBe(validUuid);
		});

		it("should reject invalid UUIDs", () => {
			expect(() => UuidSchema.parse("not-a-uuid")).toThrow();
			expect(() => UuidSchema.parse("550e8400-e29b-41d4")).toThrow();
		});
	});

	describe("UrlSchema", () => {
		it("should validate valid URLs", () => {
			expect(UrlSchema.parse("https://example.com")).toBe("https://example.com");
			expect(UrlSchema.parse("http://localhost:3000")).toBe("http://localhost:3000");
		});

		it("should reject invalid URLs", () => {
			expect(() => UrlSchema.parse("not-a-url")).toThrow();
			expect(() => UrlSchema.parse("example.com")).toThrow();
		});
	});

	describe("PhoneSchema", () => {
		it("should validate E.164 format phone numbers", () => {
			expect(PhoneSchema.parse("+1234567890")).toBe("+1234567890");
			expect(PhoneSchema.parse("+447911123456")).toBe("+447911123456");
		});

		it("should reject invalid phone numbers", () => {
			expect(() => PhoneSchema.parse("1234567890")).toThrow(); // Missing +
			expect(() => PhoneSchema.parse("+0123456789")).toThrow(); // Starts with 0
			expect(() => PhoneSchema.parse("123")).toThrow(); // Too short
		});
	});

	describe("DateStringSchema", () => {
		it("should validate ISO 8601 date-time strings", () => {
			expect(DateStringSchema.parse("2024-01-01T00:00:00Z")).toBe("2024-01-01T00:00:00Z");
		});

		it("should reject invalid date strings", () => {
			expect(() => DateStringSchema.parse("2024-01-01")).toThrow();
			expect(() => DateStringSchema.parse("not-a-date")).toThrow();
		});
	});

	describe("PositiveIntSchema", () => {
		it("should coerce and validate positive integers", () => {
			expect(PositiveIntSchema.parse("123")).toBe(123);
			expect(PositiveIntSchema.parse(456)).toBe(456);
		});

		it("should reject zero and negative numbers", () => {
			expect(() => PositiveIntSchema.parse(0)).toThrow();
			expect(() => PositiveIntSchema.parse(-1)).toThrow();
		});

		it("should reject decimals", () => {
			expect(() => PositiveIntSchema.parse(1.5)).toThrow();
		});
	});

	describe("NonNegativeIntSchema", () => {
		it("should allow zero and positive integers", () => {
			expect(NonNegativeIntSchema.parse(0)).toBe(0);
			expect(NonNegativeIntSchema.parse(123)).toBe(123);
		});

		it("should reject negative numbers", () => {
			expect(() => NonNegativeIntSchema.parse(-1)).toThrow();
		});
	});

	describe("SlugSchema", () => {
		it("should validate URL-friendly slugs", () => {
			expect(SlugSchema.parse("my-blog-post")).toBe("my-blog-post");
			expect(SlugSchema.parse("hello-world-123")).toBe("hello-world-123");
		});

		it("should reject invalid slugs", () => {
			expect(() => SlugSchema.parse("My Blog Post")).toThrow(); // Uppercase/spaces
			expect(() => SlugSchema.parse("my_blog_post")).toThrow(); // Underscores
			expect(() => SlugSchema.parse("hello--world")).toThrow(); // Double dash
		});
	});

	describe("HexColorSchema", () => {
		it("should validate hex color codes", () => {
			expect(HexColorSchema.parse("#FF5733")).toBe("#FF5733");
			expect(HexColorSchema.parse("#000000")).toBe("#000000");
		});

		it("should reject invalid color codes", () => {
			expect(() => HexColorSchema.parse("FF5733")).toThrow(); // Missing #
			expect(() => HexColorSchema.parse("#FFF")).toThrow(); // Too short
			expect(() => HexColorSchema.parse("#GGGGGG")).toThrow(); // Invalid chars
		});
	});

	describe("Base64Schema", () => {
		it("should validate base64 strings", () => {
			expect(Base64Schema.parse("SGVsbG8gV29ybGQ=")).toBe("SGVsbG8gV29ybGQ=");
		});

		it("should reject invalid base64", () => {
			expect(() => Base64Schema.parse("Hello World!")).toThrow();
		});
	});

	describe("JwtSchema", () => {
		it("should validate JWT format", () => {
			const validJwt =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
			expect(JwtSchema.parse(validJwt)).toBe(validJwt);
		});

		it("should reject invalid JWT format", () => {
			expect(() => JwtSchema.parse("not.a.jwt")).toThrow();
			expect(() => JwtSchema.parse("only.two")).toThrow();
		});
	});
});
