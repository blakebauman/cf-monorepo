/**
 * Logging configuration for different environments
 */

import { LOG_LEVELS, type LogLevel } from "@cf-monorepo/constants";
import type { Env } from "@cf-monorepo/types";
import { ENVIRONMENTS, getEnvironment } from "./index";

export interface LoggingConfig {
	level: LogLevel;
	enableConsole: boolean;
	enableStructured: boolean;
	enableMetrics: boolean;
	enableTracing: boolean;
	enablePerformanceLogs: boolean;
	enableErrorStack: boolean;
	enableSensitiveDataMasking: boolean;
	maxLogSize: number;
	bufferSize: number;
	flushInterval: number;
}

/**
 * Gets logging configuration for the current environment
 */
export function getLoggingConfig(env: Partial<Env>): LoggingConfig {
	const environment = getEnvironment(env);

	const baseConfig: LoggingConfig = {
		level: LOG_LEVELS.INFO,
		enableConsole: true,
		enableStructured: true,
		enableMetrics: false,
		enableTracing: false,
		enablePerformanceLogs: false,
		enableErrorStack: true,
		enableSensitiveDataMasking: true,
		maxLogSize: 1024 * 1024, // 1MB
		bufferSize: 100,
		flushInterval: 5000, // 5 seconds
	};

	switch (environment) {
		case ENVIRONMENTS.DEVELOPMENT:
			return {
				...baseConfig,
				level: LOG_LEVELS.DEBUG,
				enableConsole: true,
				enableStructured: false, // Easier to read in development
				enablePerformanceLogs: true,
				enableErrorStack: true,
				enableSensitiveDataMasking: false, // Easier debugging
				bufferSize: 1, // Immediate logging in development
				flushInterval: 0,
			};

		case ENVIRONMENTS.STAGING:
			return {
				...baseConfig,
				level: LOG_LEVELS.INFO,
				enableMetrics: true,
				enableTracing: false,
				enablePerformanceLogs: true,
				bufferSize: 50,
			};

		case ENVIRONMENTS.PRODUCTION:
			return {
				...baseConfig,
				level: LOG_LEVELS.WARN,
				enableConsole: false, // Use external logging service
				enableMetrics: true,
				enableTracing: true,
				enablePerformanceLogs: true,
				enableErrorStack: false, // Don't expose stack traces
				bufferSize: 200,
			};

		default:
			return baseConfig;
	}
}

/**
 * Log format configuration
 */
export interface LogFormat {
	timestamp: boolean;
	level: boolean;
	requestId: boolean;
	userId: boolean;
	ip: boolean;
	userAgent: boolean;
	method: boolean;
	url: boolean;
	statusCode: boolean;
	responseTime: boolean;
	errorStack: boolean;
}

/**
 * Gets log format configuration
 */
export function getLogFormat(env: Partial<Env>): LogFormat {
	const environment = getEnvironment(env);
	const config = getLoggingConfig(env);

	return {
		timestamp: true,
		level: true,
		requestId: true,
		userId: environment !== ENVIRONMENTS.DEVELOPMENT,
		ip: environment !== ENVIRONMENTS.DEVELOPMENT,
		userAgent: environment === ENVIRONMENTS.PRODUCTION,
		method: true,
		url: true,
		statusCode: true,
		responseTime: config.enablePerformanceLogs,
		errorStack: config.enableErrorStack,
	};
}

/**
 * Sensitive data patterns to mask in logs
 */
export const SENSITIVE_PATTERNS = [
	// Passwords
	/password["\s]*[:=]["\s]*[^"\s,}]+/gi,
	// API keys
	/api[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi,
	// Tokens
	/token["\s]*[:=]["\s]*[^"\s,}]+/gi,
	// Credit card numbers
	/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
	// Email addresses (partial masking)
	/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
	// Phone numbers
	/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
	// SSN-like patterns
	/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
];

/**
 * Masks sensitive data in log messages
 */
export function maskSensitiveData(message: string): string {
	let masked = message;

	for (const pattern of SENSITIVE_PATTERNS) {
		masked = masked.replace(pattern, (match) => {
			if (match.includes("@")) {
				// Partially mask email
				return match.replace(/([a-zA-Z0-9._%+-]+)@/, "***@");
			}
			if (match.length > 8) {
				// Show first 2 and last 2 characters for long values
				return match.slice(0, 2) + "*".repeat(match.length - 4) + match.slice(-2);
			}
			// Completely mask short values
			return "*".repeat(match.length);
		});
	}

	return masked;
}

/**
 * Log aggregation configuration
 */
export interface AggregationConfig {
	enabled: boolean;
	endpoint?: string;
	apiKey?: string;
	batchSize: number;
	flushInterval: number;
	retryAttempts: number;
	compression: boolean;
}

/**
 * Gets log aggregation configuration
 */
export function getAggregationConfig(env: Partial<Env>): AggregationConfig {
	const environment = getEnvironment(env);

	return {
		enabled: environment !== ENVIRONMENTS.DEVELOPMENT,
		endpoint: env.LOG_AGGREGATION_ENDPOINT,
		apiKey: env.LOG_AGGREGATION_API_KEY,
		batchSize: 100,
		flushInterval: 30000, // 30 seconds
		retryAttempts: 3,
		compression: true,
	};
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
	enableMetrics: boolean;
	enableTracing: boolean;
	samplingRate: number;
	slowQueryThreshold: number;
	slowRequestThreshold: number;
	memoryWarningThreshold: number;
	cpuWarningThreshold: number;
}

/**
 * Gets performance monitoring configuration
 */
export function getPerformanceConfig(env: Partial<Env>): PerformanceConfig {
	const environment = getEnvironment(env);

	return {
		enableMetrics: environment !== ENVIRONMENTS.DEVELOPMENT,
		enableTracing: environment === ENVIRONMENTS.PRODUCTION,
		samplingRate: environment === ENVIRONMENTS.PRODUCTION ? 0.1 : 1.0,
		slowQueryThreshold: 1000, // 1 second
		slowRequestThreshold: 5000, // 5 seconds
		memoryWarningThreshold: 100 * 1024 * 1024, // 100MB (Cloudflare Workers limit is 128MB)
		cpuWarningThreshold: 5000, // 5 seconds CPU time
	};
}
