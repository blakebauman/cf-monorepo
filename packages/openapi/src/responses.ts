/**
 * Shared OpenAPI Response Schemas
 * Common response schemas for API endpoints
 */

import { z } from "@hono/zod-openapi";

/**
 * Base API Response Schema
 * Matches the ApiResponse type from @repo/types
 */
export const BaseApiResponseSchema = z
	.object({
		success: z.boolean(),
		data: z.unknown().optional(),
		error: z.string().optional(),
		message: z.string().optional(),
	})
	.openapi("BaseApiResponse");

/**
 * Success Response Schema
 */
export const SuccessResponseSchema = z
	.object({
		success: z.literal(true),
		data: z.unknown(),
		message: z.string().optional(),
	})
	.openapi("SuccessResponse");

/**
 * Error Response Schema
 * Includes requestId for request tracking
 */
export const ErrorResponseSchema = z
	.object({
		success: z.literal(false),
		error: z.string(),
		requestId: z.string(),
		message: z.string().optional(),
	})
	.openapi("ErrorResponse");

/**
 * Pagination Schema
 */
export const PaginationSchema = z
	.object({
		page: z.number().int().positive(),
		limit: z.number().int().positive(),
		total: z.number().int().nonnegative(),
		totalPages: z.number().int().nonnegative(),
	})
	.openapi("Pagination");

/**
 * Paginated Response Schema
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z
		.object({
			success: z.literal(true),
			data: z.array(dataSchema),
			pagination: PaginationSchema,
		})
		.openapi("PaginatedResponse");

/**
 * Standard HTTP Error Responses
 */
export const NotFoundResponseSchema = ErrorResponseSchema.openapi("NotFoundResponse");
export const UnauthorizedResponseSchema = ErrorResponseSchema.openapi("UnauthorizedResponse");
export const ForbiddenResponseSchema = ErrorResponseSchema.openapi("ForbiddenResponse");
export const BadRequestResponseSchema = ErrorResponseSchema.openapi("BadRequestResponse");
export const InternalServerErrorResponseSchema = ErrorResponseSchema.openapi(
	"InternalServerErrorResponse"
);
export const TooManyRequestsResponseSchema = ErrorResponseSchema.openapi("TooManyRequestsResponse");

/**
 * Helper to create standard error responses for OpenAPI routes
 */
export const standardErrorResponses = {
	400: {
		description: "Bad Request",
		content: {
			"application/json": {
				schema: BadRequestResponseSchema,
			},
		},
	},
	401: {
		description: "Unauthorized",
		content: {
			"application/json": {
				schema: UnauthorizedResponseSchema,
			},
		},
	},
	403: {
		description: "Forbidden",
		content: {
			"application/json": {
				schema: ForbiddenResponseSchema,
			},
		},
	},
	404: {
		description: "Not Found",
		content: {
			"application/json": {
				schema: NotFoundResponseSchema,
			},
		},
	},
	429: {
		description: "Too Many Requests",
		content: {
			"application/json": {
				schema: TooManyRequestsResponseSchema,
			},
		},
	},
	500: {
		description: "Internal Server Error",
		content: {
			"application/json": {
				schema: InternalServerErrorResponseSchema,
			},
		},
	},
} as const;
