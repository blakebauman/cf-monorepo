/**
 * Common data transformers for DTOs
 */

/**
 * Transform database timestamps to ISO strings
 */
export function serializeTimestamps<T extends Record<string, unknown>>(data: T): T {
	const result = { ...data };

	for (const [key, value] of Object.entries(result)) {
		if (value instanceof Date) {
			result[key as keyof T] = value.toISOString() as T[keyof T];
		}
	}

	return result;
}

/**
 * Remove null values from object
 */
export function removeNulls<T extends Record<string, unknown>>(
	data: T
): { [K in keyof T]: Exclude<T[K], null> } {
	const result = {} as { [K in keyof T]: Exclude<T[K], null> };

	for (const [key, value] of Object.entries(data)) {
		if (value !== null) {
			result[key as keyof T] = value as Exclude<T[keyof T], null>;
		}
	}

	return result;
}

/**
 * Convert empty strings to null
 */
export function emptyStringsToNull<T extends Record<string, unknown>>(data: T): T {
	const result = { ...data };

	for (const [key, value] of Object.entries(result)) {
		if (value === "") {
			result[key as keyof T] = null as T[keyof T];
		}
	}

	return result;
}

/**
 * Trim all string values
 */
export function trimStrings<T extends Record<string, unknown>>(data: T): T {
	const result = { ...data };

	for (const [key, value] of Object.entries(result)) {
		if (typeof value === "string") {
			result[key as keyof T] = value.trim() as T[keyof T];
		}
	}

	return result;
}

/**
 * Convert string booleans to actual booleans
 */
export function stringToBoolean<T extends Record<string, unknown>>(data: T): T {
	const result = { ...data };

	for (const [key, value] of Object.entries(result)) {
		if (value === "true") {
			result[key as keyof T] = true as T[keyof T];
		} else if (value === "false") {
			result[key as keyof T] = false as T[keyof T];
		}
	}

	return result;
}

/**
 * Compose multiple transformers
 */
export function compose<T extends Record<string, unknown>>(
	...transformers: Array<(data: T) => T>
): (data: T) => T {
	return (data: T) => transformers.reduce((acc, transformer) => transformer(acc), data);
}

/**
 * Common transformation pipelines
 */
export const transformers = {
	/**
	 * Clean API input: trim strings, convert empty strings to null
	 */
	cleanInput: compose(trimStrings, emptyStringsToNull),

	/**
	 * Prepare API output: serialize dates, remove nulls
	 */
	prepareOutput: compose(serializeTimestamps, removeNulls),
};
