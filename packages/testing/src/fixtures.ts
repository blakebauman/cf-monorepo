/**
 * Test data fixtures for consistent testing
 */

/**
 * User test fixtures
 */
export const userFixtures = {
	validUser: {
		id: 1,
		email: "test@example.com",
		name: "Test User",
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-01T00:00:00Z"),
	},
	adminUser: {
		id: 2,
		email: "admin@example.com",
		name: "Admin User",
		role: "admin",
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-01T00:00:00Z"),
	},
	invalidUser: {
		email: "invalid-email",
		name: "",
	},
};

/**
 * HTTP request fixtures
 */
export const requestFixtures = {
	validPost: {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title: "Test Post",
			content: "Test content",
		}),
	},
	validAuth: {
		method: "GET",
		headers: {
			Authorization: "Bearer valid-token",
			"Content-Type": "application/json",
		},
	},
	invalidAuth: {
		method: "GET",
		headers: {
			Authorization: "Bearer invalid-token",
			"Content-Type": "application/json",
		},
	},
};

/**
 * HTTP response fixtures
 */
export const responseFixtures = {
	success: {
		success: true,
		data: { message: "Operation successful" },
		meta: {
			timestamp: new Date().toISOString(),
			version: "1.0.0",
		},
	},
	error: {
		success: false,
		error: {
			code: "VALIDATION_ERROR",
			message: "Invalid input provided",
		},
		meta: {
			timestamp: new Date().toISOString(),
			version: "1.0.0",
		},
	},
	notFound: {
		success: false,
		error: {
			code: "NOT_FOUND_ERROR",
			message: "Resource not found",
		},
	},
	unauthorized: {
		success: false,
		error: {
			code: "AUTHENTICATION_ERROR",
			message: "Authentication required",
		},
	},
};

/**
 * Database fixtures
 */
export const dbFixtures = {
	users: [
		{
			id: 1,
			email: "user1@example.com",
			name: "User One",
			isActive: true,
			createdAt: new Date("2024-01-01T00:00:00Z"),
		},
		{
			id: 2,
			email: "user2@example.com",
			name: "User Two",
			isActive: true,
			createdAt: new Date("2024-01-02T00:00:00Z"),
		},
		{
			id: 3,
			email: "inactive@example.com",
			name: "Inactive User",
			isActive: false,
			createdAt: new Date("2024-01-03T00:00:00Z"),
		},
	],
	sessions: [
		{
			id: "session-1",
			userId: 1,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
			createdAt: new Date(),
		},
		{
			id: "expired-session",
			userId: 2,
			expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
			createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
		},
	],
};

/**
 * Environment fixtures
 */
export const envFixtures = {
	development: {
		ENVIRONMENT: "development",
		BETTER_AUTH_SECRET: "dev-secret-key-for-testing-purposes",
		BETTER_AUTH_URL: "http://localhost:8787",
		DATABASE_URL: "postgresql://dev:dev@localhost:5432/dev",
	},
	production: {
		ENVIRONMENT: "production",
		BETTER_AUTH_SECRET: "prod-secret-key",
		BETTER_AUTH_URL: "https://api.example.com",
		DATABASE_URL: "postgresql://prod:prod@db.example.com:5432/prod",
	},
	test: {
		ENVIRONMENT: "test",
		BETTER_AUTH_SECRET: "test-secret-key-for-testing-only",
		BETTER_AUTH_URL: "http://localhost:8787",
		DATABASE_URL: "postgresql://test:test@localhost:5432/test",
	},
};

/**
 * OpenAPI fixtures
 */
export const openApiFixtures = {
	userSchema: {
		type: "object",
		required: ["id", "email"],
		properties: {
			id: {
				type: "integer",
				example: 1,
			},
			email: {
				type: "string",
				format: "email",
				example: "user@example.com",
			},
			name: {
				type: "string",
				example: "John Doe",
			},
			createdAt: {
				type: "string",
				format: "date-time",
				example: "2024-01-01T00:00:00Z",
			},
		},
	},
	errorSchema: {
		type: "object",
		required: ["success", "error"],
		properties: {
			success: {
				type: "boolean",
				example: false,
			},
			error: {
				type: "object",
				required: ["code", "message"],
				properties: {
					code: {
						type: "string",
						example: "VALIDATION_ERROR",
					},
					message: {
						type: "string",
						example: "Invalid input provided",
					},
				},
			},
		},
	},
};

/**
 * Performance test fixtures
 */
export const performanceFixtures = {
	largeDataset: Array.from({ length: 10000 }, (_, i) => ({
		id: i + 1,
		name: `Item ${i + 1}`,
		value: Math.random() * 1000,
		timestamp: new Date(Date.now() - i * 1000),
	})),
	smallDataset: Array.from({ length: 10 }, (_, i) => ({
		id: i + 1,
		name: `Item ${i + 1}`,
		value: Math.random() * 100,
	})),
};

/**
 * Creates a fixture with random data
 */
export function createRandomFixture(type: "user" | "post" | "session") {
	const timestamp = new Date();
	const id = Math.floor(Math.random() * 10000);

	switch (type) {
		case "user":
			return {
				id,
				email: `user${id}@example.com`,
				name: `Test User ${id}`,
				isActive: Math.random() > 0.5,
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		case "post":
			return {
				id,
				title: `Test Post ${id}`,
				content: `This is test content for post ${id}`,
				authorId: Math.floor(Math.random() * 100),
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		case "session":
			return {
				id: `session-${id}`,
				userId: Math.floor(Math.random() * 100),
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				createdAt: timestamp,
			};
		default:
			throw new Error(`Unknown fixture type: ${type}`);
	}
}

/**
 * Creates multiple random fixtures
 */
export function createRandomFixtures<T>(type: "user" | "post" | "session", count: number): T[] {
	return Array.from({ length: count }, () => createRandomFixture(type) as T);
}
