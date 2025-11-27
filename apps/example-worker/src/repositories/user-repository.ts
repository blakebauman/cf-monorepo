/**
 * User repository for database operations
 */

import { BaseRepository, type Database, type User, users } from "@repo/db";
import { eq, type SQL } from "drizzle-orm";

/**
 * User repository extending BaseRepository
 */
export class UserRepository extends BaseRepository<User> {
	constructor(db: Database) {
		super(db, users);
	}

	/**
	 * Get the ID column for users table
	 */
	protected getIdColumn(): SQL {
		return users.id as unknown as SQL;
	}

	/**
	 * Get default order by column (createdAt for users)
	 */
	protected getDefaultOrderBy(): SQL {
		return users.createdAt as unknown as SQL;
	}

	/**
	 * Find user by email
	 */
	async findByEmail(email: string): Promise<User | null> {
		const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

		return user ?? null;
	}

	/**
	 * Check if email exists
	 */
	async emailExists(email: string): Promise<boolean> {
		const user = await this.findByEmail(email);
		return user !== null;
	}
}
