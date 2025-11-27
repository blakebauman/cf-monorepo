/**
 * Transaction helper utilities
 */

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonHttpQueryResultHKT } from "drizzle-orm/neon-http";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { Database as DbType } from "../index";
import type * as schema from "../schema";

export type Database = DbType;

/**
 * Transaction type for Neon HTTP
 */
export type Transaction = PgTransaction<
	NeonHttpQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;

/**
 * Execute a function within a transaction
 */
export async function withTransaction<T>(
	db: Database,
	fn: (tx: Transaction) => Promise<T>
): Promise<T> {
	return db.transaction(fn);
}

/**
 * Execute multiple operations in a transaction
 * Rolls back if any operation fails
 */
export async function executeInTransaction<T>(
	db: Database,
	operations: Array<(tx: Transaction) => Promise<T>>
): Promise<T[]> {
	return db.transaction(async (tx) => {
		const results: T[] = [];

		for (const operation of operations) {
			const result = await operation(tx);
			results.push(result);
		}

		return results;
	});
}

/**
 * Transaction options
 */
export interface TransactionOptions {
	/**
	 * Maximum retry attempts on failure
	 */
	maxRetries?: number;
	/**
	 * Retry delay in milliseconds
	 */
	retryDelay?: number;
}

/**
 * Execute a transaction with retry logic
 */
export async function withTransactionRetry<T>(
	db: Database,
	fn: (tx: Transaction) => Promise<T>,
	options: TransactionOptions = {}
): Promise<T> {
	const { maxRetries = 3, retryDelay = 100 } = options;
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await db.transaction(fn);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry on the last attempt
			if (attempt < maxRetries) {
				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
			}
		}
	}

	throw lastError;
}
