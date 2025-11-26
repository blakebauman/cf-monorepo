/**
 * Database utilities and connection
 */

import type { Env } from "@cf-monorepo/types";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Creates a Drizzle database instance
 * Works with both direct DATABASE_URL and Hyperdrive binding
 */
export function createDb(env: Env) {
	const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL || "";

	if (!connectionString) {
		throw new Error("DATABASE_URL or HYPERDRIVE binding is required for database connection");
	}

	const sql = neon(connectionString);
	return drizzle({ client: sql, schema });
}

export * from "./schema";
export type { NeonHttpDatabase } from "drizzle-orm/neon-http";
