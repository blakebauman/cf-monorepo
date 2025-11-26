// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
	dependencyTypes: ["prod", "dev", "peer"],
	semverGroups: [
		{
			label: "Use exact versions for workspace packages",
			packages: ["**"],
			dependencies: ["@cf-monorepo/**"],
			isIgnored: false,
			range: "",
		},
	],
	versionGroups: [
		{
			label: "Use same version for TypeScript across all packages",
			packages: ["**"],
			dependencies: ["typescript"],
			isIgnored: false,
		},
		{
			label: "Use same version for @cloudflare/workers-types across all packages",
			packages: ["**"],
			dependencies: ["@cloudflare/workers-types"],
			isIgnored: false,
		},
		{
			label: "Use same version for wrangler across all packages",
			packages: ["**"],
			dependencies: ["wrangler"],
			isIgnored: false,
		},
		{
			label: "Use same version for @types/node across all packages",
			packages: ["**"],
			dependencies: ["@types/node"],
			isIgnored: false,
		},
		{
			label: "Use same version for drizzle-orm across all packages",
			packages: ["**"],
			dependencies: ["drizzle-orm"],
			isIgnored: false,
		},
		{
			label: "Use same version for better-auth across all packages",
			packages: ["**"],
			dependencies: ["better-auth"],
			isIgnored: false,
		},
		{
			label: "Use same version for @hono/zod-openapi across all packages",
			packages: ["**"],
			dependencies: ["@hono/zod-openapi"],
			isIgnored: false,
		},
		{
			label: "Use same version for zod across all packages",
			packages: ["**"],
			dependencies: ["zod"],
			isIgnored: false,
		},
	],
};

export default config;
