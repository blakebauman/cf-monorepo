/**
 * Security Headers Middleware
 * Adds security headers to responses
 */

import type { MiddlewareHandler } from "hono";
import { secureHeaders } from "hono/secure-headers";

export interface SecurityHeadersConfig {
	/**
	 * Content Security Policy
	 */
	contentSecurityPolicy?: Record<string, string[]>;
	/**
	 * X-Frame-Options
	 */
	frameOptions?: "DENY" | "SAMEORIGIN";
	/**
	 * X-Content-Type-Options
	 */
	contentTypeOptions?: boolean;
	/**
	 * Referrer-Policy
	 */
	referrerPolicy?:
		| "no-referrer"
		| "no-referrer-when-downgrade"
		| "origin"
		| "origin-when-cross-origin"
		| "same-origin"
		| "strict-origin"
		| "strict-origin-when-cross-origin"
		| "unsafe-url";
	/**
	 * Permissions-Policy (Feature-Policy)
	 */
	permissionsPolicy?: Record<string, string[]>;
	/**
	 * Strict-Transport-Security (HSTS)
	 */
	strictTransportSecurity?: string;
}

/**
 * Security headers middleware with sensible defaults
 */
export function securityHeaders(config: SecurityHeadersConfig = {}): MiddlewareHandler {
	const {
		contentSecurityPolicy = {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "https:"],
		},
		frameOptions = "DENY",
		contentTypeOptions = true,
		referrerPolicy = "strict-origin-when-cross-origin",
		permissionsPolicy = {
			geolocation: [],
			camera: [],
			microphone: [],
		},
		strictTransportSecurity = "max-age=31536000; includeSubDomains",
	} = config;

	return secureHeaders({
		contentSecurityPolicy,
		xFrameOptions: frameOptions,
		xContentTypeOptions: contentTypeOptions,
		referrerPolicy,
		permissionsPolicy,
		strictTransportSecurity,
	});
}
