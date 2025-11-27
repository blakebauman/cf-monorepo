/**
 * Better Auth configuration file for CLI schema generation
 * This file is used by the Better Auth CLI to generate database schema
 */

import { createDb } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Create a mock env for schema generation
// In actual usage, this comes from Cloudflare Workers environment
const mockEnv = {
	DATABASE_URL: process.env.DATABASE_URL || "",
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "dummy-secret-for-schema-generation",
	BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8787",
};

const db = createDb(mockEnv);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	secret: mockEnv.BETTER_AUTH_SECRET,
	baseURL: mockEnv.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
	},
});
