/**
 * Database configuration for different environments
 */

import { DATABASE } from "@cf-monorepo/constants";
import type { Env } from "@cf-monorepo/types";
import { ENVIRONMENTS, getEnvironment } from "./index";

export interface DatabaseConfig {
	connectionTimeout: number;
	queryTimeout: number;
	maxConnections: number;
	idleTimeout: number;
	retryAttempts: number;
	retryDelay: number;
	enableQueryLogging: boolean;
	enableSlowQueryLogging: boolean;
	slowQueryThreshold: number;
}

/**
 * Gets database configuration for the current environment
 */
export function getDatabaseConfig(env: Partial<Env>): DatabaseConfig {
	const environment = getEnvironment(env);

	const baseConfig: DatabaseConfig = {
		connectionTimeout: DATABASE.CONNECTION_TIMEOUT,
		queryTimeout: DATABASE.QUERY_TIMEOUT,
		maxConnections: DATABASE.MAX_CONNECTIONS,
		idleTimeout: DATABASE.IDLE_TIMEOUT,
		retryAttempts: 3,
		retryDelay: 1000,
		enableQueryLogging: false,
		enableSlowQueryLogging: true,
		slowQueryThreshold: 1000, // 1 second
	};

	switch (environment) {
		case ENVIRONMENTS.DEVELOPMENT:
			return {
				...baseConfig,
				enableQueryLogging: true,
				slowQueryThreshold: 500, // More aggressive in development
				maxConnections: 5, // Lower for development
			};

		case ENVIRONMENTS.STAGING:
			return {
				...baseConfig,
				enableQueryLogging: false,
				maxConnections: 10,
			};

		case ENVIRONMENTS.PRODUCTION:
			return {
				...baseConfig,
				enableQueryLogging: false,
				queryTimeout: 5000, // Shorter timeout in production
				retryAttempts: 5,
				maxConnections: 20,
			};

		default:
			return baseConfig;
	}
}

/**
 * Database connection pool configuration
 */
export interface PoolConfig {
	min: number;
	max: number;
	acquireTimeoutMillis: number;
	createTimeoutMillis: number;
	destroyTimeoutMillis: number;
	idleTimeoutMillis: number;
	reapIntervalMillis: number;
	createRetryIntervalMillis: number;
}

/**
 * Gets connection pool configuration
 */
export function getPoolConfig(env: Partial<Env>): PoolConfig {
	const environment = getEnvironment(env);

	const baseConfig: PoolConfig = {
		min: 0,
		max: 10,
		acquireTimeoutMillis: 60000,
		createTimeoutMillis: 30000,
		destroyTimeoutMillis: 5000,
		idleTimeoutMillis: 300000, // 5 minutes
		reapIntervalMillis: 1000,
		createRetryIntervalMillis: 2000,
	};

	switch (environment) {
		case ENVIRONMENTS.DEVELOPMENT:
			return {
				...baseConfig,
				min: 1,
				max: 3,
				idleTimeoutMillis: 60000, // 1 minute in dev
			};

		case ENVIRONMENTS.STAGING:
			return {
				...baseConfig,
				min: 2,
				max: 8,
			};

		case ENVIRONMENTS.PRODUCTION:
			return {
				...baseConfig,
				min: 5,
				max: 20,
			};

		default:
			return baseConfig;
	}
}

/**
 * Validates database URL format
 */
export function validateDatabaseUrl(databaseUrl: string): void {
	try {
		const url = new URL(databaseUrl);

		if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
			throw new Error("Database URL must use postgres:// or postgresql:// protocol");
		}

		if (!url.hostname) {
			throw new Error("Database URL must include hostname");
		}

		if (!url.pathname || url.pathname === "/") {
			throw new Error("Database URL must include database name");
		}
	} catch (error) {
		if (error instanceof TypeError) {
			throw new Error("Invalid database URL format");
		}
		throw error;
	}
}

/**
 * Gets database configuration with validation
 */
export function getValidatedDatabaseConfig(env: Partial<Env>): DatabaseConfig {
	if (!env.DATABASE_URL) {
		throw new Error("DATABASE_URL environment variable is required");
	}

	validateDatabaseUrl(env.DATABASE_URL);
	return getDatabaseConfig(env);
}
