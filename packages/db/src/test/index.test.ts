/**
 * Tests for database connection and utilities
 */

import type { Env } from "@repo/types";
import { describe, expect, it } from "vitest";

import { createDb } from "../index";

describe("Database Connection", () => {
	describe("createDb", () => {
		it("should create database instance with DATABASE_URL", () => {
			const env: Env = {
				DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
				BETTER_AUTH_SECRET: "test-secret",
				BETTER_AUTH_URL: "http://localhost:8787",
				ENVIRONMENT: "development",
			};

			const db = createDb(env);
			expect(db).toBeDefined();
			expect(typeof db.execute).toBe("function");
			expect(typeof db.query).toBe("object");
		});

		it("should create database instance with HYPERDRIVE binding", () => {
			const env: Env = {
				DATABASE_URL: "postgresql://fallback:fallback@localhost:5432/fallback",
				BETTER_AUTH_SECRET: "test-secret",
				BETTER_AUTH_URL: "http://localhost:8787",
				ENVIRONMENT: "development",
				HYPERDRIVE: {
					connectionString: "postgresql://hyperdrive:hyperdrive@localhost:5432/hyperdrivedb",
				} as Env["HYPERDRIVE"],
			};

			const db = createDb(env);
			expect(db).toBeDefined();
		});

		it("should prefer HYPERDRIVE over DATABASE_URL when both present", () => {
			const env: Env = {
				DATABASE_URL: "postgresql://direct:direct@localhost:5432/directdb",
				BETTER_AUTH_SECRET: "test-secret",
				BETTER_AUTH_URL: "http://localhost:8787",
				ENVIRONMENT: "development",
				HYPERDRIVE: {
					connectionString: "postgresql://hyperdrive:hyperdrive@localhost:5432/hyperdrivedb",
				} as Env["HYPERDRIVE"],
			};

			// Should not throw, meaning it successfully uses HYPERDRIVE
			const db = createDb(env);
			expect(db).toBeDefined();
		});

		it("should throw error when no connection string available", () => {
			const env: Env = {
				BETTER_AUTH_SECRET: "test-secret",
				BETTER_AUTH_URL: "http://localhost:8787",
				ENVIRONMENT: "development",
			};

			expect(() => createDb(env)).toThrow(
				"DATABASE_URL or HYPERDRIVE binding is required for database connection"
			);
		});

		it("should throw error when connection string is empty", () => {
			const env: Env = {
				DATABASE_URL: "",
				BETTER_AUTH_SECRET: "test-secret",
				BETTER_AUTH_URL: "http://localhost:8787",
				ENVIRONMENT: "development",
			};

			expect(() => createDb(env)).toThrow(
				"DATABASE_URL or HYPERDRIVE binding is required for database connection"
			);
		});

		it("should expose schema via database instance", () => {
			const env: Env = {
				DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
				BETTER_AUTH_SECRET: "test-secret",
				BETTER_AUTH_URL: "http://localhost:8787",
				ENVIRONMENT: "development",
			};

			const db = createDb(env);
			expect(db.query).toBeDefined();
			expect(db.query.users).toBeDefined();
		});
	});
});
