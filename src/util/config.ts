import fs from "node:fs/promises";
import { dirname, default as path, resolve } from "node:path";
import TOML from "smol-toml";
import { z } from "zod";

const snowflakeSchema = z
	.string()
	.regex(/^\d{17,20}$/, "invalid Snowflake value");

const configSchema = z.object({
	bot: z.object({
		id: snowflakeSchema,
		token: z.string().min(1),
	}),
	readyChannel: snowflakeSchema,
	service: z.object({
		availability: z.object({
			channel: snowflakeSchema,
			message: z.union([snowflakeSchema, z.literal("build")]),
		}),
	}),
});

export const config: Config = await loadConfig();

export type Config = z.infer<typeof configSchema>;

async function loadConfig(): Promise<Config> {
	const configContents = await getConfigContents();
	if (!configContents) {
		throw new Error("Failed to find a valid config file.");
	}
	const configRaw = TOML.parse(configContents);
	return configSchema.parse(configRaw);
}

/**
 * Walks up the directory tree, starting from this directory, until it finds
 * one containing a `config.toml` file.
 *
 * @returns the value of that config file.
 */
async function getConfigContents() {
	for (const dir of walkUp(import.meta.dirname)) {
		const checkFile = path.join(dir, "config.toml");

		let content: string;
		try {
			const file = await fs.readFile(checkFile);
			content = file.toString();
		} catch (err) {
			if ((err as { code: string }).code === "ENOENT") {
				// checkFile does not exist
				continue;
			} else {
				throw err;
			}
		}

		return content;
	}

	return null;
}

// https://github.com/isaacs/walk-up-path/blob/main/src/index.ts
export function* walkUp(initialPath: string) {
	let path = initialPath;
	while (true) {
		path = resolve(path);
		yield path;
		const pp = dirname(path);
		if (pp === path) {
			break;
		}
		path = pp;
	}
}
