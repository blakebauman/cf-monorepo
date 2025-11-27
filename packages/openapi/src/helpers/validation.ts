/**
 * Validation helper utilities
 */

import type { z } from "@hono/zod-openapi";
import { ValidationError } from "@repo/errors";

/**
 * Parse data with a Zod schema, throwing ValidationError on failure
 */
export function parseOrThrow<T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> {
	const result = schema.safeParse(data);

	if (!result.success) {
		const errors = result.error.issues.map((err: z.ZodIssue) => ({
			field: err.path.join("."),
			message: err.message,
		}));

		throw new ValidationError("Validation failed", {
			errors,
		});
	}

	return result.data;
}

/**
 * Parse data with a Zod schema, returning null on failure
 */
export function parseOrNull<T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> | null {
	const result = schema.safeParse(data);
	return result.success ? result.data : null;
}

/**
 * Validate data with a Zod schema, returning validation errors
 */
export function validate<T extends z.ZodSchema>(
	schema: T,
	data: unknown
):
	| { success: true; data: z.infer<T> }
	| { success: false; errors: Array<{ field: string; message: string }> } {
	const result = schema.safeParse(data);

	if (!result.success) {
		return {
			success: false,
			errors: result.error.issues.map((err: z.ZodIssue) => ({
				field: err.path.join("."),
				message: err.message,
			})),
		};
	}

	return {
		success: true,
		data: result.data,
	};
}

/**
 * Create a validation function for a specific schema
 */
export function createValidator<T extends z.ZodSchema>(schema: T) {
	return (data: unknown) => parseOrThrow(schema, data);
}

/**
 * Batch validate multiple items
 */
export function validateBatch<T extends z.ZodSchema>(
	schema: T,
	items: unknown[]
): Array<
	| { success: true; data: z.infer<T> }
	| { success: false; errors: Array<{ field: string; message: string }> }
> {
	return items.map((item) => validate(schema, item));
}

/**
 * Check if all batch validations succeeded
 */
export function allValid<T>(
	results: Array<{ success: boolean; data?: T; errors?: Array<{ field: string; message: string }> }>
): results is Array<{ success: true; data: T }> {
	return results.every((result) => result.success);
}
