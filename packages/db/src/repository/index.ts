/**
 * Repository patterns and utilities
 */

export { BaseRepository, type IRepository } from "./base-repository";
export {
	calculateOffset,
	calculateTotalPages,
	createPaginationMetadata,
	normalizePaginationOptions,
	validatePaginationOptions,
} from "./pagination";
export {
	calculatePagination,
	createPaginatedResult,
	type FilterOptions,
	type PaginatedResult,
	type PaginationOptions,
	type QueryOptions,
	type SortOptions,
} from "./query-options";
export {
	executeInTransaction,
	type Transaction,
	type TransactionOptions,
	withTransaction,
	withTransactionRetry,
} from "./transactions";
