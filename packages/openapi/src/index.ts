/**
 * @repo/openapi
 * Shared OpenAPI schemas and utilities
 */

// DTO utilities
export {
	BaseDTO,
	compose,
	createDTOTransformer,
	type DTOOptions,
	DTOTransformers,
	emptyStringsToNull,
	removeNulls,
	serializeTimestamps,
	stringToBoolean,
	transformers,
	trimStrings,
} from "./dto";
// Helper utilities
export {
	allValid,
	createInputSchema,
	createResourceSchema,
	createValidator,
	makeFieldsOptional,
	makeFieldsRequired,
	makeOptional,
	parseOrNull,
	parseOrThrow,
	updateInputSchema,
	validate,
	validateBatch,
	withAudit,
	withId,
	withSoftDelete,
	withTimestamps,
} from "./helpers";
// Request schemas
export {
	CommonHeadersSchema,
	IdParamSchema,
	PaginationQuerySchema,
	SearchQuerySchema,
	SortQuerySchema,
} from "./requests";
// Response schemas
export {
	BadRequestResponseSchema,
	BaseApiResponseSchema,
	ErrorResponseSchema,
	ForbiddenResponseSchema,
	InternalServerErrorResponseSchema,
	NotFoundResponseSchema,
	PaginatedResponseSchema,
	PaginationSchema,
	SuccessResponseSchema,
	standardErrorResponses,
	TooManyRequestsResponseSchema,
	UnauthorizedResponseSchema,
} from "./responses";
// Common schemas
export {
	Base64Schema,
	BooleanFilterQuerySchema,
	CursorPaginationQuerySchema,
	DateRangeQuerySchema,
	DateStringSchema,
	EmailSchema,
	HexColorSchema,
	JwtSchema,
	ListQuerySchema,
	NonNegativeIntSchema,
	PhoneSchema,
	PositiveIntSchema,
	SlugSchema,
	StatusFilterQuerySchema,
	UrlSchema,
	UuidSchema,
} from "./schemas";
