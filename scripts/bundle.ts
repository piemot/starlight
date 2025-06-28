import { create } from "tar";

const EXPORT = [
	"assets",
	"drizzle",
	"scripts",
	"src",
	".gitignore",
	"biome.json",
	"config.ex.toml",
	"drizzle.config.ts",
	"package.json",
	"pnpm-lock.yaml",
	// INTENTIONALLY EXCLUDED: the server uses pnpm 9
	// "pnpm-workspace.yaml",
	"tsconfig.json",
];

await create({ gzip: true, file: "export.tar.gz" }, EXPORT);
