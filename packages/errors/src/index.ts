/**
 * Centralized error handling for the monorepo
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

/**
 * Base error options
 */
export interface BaseErrorOptions {
	/**
	 * Error code (e.g., "DATABASE_ERROR", "VALIDATION_ERROR")
	 */
	code: string;
	/**
	 * Human-readable error message
	 */
	message: string;
	/**
	 * HTTP status code (default: 500)
	 */
	statusCode?: number;
	/**
	 * Original error that caused this error
	 */
	cause?: Error;
	/**
	 * Additional context data
	 */
	context?: Record<string, unknown>;
	/**
	 * Error severity
	 */
	severity?: ErrorSeverity;
	/**
	 * Whether to expose error details to client (default: false in production)
	 */
	expose?: boolean;
}

/**
 * Base error class for all custom errors
 */
export class BaseError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly cause?: Error;
	public readonly context?: Record<string, unknown>;
	public readonly severity: ErrorSeverity;
	public readonly expose: boolean;
	public readonly timestamp: Date;

	constructor(options: BaseErrorOptions) {
		super(options.message);
		this.name = this.constructor.name;
		this.code = options.code;
		this.statusCode = options.statusCode ?? 500;
		this.cause = options.cause;
		this.context = options.context;
		this.severity = options.severity ?? ErrorSeverity.MEDIUM;
		this.expose = options.expose ?? false;
		this.timestamp = new Date();

		// Maintain proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Serialize error to JSON for logging
	 */
	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
			severity: this.severity,
			context: this.context,
			timestamp: this.timestamp.toISOString(),
			cause: this.cause
				? {
						name: this.cause.name,
						message: this.cause.message,
						stack: this.cause.stack,
					}
				: undefined,
			stack: this.stack,
		};
	}

	/**
	 * Serialize error for API response
	 */
	toResponse(includeDetails = false) {
		const response: {
			success: false;
			error: string;
			message?: string;
			context?: Record<string, unknown>;
		} = {
			success: false,
			error: this.code,
		};

		if (this.expose || includeDetails) {
			response.message = this.message;
			if (this.context) {
				response.context = this.context;
			}
		}

		return response;
	}
}

/**
 * Database-related errors
 */
export class DatabaseError extends BaseError {
	constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
		super({
			code: "DATABASE_ERROR",
			message,
			statusCode: 500,
			cause,
			context,
			severity: ErrorSeverity.HIGH,
			expose: false,
		});
	}
}

/**
 * Validation errors (user input)
 */
export class ValidationError extends BaseError {
	constructor(message: string, context?: Record<string, unknown>) {
		super({
			code: "VALIDATION_ERROR",
			message,
			statusCode: 400,
			context,
			severity: ErrorSeverity.LOW,
			expose: true,
		});
	}
}

/**
 * Authentication errors
 */
export class AuthenticationError extends BaseError {
	constructor(message = "Authentication required", context?: Record<string, unknown>) {
		super({
			code: "AUTHENTICATION_ERROR",
			message,
			statusCode: 401,
			context,
			severity: ErrorSeverity.MEDIUM,
			expose: true,
		});
	}
}

/**
 * Authorization errors (insufficient permissions)
 */
export class AuthorizationError extends BaseError {
	constructor(message = "Insufficient permissions", context?: Record<string, unknown>) {
		super({
			code: "AUTHORIZATION_ERROR",
			message,
			statusCode: 403,
			context,
			severity: ErrorSeverity.MEDIUM,
			expose: true,
		});
	}
}

/**
 * Resource not found errors
 */
export class NotFoundError extends BaseError {
	constructor(resource: string, identifier?: string | number) {
		super({
			code: "NOT_FOUND_ERROR",
			message: `${resource} not found`,
			statusCode: 404,
			context: identifier ? { resource, identifier } : { resource },
			severity: ErrorSeverity.LOW,
			expose: true,
		});
	}
}

/**
 * Conflict errors (e.g., duplicate resources)
 */
export class ConflictError extends BaseError {
	constructor(message: string, context?: Record<string, unknown>) {
		super({
			code: "CONFLICT_ERROR",
			message,
			statusCode: 409,
			context,
			severity: ErrorSeverity.LOW,
			expose: true,
		});
	}
}

/**
 * Rate limit exceeded errors
 */
export class RateLimitError extends BaseError {
	constructor(
		message = "Rate limit exceeded",
		retryAfter?: number,
		context?: Record<string, unknown>
	) {
		super({
			code: "RATE_LIMIT_ERROR",
			message,
			statusCode: 429,
			context: { ...context, retryAfter },
			severity: ErrorSeverity.LOW,
			expose: true,
		});
	}
}

/**
 * External service errors (third-party APIs)
 */
export class ExternalServiceError extends BaseError {
	constructor(service: string, message: string, cause?: Error) {
		super({
			code: "EXTERNAL_SERVICE_ERROR",
			message,
			statusCode: 502,
			cause,
			context: { service },
			severity: ErrorSeverity.HIGH,
			expose: false,
		});
	}
}

/**
 * Configuration errors
 */
export class ConfigurationError extends BaseError {
	constructor(message: string, context?: Record<string, unknown>) {
		super({
			code: "CONFIGURATION_ERROR",
			message,
			statusCode: 500,
			context,
			severity: ErrorSeverity.CRITICAL,
			expose: false,
		});
	}
}

/**
 * Type guard to check if error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
	return error instanceof BaseError;
}

/**
 * Extract error message safely from any error type
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unknown error occurred";
}

/**
 * Extract error stack safely from any error type
 */
export function getErrorStack(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.stack;
	}
	return undefined;
}

/**
 * Convert any error to BaseError
 */
export function toBaseError(error: unknown): BaseError {
	if (isBaseError(error)) {
		return error;
	}

	if (error instanceof Error) {
		return new BaseError({
			code: "INTERNAL_ERROR",
			message: error.message,
			statusCode: 500,
			cause: error,
			severity: ErrorSeverity.HIGH,
			expose: false,
		});
	}

	return new BaseError({
		code: "UNKNOWN_ERROR",
		message: getErrorMessage(error),
		statusCode: 500,
		severity: ErrorSeverity.HIGH,
		expose: false,
	});
}

/**
 * Format error for logging with all relevant details
 */
export function formatErrorForLogging(error: unknown, requestId?: string) {
	const baseError = toBaseError(error);

	return {
		timestamp: new Date().toISOString(),
		requestId: requestId ?? "unknown",
		error: baseError.toJSON(),
	};
}
