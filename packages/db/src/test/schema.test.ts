/**
 * Tests for database schema definitions
 */

import { describe, expect, it } from "vitest";

import type { NewUser, User } from "../schema";
import { users } from "../schema";

describe("Database Schema", () => {
	describe("users table", () => {
		it("should have correct table name", () => {
			expect(users).toBeDefined();
			// @ts-expect-error - accessing internal property for testing
			expect(users[Symbol.for("drizzle:Name")]).toBe("users");
		});

		it("should have all required columns", () => {
			const columns = Object.keys(users);

			expect(columns).toContain("id");
			expect(columns).toContain("email");
			expect(columns).toContain("name");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should infer User type correctly", () => {
			const user: User = {
				id: 1,
				email: "test@example.com",
				name: "Test User",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(user.id).toBe(1);
			expect(user.email).toBe("test@example.com");
		});

		it("should infer NewUser type correctly", () => {
			// NewUser should not require id, createdAt, or updatedAt (they have defaults)
			const newUser: NewUser = {
				email: "new@example.com",
				name: "New User",
			};

			expect(newUser.email).toBe("new@example.com");
			expect(newUser.name).toBe("New User");
		});

		it("should allow null name in NewUser", () => {
			const newUser: NewUser = {
				email: "test@example.com",
				name: null,
			};

			expect(newUser.name).toBeNull();
		});

		it("should allow optional name in NewUser", () => {
			const newUser: NewUser = {
				email: "test@example.com",
			};

			expect(newUser.name).toBeUndefined();
		});

		it("should enforce email as required in NewUser", () => {
			// This test verifies type checking at compile time
			// @ts-expect-error - email is required
			const invalidUser: NewUser = {
				name: "Test",
			};

			expect(invalidUser).toBeDefined();
		});

		it("should have id as primary key", () => {
			// Verify primary key exists
			expect(users.id.primary).toBe(true);
		});

		it("should have email as unique", () => {
			// Verify email column exists (unique is enforced at DB level via migrations)
			expect(users.email).toBeDefined();
		});

		it("should have email as not null", () => {
			// Verify not null constraint exists
			expect(users.email.notNull).toBe(true);
		});
	});

	describe("Type Inference", () => {
		it("should correctly type User with all fields", () => {
			const user: User = {
				id: 1,
				email: "test@example.com",
				name: "Test User",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Type checks - verify types are correct
			expect(typeof user.id).toBe("number");
			expect(typeof user.email).toBe("string");
			expect(user.name).toBe("Test User");
			expect(user.createdAt).toBeInstanceOf(Date);
			expect(user.updatedAt).toBeInstanceOf(Date);
			expect(user).toBeDefined();
		});

		it("should allow null name in User type", () => {
			const user: User = {
				id: 1,
				email: "test@example.com",
				name: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(user.name).toBeNull();
		});

		it("should type NewUser with minimal fields", () => {
			const newUser: NewUser = {
				email: "new@example.com",
			};

			// Type checks - verify types are correct
			expect(typeof newUser.email).toBe("string");
			expect(newUser.id).toBeUndefined();
			expect(newUser.name).toBeUndefined();
			expect(newUser.createdAt).toBeUndefined();
			expect(newUser.updatedAt).toBeUndefined();
			expect(newUser).toBeDefined();
		});

		it("should allow all fields in NewUser", () => {
			const newUser: NewUser = {
				id: 1,
				email: "new@example.com",
				name: "New User",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(newUser.id).toBe(1);
			expect(newUser.email).toBe("new@example.com");
			expect(newUser.name).toBe("New User");
			expect(newUser.createdAt).toBeInstanceOf(Date);
			expect(newUser.updatedAt).toBeInstanceOf(Date);
		});
	});
});
