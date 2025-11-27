/**
 * Pagination utilities for database queries
 */

import type { PaginationOptions } from "./query-options";

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
	return (page - 1) * limit;
}

/**
 * Calculate total pages from total items and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
	return Math.ceil(total / limit);
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(options: PaginationOptions): void {
	const { page, limit, offset } = options;

	if (page !== undefined && page < 1) {
		throw new Error("Page must be greater than 0");
	}

	if (limit !== undefined && limit < 1) {
		throw new Error("Limit must be greater than 0");
	}

	if (limit !== undefined && limit > 100) {
		throw new Error("Limit must be less than or equal to 100");
	}

	if (offset !== undefined && offset < 0) {
		throw new Error("Offset must be greater than or equal to 0");
	}
}

/**
 * Get default pagination options
 */
export function getDefaultPaginationOptions(): Required<PaginationOptions> {
	return {
		page: 1,
		limit: 10,
		offset: 0,
	};
}

/**
 * Merge pagination options with defaults
 */
export function normalizePaginationOptions(
	options: PaginationOptions = {}
): Required<PaginationOptions> {
	const defaults = getDefaultPaginationOptions();
	const limit = options.limit ?? defaults.limit;
	const page = options.page ?? defaults.page;
	const offset = options.offset ?? calculateOffset(page, limit);

	validatePaginationOptions({ page, limit, offset });

	return {
		page,
		limit,
		offset,
	};
}

/**
 * Create pagination metadata
 */
export function createPaginationMetadata(total: number, options: PaginationOptions) {
	const normalized = normalizePaginationOptions(options);
	const totalPages = calculateTotalPages(total, normalized.limit);

	return {
		page: normalized.page,
		limit: normalized.limit,
		total,
		totalPages,
		hasNextPage: normalized.page < totalPages,
		hasPreviousPage: normalized.page > 1,
	};
}
