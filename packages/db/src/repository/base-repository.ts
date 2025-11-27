/**
 * Base repository class with generic CRUD operations
 */

import { DatabaseError, NotFoundError } from "@repo/errors";
import { count, desc, eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Database } from "../index";
import {
	calculatePagination,
	createPaginatedResult,
	type PaginatedResult,
	type QueryOptions,
} from "./query-options";
import { type Transaction, withTransaction } from "./transactions";

/**
 * Base repository interface
 */
export interface IRepository<T extends { id: number | string }> {
	findAll(options?: QueryOptions): Promise<T[]>;
	findById(id: T["id"]): Promise<T | null>;
	create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
	update(id: T["id"], data: Partial<Omit<T, "id" | "createdAt">>): Promise<T | null>;
	delete(id: T["id"]): Promise<boolean>;
	count(where?: SQL): Promise<number>;
}

/**
 * Base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends { id: number | string }> implements IRepository<T> {
	constructor(
		protected readonly db: Database,
		protected readonly table: PgTable
	) {}

	/**
	 * Get the ID column for the table
	 */
	protected abstract getIdColumn(): SQL;

	/**
	 * Get the default order by column
	 */
	protected getDefaultOrderBy(): SQL {
		// Override in subclass if table has createdAt
		return this.getIdColumn();
	}

	/**
	 * Find all records with optional filtering, sorting, and pagination
	 */
	async findAll(options: QueryOptions = {}): Promise<T[]> {
		try {
			const { limit, offset } = calculatePagination(options);

			let query = this.db.select().from(this.table);

			// Apply where clause if provided
			if (options.where) {
				query = query.where(options.where) as typeof query;
			}

			// Apply ordering
			if (options.sortOrder === "asc") {
				query = query.orderBy(this.getDefaultOrderBy()) as typeof query;
			} else {
				query = query.orderBy(desc(this.getDefaultOrderBy())) as typeof query;
			}

			// Apply pagination
			query = query.limit(limit).offset(offset) as typeof query;

			return (await query) as T[];
		} catch (error) {
			throw new DatabaseError(
				"Failed to fetch records",
				error instanceof Error ? error : undefined,
				{ table: this.table }
			);
		}
	}

	/**
	 * Find all records with pagination metadata
	 */
	async findAllPaginated(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
		try {
			const [records, total] = await Promise.all([
				this.findAll(options),
				this.count(options.where),
			]);

			return createPaginatedResult(records, total, options);
		} catch (error) {
			throw new DatabaseError(
				"Failed to fetch paginated records",
				error instanceof Error ? error : undefined,
				{ table: this.table }
			);
		}
	}

	/**
	 * Find a record by ID
	 */
	async findById(id: T["id"]): Promise<T | null> {
		try {
			const [record] = await this.db
				.select()
				.from(this.table)
				.where(eq(this.getIdColumn(), id as string | number))
				.limit(1);

			return (record as T) ?? null;
		} catch (error) {
			throw new DatabaseError(
				`Failed to fetch record with id ${id}`,
				error instanceof Error ? error : undefined,
				{ table: this.table, id }
			);
		}
	}

	/**
	 * Find a record by ID or throw NotFoundError
	 */
	async findByIdOrThrow(id: T["id"], resourceName?: string): Promise<T> {
		const record = await this.findById(id);

		if (!record) {
			throw new NotFoundError(resourceName ?? this.table.toString(), id);
		}

		return record;
	}

	/**
	 * Create a new record
	 */
	async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
		try {
			const [record] = await this.db
				.insert(this.table)
				.values(data as never)
				.returning();

			if (!record) {
				throw new DatabaseError("Failed to create record - no record returned", undefined, {
					table: this.table,
				});
			}

			return record as T;
		} catch (error) {
			throw new DatabaseError(
				"Failed to create record",
				error instanceof Error ? error : undefined,
				{ table: this.table, data }
			);
		}
	}

	/**
	 * Create multiple records in a transaction
	 */
	async createMany(data: Array<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T[]> {
		try {
			return await withTransaction(this.db, async (tx) => {
				const results: T[] = [];

				for (const item of data) {
					const [record] = await tx
						.insert(this.table)
						.values(item as never)
						.returning();

					if (record) {
						results.push(record as T);
					}
				}

				return results;
			});
		} catch (error) {
			throw new DatabaseError(
				"Failed to create multiple records",
				error instanceof Error ? error : undefined,
				{ table: this.table, count: data.length }
			);
		}
	}

	/**
	 * Update a record by ID
	 */
	async update(id: T["id"], data: Partial<Omit<T, "id" | "createdAt">>): Promise<T | null> {
		try {
			const updateData = {
				...data,
				updatedAt: new Date(),
			};

			const [updated] = await this.db
				.update(this.table)
				.set(updateData as never)
				.where(eq(this.getIdColumn(), id as string | number))
				.returning();

			return (updated as T) ?? null;
		} catch (error) {
			throw new DatabaseError(
				`Failed to update record with id ${id}`,
				error instanceof Error ? error : undefined,
				{ table: this.table, id, data }
			);
		}
	}

	/**
	 * Update a record by ID or throw NotFoundError
	 */
	async updateOrThrow(
		id: T["id"],
		data: Partial<Omit<T, "id" | "createdAt">>,
		resourceName?: string
	): Promise<T> {
		const updated = await this.update(id, data);

		if (!updated) {
			throw new NotFoundError(resourceName ?? this.table.toString(), id);
		}

		return updated;
	}

	/**
	 * Delete a record by ID (hard delete)
	 */
	async delete(id: T["id"]): Promise<boolean> {
		try {
			const [deleted] = await this.db
				.delete(this.table)
				.where(eq(this.getIdColumn(), id as string | number))
				.returning();

			return deleted !== undefined;
		} catch (error) {
			throw new DatabaseError(
				`Failed to delete record with id ${id}`,
				error instanceof Error ? error : undefined,
				{ table: this.table, id }
			);
		}
	}

	/**
	 * Delete a record by ID or throw NotFoundError
	 */
	async deleteOrThrow(id: T["id"], resourceName?: string): Promise<void> {
		const deleted = await this.delete(id);

		if (!deleted) {
			throw new NotFoundError(resourceName ?? this.table.toString(), id);
		}
	}

	/**
	 * Soft delete a record by ID (requires deletedAt column)
	 */
	async softDelete(id: T["id"]): Promise<T | null> {
		try {
			const [deleted] = await this.db
				.update(this.table)
				.set({ deletedAt: new Date() } as never)
				.where(eq(this.getIdColumn(), id as string | number))
				.returning();

			return (deleted as T) ?? null;
		} catch (error) {
			throw new DatabaseError(
				`Failed to soft delete record with id ${id}`,
				error instanceof Error ? error : undefined,
				{ table: this.table, id }
			);
		}
	}

	/**
	 * Count records with optional filter
	 */
	async count(where?: SQL): Promise<number> {
		try {
			let query = this.db.select({ total: count() }).from(this.table);

			if (where) {
				query = query.where(where) as typeof query;
			}

			const result = await query;
			const first = result[0];

			return first?.total ?? 0;
		} catch (error) {
			throw new DatabaseError(
				"Failed to count records",
				error instanceof Error ? error : undefined,
				{ table: this.table }
			);
		}
	}

	/**
	 * Check if a record exists by ID
	 */
	async exists(id: T["id"]): Promise<boolean> {
		try {
			const record = await this.findById(id);
			return record !== null;
		} catch (error) {
			throw new DatabaseError(
				`Failed to check if record exists with id ${id}`,
				error instanceof Error ? error : undefined,
				{ table: this.table, id }
			);
		}
	}

	/**
	 * Execute a custom query within this repository's context
	 */
	protected async executeQuery<R>(fn: (db: Database) => Promise<R>): Promise<R> {
		try {
			return await fn(this.db);
		} catch (error) {
			throw new DatabaseError(
				"Failed to execute query",
				error instanceof Error ? error : undefined,
				{ table: this.table }
			);
		}
	}

	/**
	 * Execute operations within a transaction
	 */
	protected async withTransaction<R>(fn: (tx: Transaction) => Promise<R>): Promise<R> {
		return withTransaction(this.db, fn);
	}
}
