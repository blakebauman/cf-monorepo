/**
 * Base DTO utilities for transforming domain models to API responses
 */

/**
 * Options for DTO transformation
 */
export interface DTOOptions {
	/**
	 * Fields to exclude from the DTO
	 */
	exclude?: string[];
	/**
	 * Fields to include (if not specified, includes all except excluded)
	 */
	include?: string[];
	/**
	 * Transform dates to ISO strings
	 */
	serializeDates?: boolean;
	/**
	 * Transform null to undefined
	 */
	removeNulls?: boolean;
}

/**
 * Base DTO class with transformation utilities
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Intentionally designed to be extended for DTO organization
export class BaseDTO {
	/**
	 * Transform a domain model to a DTO, excluding sensitive fields
	 */
	static toDTO<T extends Record<string, unknown>>(data: T, options: DTOOptions = {}): Partial<T> {
		const { exclude = [], include, serializeDates = true, removeNulls = false } = options;

		const result: Partial<T> = {};

		for (const [key, value] of Object.entries(data)) {
			// Skip excluded fields
			if (exclude.includes(key)) {
				continue;
			}

			// Skip if include list is provided and key is not in it
			if (include && !include.includes(key)) {
				continue;
			}

			// Skip null values if removeNulls is true
			if (removeNulls && value === null) {
				continue;
			}

			// Serialize dates to ISO strings
			if (serializeDates && value instanceof Date) {
				result[key as keyof T] = value.toISOString() as T[keyof T];
				continue;
			}

			result[key as keyof T] = value as T[keyof T];
		}

		return result;
	}

	/**
	 * Transform multiple domain models to DTOs
	 */
	static toDTOs<T extends Record<string, unknown>>(
		data: T[],
		options: DTOOptions = {}
	): Partial<T>[] {
		return data.map((item) => BaseDTO.toDTO(item, options));
	}

	/**
	 * Pick specific fields from a model
	 */
	static pick<T extends Record<string, unknown>, K extends keyof T>(
		data: T,
		fields: K[]
	): Pick<T, K> {
		const result = {} as Pick<T, K>;

		for (const field of fields) {
			if (field in data) {
				result[field] = data[field];
			}
		}

		return result;
	}

	/**
	 * Omit specific fields from a model
	 */
	static omit<T extends Record<string, unknown>, K extends keyof T>(
		data: T,
		fields: K[]
	): Omit<T, K> {
		const result = { ...data } as Omit<T, K>;

		for (const field of fields) {
			delete (result as Record<string, unknown>)[field as string];
		}

		return result;
	}

	/**
	 * Sanitize HTML in string fields to prevent XSS
	 */
	static sanitize<T extends Record<string, unknown>>(data: T): T {
		const result = { ...data };

		for (const [key, value] of Object.entries(result)) {
			if (typeof value === "string") {
				// Basic HTML entity encoding
				result[key as keyof T] = value
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#x27;")
					.replace(/\//g, "&#x2F;") as T[keyof T];
			}
		}

		return result;
	}
}

/**
 * Create a DTO transformer function with predefined options
 */
export function createDTOTransformer<T extends Record<string, unknown>>(options: DTOOptions) {
	return (data: T): Partial<T> => BaseDTO.toDTO(data, options);
}

/**
 * Common DTO transformers for typical use cases
 */
export const DTOTransformers = {
	/**
	 * Remove password fields and serialize dates
	 */
	secure: createDTOTransformer({
		exclude: ["password", "passwordHash", "passwordSalt", "secret", "token"],
		serializeDates: true,
	}),

	/**
	 * Remove all null values and serialize dates
	 */
	clean: createDTOTransformer({
		removeNulls: true,
		serializeDates: true,
	}),

	/**
	 * Public API response (remove internal fields)
	 */
	public: createDTOTransformer({
		exclude: [
			"password",
			"passwordHash",
			"passwordSalt",
			"secret",
			"token",
			"deletedAt",
			"internalNotes",
		],
		serializeDates: true,
		removeNulls: true,
	}),
};
