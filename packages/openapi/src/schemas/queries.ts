/**
 * Common query parameter schemas with OpenAPI metadata
 */

import { z } from "@hono/zod-openapi";

/**
 * Date range query parameters
 */
export const DateRangeQuerySchema = z
	.object({
		startDate: z.coerce
			.date()
			.optional()
			.openapi({
				param: {
					name: "startDate",
					in: "query",
				},
				example: "2024-01-01",
				description: "Start date (inclusive)",
			}),
		endDate: z.coerce
			.date()
			.optional()
			.openapi({
				param: {
					name: "endDate",
					in: "query",
				},
				example: "2024-12-31",
				description: "End date (inclusive)",
			}),
	})
	.openapi("DateRangeQuery");

/**
 * Filter query parameters (for boolean filters)
 */
export const BooleanFilterQuerySchema = z
	.object({
		isActive: z.coerce
			.boolean()
			.optional()
			.openapi({
				param: {
					name: "isActive",
					in: "query",
				},
				example: true,
				description: "Filter by active status",
			}),
	})
	.openapi("BooleanFilterQuery");

/**
 * Status filter query parameter
 */
export const StatusFilterQuerySchema = z
	.object({
		status: z
			.enum(["active", "inactive", "pending", "archived"])
			.optional()
			.openapi({
				param: {
					name: "status",
					in: "query",
				},
				example: "active",
				description: "Filter by status",
			}),
	})
	.openapi("StatusFilterQuery");

/**
 * Combined pagination, sort, and search query
 */
export const ListQuerySchema = z
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
	.openapi("ListQuery");

/**
 * Cursor-based pagination query (for infinite scroll)
 */
export const CursorPaginationQuerySchema = z
	.object({
		cursor: z
			.string()
			.optional()
			.openapi({
				param: {
					name: "cursor",
					in: "query",
				},
				example: "eyJpZCI6MTIzfQ==",
				description: "Cursor for pagination",
			}),
		limit: z.coerce
			.number()
			.int()
			.positive()
			.max(100)
			.default(20)
			.openapi({
				param: {
					name: "limit",
					in: "query",
				},
				example: 20,
				description: "Number of items to return (max 100)",
			}),
	})
	.openapi("CursorPaginationQuery");
