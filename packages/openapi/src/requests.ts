/**
 * Shared OpenAPI Request Schemas
 * Common request schemas for API endpoints
 */

import { z } from "@hono/zod-openapi";

/**
 * Pagination Query Parameters
 */
export const PaginationQuerySchema = z
	.object({
		page: z.coerce
			.number()
			.int()
			.positive()
			.default(1)
			.openapi({
				param: {
					name: "page",
					in: "query",
				},
				example: 1,
				description: "Page number (starts at 1)",
			}),
		limit: z.coerce
			.number()
			.int()
			.positive()
			.max(100)
			.default(10)
			.openapi({
				param: {
					name: "limit",
					in: "query",
				},
				example: 10,
				description: "Number of items per page (max 100)",
			}),
	})
	.openapi("PaginationQuery");

/**
 * Sort Query Parameters
 */
export const SortQuerySchema = z
	.object({
		sortBy: z
			.string()
			.optional()
			.openapi({
				param: {
					name: "sortBy",
					in: "query",
				},
				example: "createdAt",
				description: "Field to sort by",
			}),
		sortOrder: z
			.enum(["asc", "desc"])
			.default("desc")
			.openapi({
				param: {
					name: "sortOrder",
					in: "query",
				},
				example: "desc",
				description: "Sort order",
			}),
	})
	.openapi("SortQuery");

/**
 * Search Query Parameters
 */
export const SearchQuerySchema = z
	.object({
		q: z
			.string()
			.min(1)
			.optional()
			.openapi({
				param: {
					name: "q",
					in: "query",
				},
				example: "search term",
				description: "Search query",
			}),
	})
	.openapi("SearchQuery");

/**
 * ID Path Parameter
 */
export const IdParamSchema = z
	.object({
		id: z
			.string()
			.min(1)
			.openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "123",
				description: "Resource ID",
			}),
	})
	.openapi("IdParam");

/**
 * Common request headers
 */
export const CommonHeadersSchema = z
	.object({
		authorization: z
			.string()
			.optional()
			.openapi({
				param: {
					name: "Authorization",
					in: "header",
				},
				example: "Bearer token",
				description: "Bearer token for authentication",
			}),
		"x-request-id": z
			.string()
			.optional()
			.openapi({
				param: {
					name: "X-Request-ID",
					in: "header",
				},
				example: "abc123",
				description: "Request ID for tracing",
			}),
	})
	.openapi("CommonHeaders");
