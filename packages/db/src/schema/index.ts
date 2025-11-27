/**
 * Drizzle ORM schema definitions
 */

import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Example users table
 * Extend this schema based on your application needs
 *
 * Note: Better Auth will create its own user table.
 * You can either use Better Auth's user table or create your own.
 * If you create your own, you'll need to link it to Better Auth's session/user system.
 */
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Better Auth schema will be generated and exported from better-auth.ts
// Uncomment the line below after running: pnpm --filter @repo/auth generate-schema
// export * from "./better-auth";
