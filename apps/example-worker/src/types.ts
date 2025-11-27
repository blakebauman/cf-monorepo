/**
 * Type definitions for the example worker
 */

import type { Env } from "@repo/types";
import type { Services } from "./services";

/**
 * Hono context type with bindings and variables
 */
export type Context = {
	Bindings: Env;
	Variables: {
		requestId: string;
		services: Services;
	};
};
