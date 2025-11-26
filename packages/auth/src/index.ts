/**
 * Better Auth configuration for Cloudflare Workers
 */

import { createDb } from "@cf-monorepo/db";
import type { Env } from "@cf-monorepo/types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * Creates a Better Auth instance configured for Cloudflare Workers
 * Make sure to set BETTER_AUTH_SECRET and BETTER_AUTH_URL in your environment
 */
export function createAuth(env: Env) {
	const db = createDb(env);

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
		}),
		secret: env.BETTER_AUTH_SECRET || "change-me-in-production",
		baseURL: env.BETTER_AUTH_URL || "http://localhost:8787",
		emailAndPassword: {
			enabled: true,
		},
	});
}
