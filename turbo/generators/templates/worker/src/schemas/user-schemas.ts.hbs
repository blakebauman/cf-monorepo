/**
 * User-related OpenAPI schemas
 */

import { z } from "@hono/zod-openapi";
import { createInputSchema, EmailSchema, updateInputSchema, withTimestamps } from "@repo/openapi";

/**
 * Base user schema (without timestamps)
 */
const BaseUserSchema = z.object({
	id: z.union([z.number(), z.string()]).openapi({
		example: 123,
		description: "User ID",
	}),
	email: EmailSchema,
	name: z.string().nullable().openapi({
		example: "John Doe",
		description: "User's full name",
	}),
});

/**
 * Full user schema with timestamps
 */
export const UserSchema = withTimestamps(BaseUserSchema).openapi("User");

/**
 * Create user input schema
 */
export const CreateUserBodySchema = createInputSchema(UserSchema).openapi("CreateUserBody");

/**
 * Update user input schema
 */
export const UpdateUserBodySchema = updateInputSchema(UserSchema).openapi("UpdateUserBody");
