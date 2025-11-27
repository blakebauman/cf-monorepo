/**
 * Tests for error classes and utilities
 */

import { describe, expect, it } from "vitest";

import {
	AuthenticationError,
	AuthorizationError,
	BaseError,
	ConfigurationError,
	ConflictError,
	DatabaseError,
	ErrorSeverity,
	ExternalServiceError,
	formatErrorForLogging,
	getErrorMessage,
	getErrorStack,
	isBaseError,
	NotFoundError,
	RateLimitError,
	toBaseError,
	ValidationError,
} from "../index";

describe("Error Classes", () => {
	describe("BaseError", () => {
		it("should create error with required options", () => {
			const error = new BaseError({
				code: "TEST_ERROR",
				message: "Test error message",
			});

			expect(error.code).toBe("TEST_ERROR");
			expect(error.message).toBe("Test error message");
			expect(error.statusCode).toBe(500);
			expect(error.severity).toBe(ErrorSeverity.MEDIUM);
			expect(error.expose).toBe(false);
			expect(error.timestamp).toBeInstanceOf(Date);
		});

		it("should create error with all options", () => {
			const cause = new Error("Original error");
			const context = { userId: 123 };
			const error = new BaseError({
				code: "CUSTOM_ERROR",
				message: "Custom message",
				statusCode: 404,
				cause,
				context,
				severity: ErrorSeverity.HIGH,
				expose: true,
			});

			expect(error.statusCode).toBe(404);
			expect(error.cause).toBe(cause);
			expect(error.context).toEqual(context);
			expect(error.severity).toBe(ErrorSeverity.HIGH);
			expect(error.expose).toBe(true);
		});

		it("should serialize to JSON", () => {
			const error = new BaseError({
				code: "TEST_ERROR",
				message: "Test message",
				context: { field: "email" },
			});

			const json = error.toJSON();

			expect(json.name).toBe("BaseError");
			expect(json.code).toBe("TEST_ERROR");
			expect(json.message).toBe("Test message");
			expect(json.statusCode).toBe(500);
			expect(json.severity).toBe(ErrorSeverity.MEDIUM);
			expect(json.context).toEqual({ field: "email" });
			expect(json.timestamp).toBeTruthy();
			expect(json.stack).toBeTruthy();
		});

		it("should serialize to response format", () => {
			const error = new BaseError({
				code: "TEST_ERROR",
				message: "Test message",
				expose: true,
				context: { field: "email" },
			});

			const response = error.toResponse();

			expect(response.success).toBe(false);
			expect(response.error).toBe("TEST_ERROR");
			expect(response.message).toBe("Test message");
			expect(response.context).toEqual({ field: "email" });
		});

		it("should not expose details by default", () => {
			const error = new BaseError({
				code: "TEST_ERROR",
				message: "Sensitive message",
				expose: false,
			});

			const response = error.toResponse();

			expect(response.success).toBe(false);
			expect(response.error).toBe("TEST_ERROR");
			expect(response.message).toBeUndefined();
		});

		it("should expose details when includeDetails is true", () => {
			const error = new BaseError({
				code: "TEST_ERROR",
				message: "Debug message",
				expose: false,
			});

			const response = error.toResponse(true);

			expect(response.message).toBe("Debug message");
		});
	});

	describe("DatabaseError", () => {
		it("should create database error", () => {
			const error = new DatabaseError("Connection failed");

			expect(error).toBeInstanceOf(BaseError);
			expect(error.code).toBe("DATABASE_ERROR");
			expect(error.message).toBe("Connection failed");
			expect(error.statusCode).toBe(500);
			expect(error.severity).toBe(ErrorSeverity.HIGH);
			expect(error.expose).toBe(false);
		});

		it("should include cause and context", () => {
			const cause = new Error("Network error");
			const context = { query: "SELECT * FROM users" };
			const error = new DatabaseError("Query failed", cause, context);

			expect(error.cause).toBe(cause);
			expect(error.context).toEqual(context);
		});
	});

	describe("ValidationError", () => {
		it("should create validation error", () => {
			const error = new ValidationError("Invalid email format");

			expect(error.code).toBe("VALIDATION_ERROR");
			expect(error.message).toBe("Invalid email format");
			expect(error.statusCode).toBe(400);
			expect(error.severity).toBe(ErrorSeverity.LOW);
			expect(error.expose).toBe(true);
		});

		it("should include field context", () => {
			const error = new ValidationError("Required field", { field: "email" });

			expect(error.context).toEqual({ field: "email" });
		});
	});

	describe("AuthenticationError", () => {
		it("should create authentication error with default message", () => {
			const error = new AuthenticationError();

			expect(error.code).toBe("AUTHENTICATION_ERROR");
			expect(error.message).toBe("Authentication required");
			expect(error.statusCode).toBe(401);
			expect(error.expose).toBe(true);
		});

		it("should create authentication error with custom message", () => {
			const error = new AuthenticationError("Invalid token");

			expect(error.message).toBe("Invalid token");
		});
	});

	describe("AuthorizationError", () => {
		it("should create authorization error", () => {
			const error = new AuthorizationError();

			expect(error.code).toBe("AUTHORIZATION_ERROR");
			expect(error.message).toBe("Insufficient permissions");
			expect(error.statusCode).toBe(403);
		});

		it("should create with custom message", () => {
			const error = new AuthorizationError("Admin access required");

			expect(error.message).toBe("Admin access required");
		});
	});

	describe("NotFoundError", () => {
		it("should create not found error with resource", () => {
			const error = new NotFoundError("User");

			expect(error.code).toBe("NOT_FOUND_ERROR");
			expect(error.message).toBe("User not found");
			expect(error.statusCode).toBe(404);
			expect(error.context).toEqual({ resource: "User" });
		});

		it("should include identifier in context", () => {
			const error = new NotFoundError("User", 123);

			expect(error.context).toEqual({ resource: "User", identifier: 123 });
		});

		it("should work with string identifier", () => {
			const error = new NotFoundError("Post", "abc-123");

			expect(error.context).toEqual({ resource: "Post", identifier: "abc-123" });
		});
	});

	describe("ConflictError", () => {
		it("should create conflict error", () => {
			const error = new ConflictError("Email already exists");

			expect(error.code).toBe("CONFLICT_ERROR");
			expect(error.message).toBe("Email already exists");
			expect(error.statusCode).toBe(409);
		});
	});

	describe("RateLimitError", () => {
		it("should create rate limit error with default message", () => {
			const error = new RateLimitError();

			expect(error.code).toBe("RATE_LIMIT_ERROR");
			expect(error.message).toBe("Rate limit exceeded");
			expect(error.statusCode).toBe(429);
		});

		it("should include retryAfter in context", () => {
			const error = new RateLimitError("Too many requests", 60);

			expect(error.context?.retryAfter).toBe(60);
		});
	});

	describe("ExternalServiceError", () => {
		it("should create external service error", () => {
			const error = new ExternalServiceError("Stripe", "Payment failed");

			expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
			expect(error.message).toBe("Payment failed");
			expect(error.statusCode).toBe(502);
			expect(error.context).toEqual({ service: "Stripe" });
			expect(error.severity).toBe(ErrorSeverity.HIGH);
		});

		it("should include cause", () => {
			const cause = new Error("Network timeout");
			const error = new ExternalServiceError("API", "Request failed", cause);

			expect(error.cause).toBe(cause);
		});
	});

	describe("ConfigurationError", () => {
		it("should create configuration error", () => {
			const error = new ConfigurationError("Missing DATABASE_URL");

			expect(error.code).toBe("CONFIGURATION_ERROR");
			expect(error.message).toBe("Missing DATABASE_URL");
			expect(error.statusCode).toBe(500);
			expect(error.severity).toBe(ErrorSeverity.CRITICAL);
			expect(error.expose).toBe(false);
		});
	});
});

describe("Error Utilities", () => {
	describe("isBaseError", () => {
		it("should return true for BaseError instances", () => {
			const error = new BaseError({ code: "TEST", message: "Test" });
			expect(isBaseError(error)).toBe(true);
		});

		it("should return true for error subclasses", () => {
			const error = new ValidationError("Test");
			expect(isBaseError(error)).toBe(true);
		});

		it("should return false for standard Error", () => {
			const error = new Error("Test");
			expect(isBaseError(error)).toBe(false);
		});

		it("should return false for non-errors", () => {
			expect(isBaseError("error")).toBe(false);
			expect(isBaseError(null)).toBe(false);
			expect(isBaseError(undefined)).toBe(false);
		});
	});

	describe("getErrorMessage", () => {
		it("should extract message from Error", () => {
			const error = new Error("Test message");
			expect(getErrorMessage(error)).toBe("Test message");
		});

		it("should extract message from BaseError", () => {
			const error = new ValidationError("Invalid input");
			expect(getErrorMessage(error)).toBe("Invalid input");
		});

		it("should return string as-is", () => {
			expect(getErrorMessage("String error")).toBe("String error");
		});

		it("should return default message for unknown types", () => {
			expect(getErrorMessage(null)).toBe("An unknown error occurred");
			expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
			expect(getErrorMessage(123)).toBe("An unknown error occurred");
		});
	});

	describe("getErrorStack", () => {
		it("should extract stack from Error", () => {
			const error = new Error("Test");
			const stack = getErrorStack(error);
			expect(stack).toBeTruthy();
			expect(stack).toContain("Error: Test");
		});

		it("should return undefined for non-errors", () => {
			expect(getErrorStack("error")).toBeUndefined();
			expect(getErrorStack(null)).toBeUndefined();
		});
	});

	describe("toBaseError", () => {
		it("should return BaseError as-is", () => {
			const error = new ValidationError("Test");
			const result = toBaseError(error);
			expect(result).toBe(error);
		});

		it("should convert Error to BaseError", () => {
			const error = new Error("Original error");
			const result = toBaseError(error);

			expect(result).toBeInstanceOf(BaseError);
			expect(result.code).toBe("INTERNAL_ERROR");
			expect(result.message).toBe("Original error");
			expect(result.cause).toBe(error);
		});

		it("should convert string to BaseError", () => {
			const result = toBaseError("String error");

			expect(result).toBeInstanceOf(BaseError);
			expect(result.code).toBe("UNKNOWN_ERROR");
			expect(result.message).toBe("String error");
		});

		it("should convert unknown types to BaseError", () => {
			const result = toBaseError(null);

			expect(result).toBeInstanceOf(BaseError);
			expect(result.code).toBe("UNKNOWN_ERROR");
		});
	});

	describe("formatErrorForLogging", () => {
		it("should format error with request ID", () => {
			const error = new ValidationError("Invalid input");
			const formatted = formatErrorForLogging(error, "req-123");

			expect(formatted.requestId).toBe("req-123");
			expect(formatted.timestamp).toBeTruthy();
			expect(formatted.error.code).toBe("VALIDATION_ERROR");
			expect(formatted.error.message).toBe("Invalid input");
		});

		it("should use unknown request ID if not provided", () => {
			const error = new Error("Test");
			const formatted = formatErrorForLogging(error);

			expect(formatted.requestId).toBe("unknown");
		});

		it("should handle non-BaseError", () => {
			const error = new Error("Standard error");
			const formatted = formatErrorForLogging(error, "req-456");

			expect(formatted.error.code).toBe("INTERNAL_ERROR");
			expect(formatted.error.message).toBe("Standard error");
		});
	});
});
