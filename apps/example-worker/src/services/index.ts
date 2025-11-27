/**
 * Service factory
 * Creates all service instances with database connection
 */

import type { Database } from "@repo/db";
import { UserRepository } from "../repositories";
import { UserService } from "./user-service";

/**
 * Create all services with repositories
 */
export function createServices(db: Database) {
	// Create repositories
	const userRepository = new UserRepository(db);

	// Create services with repositories
	return {
		user: new UserService(userRepository),
	};
}

export type Services = ReturnType<typeof createServices>;
