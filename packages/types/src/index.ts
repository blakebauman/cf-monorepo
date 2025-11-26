/**
 * Shared types across the monorepo
 */

export interface Env {
	// Cloudflare bindings
	HYPERDRIVE?: Hyperdrive;
	RATE_LIMITER?: {
		limit: (options: {
			key: string;
			limit: number;
			window: number;
		}) => Promise<{
			success: boolean;
			limit: number;
			remaining: number;
			reset: number;
		}>;
	};
	// Environment variables
	DATABASE_URL?: string;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	ENVIRONMENT?: "development" | "production";
	// OAuth providers
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	DISCORD_CLIENT_ID?: string;
	DISCORD_CLIENT_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	// Logging
	LOG_AGGREGATION_ENDPOINT?: string;
	LOG_AGGREGATION_API_KEY?: string;
}

export interface Hyperdrive {
	connectionString: string;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
