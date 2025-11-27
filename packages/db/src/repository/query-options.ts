/**
 * Query options for repository operations
 */

import type { SQL } from "drizzle-orm";

/**
 * Pagination options
 */
export interface PaginationOptions {
	/**
	 * Page number (1-indexed)
	 */
	page?: number;
	/**
	 * Number of items per page
	 */
	limit?: number;
	/**
	 * Offset (alternative to page)
	 */
	offset?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
	/**
	 * Field to sort by
	 */
	sortBy?: string;
	/**
	 * Sort order
	 */
	sortOrder?: "asc" | "desc";
}

/**
 * Filter options
 */
export interface FilterOptions {
	/**
	 * Search query
	 */
	search?: string;
	/**
	 * Custom where clause
	 */
	where?: SQL;
	/**
	 * Additional filters as key-value pairs
	 */
	filters?: Record<string, unknown>;
}

/**
 * Combined query options
 */
export interface QueryOptions extends PaginationOptions, SortOptions, FilterOptions {
	/**
	 * Include soft-deleted records
	 */
	includeSoftDeleted?: boolean;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
	/**
	 * Array of items
	 */
	data: T[];
	/**
	 * Pagination metadata
	 */
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

/**
 * Calculate pagination values
 */
export function calculatePagination(options: PaginationOptions) {
	const limit = options.limit ?? 10;
	const page = options.page ?? 1;
	const offset = options.offset ?? (page - 1) * limit;

	return {
		limit,
		page,
		offset,
	};
}

/**
 * Create paginated result
 */
export function createPaginatedResult<T>(
	data: T[],
	total: number,
	options: PaginationOptions
): PaginatedResult<T> {
	const { limit, page } = calculatePagination(options);
	const totalPages = Math.ceil(total / limit);

	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
		},
	};
}
