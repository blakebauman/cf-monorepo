/**
 * User API routes
 */

import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import {
	IdParamSchema,
	ListQuerySchema,
	PaginatedResponseSchema,
	SuccessResponseSchema,
	standardErrorResponses,
} from "@repo/openapi";
import { successResponse } from "@repo/utils";
import { UserDTO } from "../dto";
import { CreateUserBodySchema, UpdateUserBodySchema, UserSchema } from "../schemas";
import type { NewUser } from "../services/user-service";
import type { Context } from "../types";

/**
 * User response schema
 */
const UserResponseSchema = SuccessResponseSchema.extend({
	data: UserSchema,
}).openapi("UserResponse");

/**
 * Users list response schema
 */
const UsersResponseSchema = SuccessResponseSchema.extend({
	data: PaginatedResponseSchema(UserSchema).shape.data,
	pagination: PaginatedResponseSchema(UserSchema).shape.pagination,
}).openapi("UsersResponse");

/**
 * Get all users route
 */
const getUsersRoute = createRoute({
	method: "get",
	path: "/api/users",
	summary: "Get all users",
	description: "Returns a paginated list of all users",
	request: {
		query: ListQuerySchema,
	},
	responses: {
		200: {
			description: "Users retrieved successfully",
			content: {
				"application/json": {
					schema: UsersResponseSchema,
				},
			},
		},
		...standardErrorResponses,
	},
});

/**
 * Get user by ID route
 */
const getUserRoute = createRoute({
	method: "get",
	path: "/api/users/{id}",
	summary: "Get user by ID",
	description: "Returns a single user by ID",
	request: {
		params: IdParamSchema,
	},
	responses: {
		200: {
			description: "User retrieved successfully",
			content: {
				"application/json": {
					schema: UserResponseSchema,
				},
			},
		},
		...standardErrorResponses,
	},
});

/**
 * Create user route
 */
const createUserRoute = createRoute({
	method: "post",
	path: "/api/users",
	summary: "Create a new user",
	description: "Creates a new user",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateUserBodySchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "User created successfully",
			content: {
				"application/json": {
					schema: UserResponseSchema,
				},
			},
		},
		...standardErrorResponses,
	},
});

/**
 * Update user route
 */
const updateUserRoute = createRoute({
	method: "put",
	path: "/api/users/{id}",
	summary: "Update user",
	description: "Updates an existing user",
	request: {
		params: IdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateUserBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "User updated successfully",
			content: {
				"application/json": {
					schema: UserResponseSchema,
				},
			},
		},
		...standardErrorResponses,
	},
});

/**
 * Delete user route
 */
const deleteUserRoute = createRoute({
	method: "delete",
	path: "/api/users/{id}",
	summary: "Delete user",
	description: "Deletes a user by ID",
	request: {
		params: IdParamSchema,
	},
	responses: {
		204: {
			description: "User deleted successfully",
		},
		...standardErrorResponses,
	},
});

/**
 * Register user routes
 */
export function registerUserRoutes(app: OpenAPIHono<Context>) {
	// Get all users
	app.openapi(getUsersRoute, async (c) => {
		const query = c.req.valid("query");
		const services = c.get("services");

		const result = await services.user.findAllPaginated({
			page: query.page,
			limit: query.limit,
		});

		return c.json({
			success: true,
			data: UserDTO.toResponses(result.data),
			pagination: result.pagination,
		});
	});

	// Get user by ID
	app.openapi(getUserRoute, async (c) => {
		const { id } = c.req.valid("param");
		const services = c.get("services");

		const user = await services.user.findByIdOrThrow(Number(id));

		return c.json(successResponse(UserDTO.toResponse(user)) as never);
	});

	// Create user
	app.openapi(createUserRoute, async (c) => {
		const body = c.req.valid("json");
		const services = c.get("services");

		const user = await services.user.create(body as NewUser);

		return c.json(successResponse(UserDTO.toResponse(user)) as never, 201);
	});

	// Update user
	app.openapi(updateUserRoute, async (c) => {
		const { id } = c.req.valid("param");
		const body = c.req.valid("json");
		const services = c.get("services");

		const user = await services.user.updateOrThrow(Number(id), body);

		return c.json(successResponse(UserDTO.toResponse(user)) as never);
	});

	// Delete user
	app.openapi(deleteUserRoute, async (c) => {
		const { id } = c.req.valid("param");
		const services = c.get("services");

		await services.user.deleteOrThrow(Number(id));

		return c.body(null, 204);
	});
}
