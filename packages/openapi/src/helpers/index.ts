/**
 * Helper utilities for OpenAPI schemas
 */

export {
	createInputSchema,
	createResourceSchema,
	makeFieldsOptional,
	makeFieldsRequired,
	makeOptional,
	updateInputSchema,
	withAudit,
	withId,
	withSoftDelete,
	withTimestamps,
} from "./composition";
export {
	allValid,
	createValidator,
	parseOrNull,
	parseOrThrow,
	validate,
	validateBatch,
} from "./validation";
