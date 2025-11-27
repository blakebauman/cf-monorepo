/**
 * User service for business logic
 * Uses UserRepository for data access
 */

import type { User } from "@repo/db";
import { ConflictError } from "@repo/errors";
import type { UserRepository } from "../repositories/user-repository";

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUser = Partial<Omit<User, "id" | "createdAt" | "updatedAt">>;

/**
 * User service with business logic
 */
export class UserService {
	constructor(private readonly repo: UserRepository) {}

	/**
	 * Get all users with pagination
	 */
	async findAll(options?: { limit?: number; offset?: number }): Promise<User[]> {
		return this.repo.findAll(options);
	}

	/**
	 * Get all users with pagination metadata
	 */
	async findAllPaginated(options?: { page?: number; limit?: number }) {
		return this.repo.findAllPaginated(options);
	}

	/**
	 * Get user by ID
	 */
	async findById(id: number): Promise<User | null> {
		return this.repo.findById(id);
	}

	/**
	 * Get user by ID or throw NotFoundError
	 */
	async findByIdOrThrow(id: number): Promise<User> {
		return this.repo.findByIdOrThrow(id, "User");
	}

	/**
	 * Get user by email
	 */
	async findByEmail(email: string): Promise<User | null> {
		return this.repo.findByEmail(email);
	}

	/**
	 * Create a new user
	 * Validates that email doesn't already exist
	 */
	async create(data: NewUser): Promise<User> {
		// Business logic: check if email already exists
		const existing = await this.repo.findByEmail(data.email);
		if (existing) {
			throw new ConflictError("Email already exists", { email: data.email });
		}

		return this.repo.create(data);
	}

	/**
	 * Update user by ID
	 */
	async update(id: number, data: UpdateUser): Promise<User | null> {
		return this.repo.update(id, data);
	}

	/**
	 * Update user by ID or throw NotFoundError
	 */
	async updateOrThrow(id: number, data: UpdateUser): Promise<User> {
		return this.repo.updateOrThrow(id, data, "User");
	}

	/**
	 * Delete user by ID
	 */
	async delete(id: number): Promise<boolean> {
		return this.repo.delete(id);
	}

	/**
	 * Delete user by ID or throw NotFoundError
	 */
	async deleteOrThrow(id: number): Promise<void> {
		return this.repo.deleteOrThrow(id, "User");
	}

	/**
	 * Count total users
	 */
	async count(): Promise<number> {
		return this.repo.count();
	}

	/**
	 * Check if user exists by ID
	 */
	async exists(id: number): Promise<boolean> {
		return this.repo.exists(id);
	}

	/**
	 * Check if email exists
	 */
	async emailExists(email: string): Promise<boolean> {
		return this.repo.emailExists(email);
	}
}
