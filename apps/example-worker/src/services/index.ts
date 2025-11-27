/**
 * Service factory
 * Creates all service instances with database connection
 */

import type { Database } from "@repo/db";
import { UserService } from "./user-service";

export function createServices(db: Database) {
	return {
		user: new UserService(db),
	};
}

export type Services = ReturnType<typeof createServices>;
