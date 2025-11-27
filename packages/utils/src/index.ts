/**
 * Shared utilities across the monorepo
 */

import type { ApiResponse, PaginatedResponse } from "@repo/types";

/**
 * Creates a successful API response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
	return {
		success: true,
		data,
		...(message && { message }),
	};
}

/**
 * Creates an error API response
 */
export function errorResponse(error: string, message?: string): ApiResponse {
	return {
		success: false,
		error,
		...(message && { message }),
	};
}

/**
 * Creates a paginated response
 */
export function paginatedResponse<T>(
	data: T[],
	page: number,
	limit: number,
	total: number
): PaginatedResponse<T> {
	return {
		success: true,
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

/**
 * Parses JSON safely
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		return JSON.parse(json) as T;
	} catch {
		return fallback;
	}
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
