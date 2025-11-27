import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	// Worker generator
	plop.setGenerator("worker", {
		description: "Create a new Cloudflare Worker",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "What is the name of the worker?",
				validate: (input: string) => {
					if (!input) return "Worker name is required";
					if (!/^[a-z0-9-]+$/.test(input)) {
						return "Worker name must be lowercase alphanumeric with dashes";
					}
					return true;
				},
			},
			{
				type: "input",
				name: "description",
				message: "Brief description of the worker:",
				default: "A Cloudflare Worker",
			},
			{
				type: "confirm",
				name: "useHono",
				message: "Use Hono framework?",
				default: true,
			},
			{
				type: "confirm",
				name: "useMiddleware",
				message: "Include middleware package (request tracking, logging, security)?",
				default: true,
			},
			{
				type: "confirm",
				name: "useOpenAPI",
				message: "Include OpenAPI documentation?",
				default: true,
				when: (answers) => answers?.useHono === true,
			},
			{
				type: "confirm",
				name: "useDatabase",
				message: "Include database support (Drizzle + Neon)?",
				default: false,
			},
			{
				type: "confirm",
				name: "useAuth",
				message: "Include authentication (Better Auth)?",
				default: false,
			},
		],
		actions: (answers) => {
			// Enforce middleware when OpenAPI is enabled (best practice)
			if (answers?.useOpenAPI && !answers?.useMiddleware) {
				answers.useMiddleware = true;
			}

			const actions: PlopTypes.ActionType[] = [
				{
					type: "add",
					path: "apps/{{name}}/package.json",
					templateFile: "templates/worker/package.json.hbs",
				},
				{
					type: "add",
					path: "apps/{{name}}/tsconfig.json",
					templateFile: "templates/worker/tsconfig.json.hbs",
				},
				{
					type: "add",
					path: "apps/{{name}}/wrangler.jsonc",
					templateFile: "templates/worker/wrangler.jsonc.hbs",
				},
				{
					type: "add",
					path: "apps/{{name}}/src/index.ts",
					templateFile: answers?.useHono
						? "templates/worker/src/index-hono.ts.hbs"
						: "templates/worker/src/index-basic.ts.hbs",
				},
				{
					type: "add",
					path: "apps/{{name}}/src/test/index.test.ts",
					templateFile: "templates/worker/src/test/index.test.ts.hbs",
				},
			];

			// Add service files when database is enabled
			if (answers?.useDatabase) {
				actions.push(
					{
						type: "add",
						path: "apps/{{name}}/src/services/user-service.ts",
						templateFile: "templates/worker/src/services/user-service.ts.hbs",
					},
					{
						type: "add",
						path: "apps/{{name}}/src/services/index.ts",
						templateFile: "templates/worker/src/services/index.ts.hbs",
					}
				);
			}

			// Add custom action to generate types after files are created
			const workerName = answers?.name;
			actions.push({
				type: "function",
				async function() {
					const { execSync } = await import("node:child_process");
					const workerPath = `apps/${workerName}`;
					try {
						execSync("wrangler types", {
							cwd: workerPath,
							stdio: "inherit",
						});
						return `✅ Generated TypeScript types for ${workerName}`;
					} catch (error) {
						return `⚠️  Failed to generate types: ${error}`;
					}
				},
			} as PlopTypes.ActionType);

			return actions;
		},
	});

	// Package generator
	plop.setGenerator("package", {
		description: "Create a new shared package",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "What is the name of the package?",
				validate: (input: string) => {
					if (!input) return "Package name is required";
					if (!/^[a-z0-9-]+$/.test(input)) {
						return "Package name must be lowercase alphanumeric with dashes";
					}
					return true;
				},
			},
			{
				type: "input",
				name: "description",
				message: "Brief description of the package:",
				default: "A shared package",
			},
			{
				type: "confirm",
				name: "needsWorkersTypes",
				message: "Include Cloudflare Workers types?",
				default: false,
			},
			{
				type: "confirm",
				name: "needsNodeTypes",
				message: "Include Node.js types?",
				default: false,
			},
			{
				type: "confirm",
				name: "needsHono",
				message: "Include Hono as peer dependency?",
				default: false,
			},
			{
				type: "confirm",
				name: "includeTests",
				message: "Include test setup (Vitest)?",
				default: false,
			},
		],
		actions: [
			{
				type: "add",
				path: "packages/{{name}}/package.json",
				templateFile: "templates/package/package.json.hbs",
			},
			{
				type: "add",
				path: "packages/{{name}}/tsconfig.json",
				templateFile: "templates/package/tsconfig.json.hbs",
			},
			{
				type: "add",
				path: "packages/{{name}}/src/index.ts",
				templateFile: "templates/package/src/index.ts.hbs",
			},
			{
				type: "add",
				path: "packages/{{name}}/src/test/index.test.ts",
				templateFile: "templates/package/src/test/index.test.ts.hbs",
			},
		],
	});
}
