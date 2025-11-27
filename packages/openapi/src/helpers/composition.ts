/**
 * Schema composition helpers for building complex schemas
 */

import { z } from "@hono/zod-openapi";
import { DateStringSchema, PositiveIntSchema } from "../schemas/common";

/**
 * Add timestamp fields to a schema
 */
export function withTimestamps<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
	return schema.extend({
		createdAt: z.union([z.date(), DateStringSchema]).nullable().openapi({
			example: "2024-01-01T00:00:00Z",
			description: "Timestamp when the resource was created",
		}),
		updatedAt: z.union([z.date(), DateStringSchema]).nullable().openapi({
			example: "2024-01-01T00:00:00Z",
			description: "Timestamp when the resource was last updated",
		}),
	});
}

/**
 * Add soft delete field to a schema
 */
export function withSoftDelete<T extends z.ZodObject<z.ZodRawShape>>(
	schema: T
): z.ZodObject<
	T["shape"] & {
		deletedAt: z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
	}
> {
	return schema.extend({
		deletedAt: z.union([z.date(), DateStringSchema]).nullable().openapi({
			example: null,
			description: "Timestamp when the resource was soft deleted (null if not deleted)",
		}),
	}) as never;
}

/**
 * Add ID field to a schema
 */
export function withId<T extends z.ZodObject<z.ZodRawShape>>(
	schema: T,
	idType: "number" | "string" | "uuid" = "number"
): z.ZodObject<T["shape"] & { id: z.ZodTypeAny }> {
	const idSchema =
		idType === "uuid"
			? z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" })
			: idType === "string"
				? z.string().openapi({ example: "abc123" })
				: PositiveIntSchema;

	return schema.extend({
		id: idSchema.openapi({
			description: "Unique identifier",
		}),
	}) as never;
}

/**
 * Add audit fields (createdBy, updatedBy) to a schema
 */
export function withAudit<T extends z.ZodObject<z.ZodRawShape>>(
	schema: T
): z.ZodObject<
	T["shape"] & {
		createdBy: z.ZodNullable<z.ZodTypeAny>;
		updatedBy: z.ZodNullable<z.ZodTypeAny>;
	}
> {
	return schema.extend({
		createdBy: PositiveIntSchema.nullable().openapi({
			example: 1,
			description: "User ID who created the resource",
		}),
		updatedBy: PositiveIntSchema.nullable().openapi({
			example: 1,
			description: "User ID who last updated the resource",
		}),
	}) as never;
}

/**
 * Make all fields in a schema optional
 */
export function makeOptional<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
	return schema.partial();
}

/**
 * Make specific fields in a schema optional
 * Note: Due to TypeScript limitations, return type is simplified
 */
export function makeFieldsOptional<T extends z.ZodObject<z.ZodRawShape>>(
	schema: T,
	fields: Array<keyof T["shape"]>
): z.ZodObject<z.ZodRawShape> {
	const newShape: Record<string, z.ZodTypeAny> = {};

	for (const key in schema.shape) {
		if (fields.includes(key as keyof T["shape"])) {
			newShape[key] = (schema.shape[key] as z.ZodTypeAny).optional();
		} else {
			newShape[key] = schema.shape[key] as z.ZodTypeAny;
		}
	}

	return z.object(newShape);
}

/**
 * Make specific fields in a schema required
 * Note: Due to TypeScript limitations, return type is simplified
 */
export function makeFieldsRequired<T extends z.ZodObject<z.ZodRawShape>>(
	schema: T,
	fields: Array<keyof T["shape"]>
): z.ZodObject<z.ZodRawShape> {
	const newShape: Record<string, z.ZodTypeAny> = {};

	for (const key in schema.shape) {
		const fieldSchema = schema.shape[key] as z.ZodTypeAny;
		if (fields.includes(key as keyof T["shape"]) && fieldSchema instanceof z.ZodOptional) {
			newShape[key] = fieldSchema.unwrap() as z.ZodTypeAny;
		} else {
			newShape[key] = fieldSchema;
		}
	}

	return z.object(newShape);
}

/**
 * Create a full resource schema with common fields
 */
export function createResourceSchema<T extends z.ZodObject<z.ZodRawShape>>(
	schema: T,
	options: {
		idType?: "number" | "string" | "uuid";
		withSoftDelete?: boolean;
		withAudit?: boolean;
	} = {}
) {
	let result = withTimestamps(withId(schema, options.idType));

	if (options.withSoftDelete) {
		result = withSoftDelete(result);
	}

	if (options.withAudit) {
		result = withAudit(result);
	}

	return result;
}

/**
 * Create a create input schema (omit id and timestamps)
 */
export function createInputSchema<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
	return schema.omit({ id: true, createdAt: true, updatedAt: true });
}

/**
 * Create an update input schema (omit id, timestamps, and make all optional)
 */
export function updateInputSchema<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
	return schema.omit({ id: true, createdAt: true, updatedAt: true }).partial().strict();
}
