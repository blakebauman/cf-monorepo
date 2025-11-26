/**
 * Authentication configuration for different environments
 */

import { AUTH } from "@cf-monorepo/constants";
import type { Env } from "@cf-monorepo/types";
import { ENVIRONMENTS, getEnvironment } from "./index";

export interface AuthConfig {
	sessionDuration: number;
	refreshTokenDuration: number;
	maxLoginAttempts: number;
	lockoutDuration: number;
	passwordMinLength: number;
	passwordMaxLength: number;
	requireEmailVerification: boolean;
	enableMfa: boolean;
	enableSocialLogin: boolean;
	jwtAlgorithm: string;
	cookieSecure: boolean;
	cookieSameSite: "strict" | "lax" | "none";
	csrfProtection: boolean;
}

/**
 * Gets authentication configuration for the current environment
 */
export function getAuthConfig(env: Partial<Env>): AuthConfig {
	const environment = getEnvironment(env);

	const baseConfig: AuthConfig = {
		sessionDuration: AUTH.SESSION_DURATION,
		refreshTokenDuration: AUTH.REFRESH_TOKEN_DURATION,
		maxLoginAttempts: AUTH.MAX_LOGIN_ATTEMPTS,
		lockoutDuration: AUTH.LOCKOUT_DURATION,
		passwordMinLength: AUTH.PASSWORD_MIN_LENGTH,
		passwordMaxLength: AUTH.PASSWORD_MAX_LENGTH,
		requireEmailVerification: true,
		enableMfa: false,
		enableSocialLogin: true,
		jwtAlgorithm: "HS256",
		cookieSecure: true,
		cookieSameSite: "lax",
		csrfProtection: true,
	};

	switch (environment) {
		case ENVIRONMENTS.DEVELOPMENT:
			return {
				...baseConfig,
				requireEmailVerification: false, // Easier testing
				cookieSecure: false, // Allow HTTP in development
				sessionDuration: 24 * 60 * 60, // 24 hours for development
				maxLoginAttempts: 10, // More lenient in development
			};

		case ENVIRONMENTS.STAGING:
			return {
				...baseConfig,
				requireEmailVerification: true,
				enableMfa: false, // Disabled for staging ease
			};

		case ENVIRONMENTS.PRODUCTION:
			return {
				...baseConfig,
				requireEmailVerification: true,
				enableMfa: true, // Enable MFA in production
				maxLoginAttempts: 3, // Stricter in production
				cookieSameSite: "strict", // Strictest security
			};

		default:
			return baseConfig;
	}
}

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
	clientId: string;
	clientSecret: string;
	scopes: string[];
	enabled: boolean;
}

export interface OAuthConfig {
	google?: OAuthProvider;
	github?: OAuthProvider;
	discord?: OAuthProvider;
	redirectUri: string;
}

/**
 * Gets OAuth configuration
 */
export function getOAuthConfig(env: Partial<Env>): OAuthConfig {
	const baseUrl = env.BETTER_AUTH_URL || "http://localhost:8787";

	return {
		redirectUri: `${baseUrl}/api/auth/callback`,
		google: env.GOOGLE_CLIENT_ID
			? {
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET || "",
					scopes: ["openid", "email", "profile"],
					enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
				}
			: undefined,
		github: env.GITHUB_CLIENT_ID
			? {
					clientId: env.GITHUB_CLIENT_ID,
					clientSecret: env.GITHUB_CLIENT_SECRET || "",
					scopes: ["user:email"],
					enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
				}
			: undefined,
		discord: env.DISCORD_CLIENT_ID
			? {
					clientId: env.DISCORD_CLIENT_ID,
					clientSecret: env.DISCORD_CLIENT_SECRET || "",
					scopes: ["identify", "email"],
					enabled: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
				}
			: undefined,
	};
}

/**
 * Session configuration
 */
export interface SessionConfig {
	name: string;
	maxAge: number;
	secure: boolean;
	httpOnly: boolean;
	sameSite: "strict" | "lax" | "none";
	path: string;
	domain?: string;
}

/**
 * Gets session configuration
 */
export function getSessionConfig(env: Partial<Env>): SessionConfig {
	const environment = getEnvironment(env);
	const authConfig = getAuthConfig(env);

	return {
		name: "session",
		maxAge: authConfig.sessionDuration * 1000, // Convert to milliseconds
		secure: authConfig.cookieSecure,
		httpOnly: true,
		sameSite: authConfig.cookieSameSite,
		path: "/",
		domain: environment === ENVIRONMENTS.PRODUCTION ? ".example.com" : undefined,
	};
}

/**
 * Validates auth secret
 */
export function validateAuthSecret(secret: string): void {
	if (!secret) {
		throw new Error("BETTER_AUTH_SECRET is required");
	}

	if (secret.length < 32) {
		throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
	}

	if (secret === "your-secret-key-here" || secret.includes("example")) {
		throw new Error("BETTER_AUTH_SECRET appears to be a placeholder value");
	}
}

/**
 * Gets validated auth configuration
 */
export function getValidatedAuthConfig(env: Partial<Env>): AuthConfig {
	if (!env.BETTER_AUTH_SECRET) {
		throw new Error("BETTER_AUTH_SECRET environment variable is required");
	}

	validateAuthSecret(env.BETTER_AUTH_SECRET);
	return getAuthConfig(env);
}
