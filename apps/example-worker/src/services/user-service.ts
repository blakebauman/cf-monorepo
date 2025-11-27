/**
 * User service for database operations
 * All database queries for users must go through this service class
 */

import type { Database } from "@repo/db";
import { users } from "@repo/db";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { count, desc, eq } from "drizzle-orm";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export class UserService {
	constructor(private readonly db: Database) {}

	/**
	 * Get all users with pagination
	 */
	async findAll(options?: { limit?: number; offset?: number }): Promise<User[]> {
		const limit = options?.limit ?? 100;
		const offset = options?.offset ?? 0;

		return this.db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
	}

	/**
	 * Get user by ID
	 */
	async findById(id: number): Promise<User | null> {
		const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

		return user ?? null;
	}

	/**
	 * Get user by email
	 */
	async findByEmail(email: string): Promise<User | null> {
		const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

		return user ?? null;
	}

	/**
	 * Create a new user
	 */
	async create(data: NewUser): Promise<User> {
		const [user] = await this.db.insert(users).values(data).returning();

		if (!user) {
			throw new Error("Failed to create user");
		}

		return user;
	}

	/**
	 * Update user by ID
	 */
	async update(id: number, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User | null> {
		const [updated] = await this.db
			.update(users)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning();

		return updated ?? null;
	}

	/**
	 * Delete user by ID
	 */
	async delete(id: number): Promise<boolean> {
		const [deleted] = await this.db.delete(users).where(eq(users.id, id)).returning();

		return deleted !== undefined;
	}

	/**
	 * Count total users
	 */
	async count(): Promise<number> {
		const result = await this.db.select({ total: count() }).from(users);
		const first = result[0];

		return first?.total ?? 0;
	}
}
