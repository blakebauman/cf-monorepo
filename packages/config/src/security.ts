/**
 * Security configuration for different environments
 */

import { RATE_LIMITS, SECURITY_HEADER_VALUES } from "@repo/constants";
import type { Env } from "@repo/types";
import { ENVIRONMENTS, getEnvironment } from "./index";

export interface SecurityConfig {
	headers: Record<string, string>;
	rateLimiting: {
		enabled: boolean;
		default: { requests: number; window: number };
		auth: { requests: number; window: number };
		upload: { requests: number; window: number };
		api: { requests: number; window: number };
	};
	csrf: {
		enabled: boolean;
		tokenLength: number;
		cookieName: string;
		headerName: string;
	};
	contentSecurityPolicy: {
		enabled: boolean;
		policy: string;
		reportUri?: string;
	};
}

/**
 * Gets security configuration for the current environment
 */
export function getSecurityConfig(env: Partial<Env>): SecurityConfig {
	const environment = getEnvironment(env);

	const baseConfig: SecurityConfig = {
		headers: {
			"X-Content-Type-Options": SECURITY_HEADER_VALUES.X_CONTENT_TYPE_OPTIONS,
			"X-Frame-Options": SECURITY_HEADER_VALUES.X_FRAME_OPTIONS,
			"X-XSS-Protection": SECURITY_HEADER_VALUES.X_XSS_PROTECTION,
			"Referrer-Policy": SECURITY_HEADER_VALUES.REFERRER_POLICY,
			"Permissions-Policy": SECURITY_HEADER_VALUES.PERMISSIONS_POLICY,
		},
		rateLimiting: {
			enabled: true,
			default: RATE_LIMITS.DEFAULT,
			auth: RATE_LIMITS.AUTH,
			upload: RATE_LIMITS.UPLOAD,
			api: RATE_LIMITS.API,
		},
		csrf: {
			enabled: true,
			tokenLength: 32,
			cookieName: "csrf-token",
			headerName: "X-CSRF-Token",
		},
		contentSecurityPolicy: {
			enabled: true,
			policy: SECURITY_HEADER_VALUES.CSP,
		},
	};

	switch (environment) {
		case ENVIRONMENTS.DEVELOPMENT:
			return {
				...baseConfig,
				headers: {
					...baseConfig.headers,
					// More lenient CSP for development
					"Content-Security-Policy":
						"default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
						"connect-src 'self' http: https: ws: wss:; " +
						"img-src 'self' data: http: https:;",
				},
				rateLimiting: {
					...baseConfig.rateLimiting,
					enabled: false, // Disabled for easier development
				},
				csrf: {
					...baseConfig.csrf,
					enabled: false, // Disabled for easier API testing
				},
			};

		case ENVIRONMENTS.STAGING:
			return {
				...baseConfig,
				headers: {
					...baseConfig.headers,
					"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
					"Content-Security-Policy":
						"default-src 'self'; " +
						"script-src 'self'; " +
						"style-src 'self' 'unsafe-inline'; " +
						"img-src 'self' data: https:; " +
						"connect-src 'self' https:; " +
						"report-uri /api/csp-report",
				},
				contentSecurityPolicy: {
					enabled: true,
					policy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
					reportUri: "/api/csp-report",
				},
			};

		case ENVIRONMENTS.PRODUCTION:
			return {
				...baseConfig,
				headers: {
					...baseConfig.headers,
					"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
					"Content-Security-Policy":
						"default-src 'self'; " +
						"script-src 'self'; " +
						"style-src 'self'; " +
						"img-src 'self' data: https:; " +
						"connect-src 'self' https:; " +
						"base-uri 'self'; " +
						"form-action 'self'; " +
						"frame-ancestors 'none'; " +
						"report-uri /api/csp-report",
				},
				rateLimiting: {
					...baseConfig.rateLimiting,
					enabled: true,
					// Stricter limits in production
					auth: { requests: 5, window: 60 },
					default: { requests: 60, window: 60 },
				},
				contentSecurityPolicy: {
					enabled: true,
					policy: "default-src 'self'; script-src 'self'; style-src 'self'",
					reportUri: "/api/csp-report",
				},
			};

		default:
			return baseConfig;
	}
}

/**
 * IP allowlist configuration
 */
export interface IPConfig {
	enabled: boolean;
	allowlist: string[];
	blocklist: string[];
	trustedProxies: string[];
}

/**
 * Gets IP configuration
 */
export function getIPConfig(env: Partial<Env>): IPConfig {
	const environment = getEnvironment(env);

	return {
		enabled: environment === ENVIRONMENTS.PRODUCTION,
		allowlist: [], // Add specific IPs if needed
		blocklist: [], // Add blocked IPs
		trustedProxies: [
			// Cloudflare IP ranges
			"103.21.244.0/22",
			"103.22.200.0/22",
			"103.31.4.0/22",
			"104.16.0.0/13",
			"104.24.0.0/14",
			"108.162.192.0/18",
			"131.0.72.0/22",
			"141.101.64.0/18",
			"162.158.0.0/15",
			"172.64.0.0/13",
			"173.245.48.0/20",
			"188.114.96.0/20",
			"190.93.240.0/20",
			"197.234.240.0/22",
			"198.41.128.0/17",
		],
	};
}

/**
 * TLS/SSL configuration
 */
export interface TLSConfig {
	minVersion: string;
	cipherSuites: string[];
	enforceHttps: boolean;
	hstsMaxAge: number;
	hstsIncludeSubdomains: boolean;
	hstsPreload: boolean;
}

/**
 * Gets TLS configuration
 */
export function getTLSConfig(env: Partial<Env>): TLSConfig {
	const environment = getEnvironment(env);

	return {
		minVersion: "TLSv1.2",
		cipherSuites: [
			"ECDHE-ECDSA-AES256-GCM-SHA384",
			"ECDHE-RSA-AES256-GCM-SHA384",
			"ECDHE-ECDSA-CHACHA20-POLY1305",
			"ECDHE-RSA-CHACHA20-POLY1305",
			"ECDHE-ECDSA-AES128-GCM-SHA256",
			"ECDHE-RSA-AES128-GCM-SHA256",
		],
		enforceHttps: environment !== ENVIRONMENTS.DEVELOPMENT,
		hstsMaxAge: environment === ENVIRONMENTS.PRODUCTION ? 63072000 : 31536000,
		hstsIncludeSubdomains: true,
		hstsPreload: environment === ENVIRONMENTS.PRODUCTION,
	};
}

/**
 * Validates security configuration
 */
export function validateSecurityConfig(config: SecurityConfig): void {
	// Validate CSP policy
	if (config.contentSecurityPolicy.enabled && !config.contentSecurityPolicy.policy) {
		throw new Error("CSP policy is required when CSP is enabled");
	}

	// Validate rate limiting configuration
	if (config.rateLimiting.enabled) {
		const limits = [
			config.rateLimiting.default,
			config.rateLimiting.auth,
			config.rateLimiting.upload,
			config.rateLimiting.api,
		];

		for (const limit of limits) {
			if (limit.requests <= 0 || limit.window <= 0) {
				throw new Error("Rate limit requests and window must be positive numbers");
			}
		}
	}

	// Validate CSRF configuration
	if (config.csrf.enabled && config.csrf.tokenLength < 16) {
		throw new Error("CSRF token length must be at least 16 characters");
	}
}
