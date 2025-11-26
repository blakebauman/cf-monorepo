/**
 * Shared constants for the Cloudflare Workers monorepo
 */

// Environment constants
export const ENVIRONMENTS = {
	DEVELOPMENT: "development",
	STAGING: "staging",
	PRODUCTION: "production",
} as const;

export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

// HTTP Status codes
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes
export const ERROR_CODES = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
	AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
	NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
	CONFLICT_ERROR: "CONFLICT_ERROR",
	RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
	DATABASE_ERROR: "DATABASE_ERROR",
	EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
	INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Cache TTL values (in seconds)
export const CACHE_TTL = {
	SHORT: 60, // 1 minute
	MEDIUM: 300, // 5 minutes
	LONG: 3600, // 1 hour
	DAY: 86400, // 24 hours
	WEEK: 604800, // 7 days
} as const;

// Rate limiting
export const RATE_LIMITS = {
	DEFAULT: {
		requests: 100,
		window: 60, // per minute
	},
	AUTH: {
		requests: 10,
		window: 60, // per minute
	},
	UPLOAD: {
		requests: 20,
		window: 60, // per minute
	},
	API: {
		requests: 1000,
		window: 60, // per minute
	},
} as const;

// Cloudflare Workers limits
export const WORKERS_LIMITS = {
	CPU_TIME_FREE: 10, // ms
	CPU_TIME_PAID: 30000, // ms
	MEMORY_LIMIT: 128, // MB
	REQUEST_SIZE_LIMIT: 100, // MB
	RESPONSE_SIZE_LIMIT: 100, // MB
	CONCURRENT_CONNECTIONS: 6,
	KV_VALUE_SIZE_LIMIT: 25, // MB
	R2_OBJECT_SIZE_LIMIT: 5000, // MB (5GB)
} as const;

// Database constants
export const DATABASE = {
	CONNECTION_TIMEOUT: 30000, // 30 seconds
	QUERY_TIMEOUT: 10000, // 10 seconds
	MAX_CONNECTIONS: 20,
	IDLE_TIMEOUT: 60000, // 1 minute
} as const;

// Auth constants
export const AUTH = {
	SESSION_DURATION: 7 * 24 * 60 * 60, // 7 days in seconds
	REFRESH_TOKEN_DURATION: 30 * 24 * 60 * 60, // 30 days in seconds
	PASSWORD_MIN_LENGTH: 8,
	PASSWORD_MAX_LENGTH: 128,
	MAX_LOGIN_ATTEMPTS: 5,
	LOCKOUT_DURATION: 15 * 60, // 15 minutes in seconds
} as const;

// API versioning
export const API_VERSIONS = {
	V1: "v1",
	V2: "v2",
	LATEST: "v1",
} as const;

// Content types
export const CONTENT_TYPES = {
	JSON: "application/json",
	TEXT: "text/plain",
	HTML: "text/html",
	XML: "application/xml",
	FORM: "application/x-www-form-urlencoded",
	MULTIPART: "multipart/form-data",
	BINARY: "application/octet-stream",
} as const;

// Security headers
export const SECURITY_HEADERS = {
	CSP: "Content-Security-Policy",
	HSTS: "Strict-Transport-Security",
	X_CONTENT_TYPE_OPTIONS: "X-Content-Type-Options",
	X_FRAME_OPTIONS: "X-Frame-Options",
	X_XSS_PROTECTION: "X-XSS-Protection",
	REFERRER_POLICY: "Referrer-Policy",
	PERMISSIONS_POLICY: "Permissions-Policy",
} as const;

// Default security header values
export const SECURITY_HEADER_VALUES = {
	CSP: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
	HSTS: "max-age=31536000; includeSubDomains",
	X_CONTENT_TYPE_OPTIONS: "nosniff",
	X_FRAME_OPTIONS: "DENY",
	X_XSS_PROTECTION: "1; mode=block",
	REFERRER_POLICY: "strict-origin-when-cross-origin",
	PERMISSIONS_POLICY: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
} as const;

// Logging levels
export const LOG_LEVELS = {
	ERROR: "error",
	WARN: "warn",
	INFO: "info",
	DEBUG: "debug",
	TRACE: "trace",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

// Request ID header
export const REQUEST_ID_HEADER = "x-request-id";

// Common regex patterns
export const REGEX_PATTERNS = {
	EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
	URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
	SEMVER: /^\d+\.\d+\.\d+$/,
	SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;
