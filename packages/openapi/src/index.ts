/**
 * @repo/openapi
 * Shared OpenAPI schemas and utilities
 */

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
