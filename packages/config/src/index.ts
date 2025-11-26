/**
 * Configuration management for the Cloudflare Workers monorepo
 */

import { ENVIRONMENTS, type Environment } from "@cf-monorepo/constants";

// Re-export for other files in this package
export { ENVIRONMENTS };
import type { Env } from "@cf-monorepo/types";

export * from "./cors";
export * from "./database";
export * from "./auth";
export * from "./security";
export * from "./logging";

/**
 * Base configuration interface
 */
export interface BaseConfig {
	environment: Environment;
	debug: boolean;
	version: string;
}

/**
 * Gets the current environment from env variables
 */
export function getEnvironment(env: Partial<Env>): Environment {
	const envValue = env.ENVIRONMENT?.toLowerCase();

	switch (envValue) {
		case ENVIRONMENTS.DEVELOPMENT:
		case ENVIRONMENTS.STAGING:
		case ENVIRONMENTS.PRODUCTION:
			return envValue;
		default:
			return ENVIRONMENTS.DEVELOPMENT;
	}
}

/**
 * Checks if running in development mode
 */
export function isDevelopment(env: Partial<Env>): boolean {
	return getEnvironment(env) === ENVIRONMENTS.DEVELOPMENT;
}

/**
 * Checks if running in staging mode
 */
export function isStaging(env: Partial<Env>): boolean {
	return getEnvironment(env) === ENVIRONMENTS.STAGING;
}

/**
 * Checks if running in production mode
 */
export function isProduction(env: Partial<Env>): boolean {
	return getEnvironment(env) === ENVIRONMENTS.PRODUCTION;
}

/**
 * Gets base configuration
 */
export function getBaseConfig(env: Partial<Env>): BaseConfig {
	const environment = getEnvironment(env);

	return {
		environment,
		debug: environment === ENVIRONMENTS.DEVELOPMENT,
		version: "1.0.0", // TODO: Get from package.json or build process
	};
}

/**
 * Validates required environment variables
 */
export function validateEnvironment(env: Partial<Env>): void {
	const required = ["DATABASE_URL", "BETTER_AUTH_SECRET"];
	const missing = required.filter((key) => !env[key as keyof Env]);

	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
	}

	// Validate BETTER_AUTH_SECRET length
	if (env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length < 32) {
		throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
	}
}

/**
 * Gets configuration with validation
 */
export function getConfig(env: Partial<Env>): BaseConfig {
	validateEnvironment(env);
	return getBaseConfig(env);
}

/**
 * Feature flags based on environment
 */
export interface FeatureFlags {
	enableDebugLogs: boolean;
	enableMetrics: boolean;
	enableTracing: boolean;
	enableRateLimiting: boolean;
	enableCaching: boolean;
}

/**
 * Gets feature flags for the current environment
 */
export function getFeatureFlags(env: Partial<Env>): FeatureFlags {
	const environment = getEnvironment(env);

	return {
		enableDebugLogs: environment === ENVIRONMENTS.DEVELOPMENT,
		enableMetrics: environment !== ENVIRONMENTS.DEVELOPMENT,
		enableTracing: environment === ENVIRONMENTS.PRODUCTION,
		enableRateLimiting: environment !== ENVIRONMENTS.DEVELOPMENT,
		enableCaching: environment !== ENVIRONMENTS.DEVELOPMENT,
	};
}
