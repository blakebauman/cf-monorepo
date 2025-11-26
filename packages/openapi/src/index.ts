/**
 * @cf-monorepo/openapi
 * Shared OpenAPI schemas and utilities
 */

// Response schemas
export {
	BaseApiResponseSchema,
	SuccessResponseSchema,
	ErrorResponseSchema,
	PaginationSchema,
	PaginatedResponseSchema,
	NotFoundResponseSchema,
	UnauthorizedResponseSchema,
	ForbiddenResponseSchema,
	BadRequestResponseSchema,
	InternalServerErrorResponseSchema,
	TooManyRequestsResponseSchema,
	standardErrorResponses,
} from "./responses";

// Request schemas
export {
	PaginationQuerySchema,
	SortQuerySchema,
	SearchQuerySchema,
	IdParamSchema,
	CommonHeadersSchema,
} from "./requests";
