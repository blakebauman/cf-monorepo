/**
 * Common field schemas with OpenAPI metadata
 * Reusable across all workers
 */

import { z } from "@hono/zod-openapi";

/**
 * Email field schema
 */
export const EmailSchema = z.string().email().min(3).max(255).toLowerCase().openapi({
	example: "user@example.com",
	description: "Valid email address",
});

/**
 * UUID v4 schema
 */
export const UuidSchema = z.string().uuid().openapi({
	example: "550e8400-e29b-41d4-a716-446655440000",
	description: "UUID v4",
});

/**
 * URL schema
 */
export const UrlSchema = z.string().url().openapi({
	example: "https://example.com",
	description: "Valid URL",
});

/**
 * Phone number schema (E.164 format)
 */
export const PhoneSchema = z
	.string()
	.regex(/^\+[1-9]\d{1,14}$/)
	.openapi({
		example: "+1234567890",
		description: "Phone number in E.164 format",
	});

/**
 * ISO 8601 date string schema
 */
export const DateStringSchema = z.string().datetime().openapi({
	example: "2024-01-01T00:00:00Z",
	description: "ISO 8601 date-time string",
});

/**
 * Positive integer ID schema
 */
export const PositiveIntSchema = z.coerce.number().int().positive().openapi({
	example: 1,
	description: "Positive integer",
});

/**
 * Non-negative integer schema
 */
export const NonNegativeIntSchema = z.coerce.number().int().nonnegative().openapi({
	example: 0,
	description: "Non-negative integer",
});

/**
 * Slug schema (URL-friendly string)
 */
export const SlugSchema = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
	.min(1)
	.max(255)
	.openapi({
		example: "my-blog-post",
		description: "URL-friendly slug",
	});

/**
 * Hex color code schema
 */
export const HexColorSchema = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/)
	.openapi({
		example: "#FF5733",
		description: "Hex color code",
	});

/**
 * Base64 encoded string schema
 */
export const Base64Schema = z
	.string()
	.regex(/^[A-Za-z0-9+/]*={0,2}$/)
	.openapi({
		example: "SGVsbG8gV29ybGQ=",
		description: "Base64 encoded string",
	});

/**
 * JWT token schema
 * Validates JWT format with minimum length requirements for header, payload, and signature
 */
export const JwtSchema = z
	.string()
	.regex(/^[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}$/)
	.openapi({
		example:
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
		description: "JWT token",
	});
