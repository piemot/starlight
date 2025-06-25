import type { Stats } from "node:fs";
import fs, { readFile } from "node:fs/promises";
import { dirname, default as path, resolve } from "node:path";
import TOML from "smol-toml";
import { z } from "zod";

const snowflakeSchema = z
	.string()
	.regex(/^\d{17,20}$/, "invalid Snowflake value");

const keysSchema = z.object({
	bot: z.object({
		id: snowflakeSchema,
		token: z.string().min(1),
	}),
	readyChannel: snowflakeSchema,
});

export const config: Config = await loadConfig();

export type Config = {
	keys: z.infer<typeof keysSchema>;
};

async function loadConfig(): Promise<Config> {
	const configDir = await findConfigDir();
	if (!configDir) {
		throw new Error("Failed to find a valid config directory.");
	}
	const keyfile = path.join(configDir, "keys.toml");
	const keybuf = await readFile(keyfile);
	const keysRaw = TOML.parse(keybuf.toString());
	return {
		keys: keysSchema.parse(keysRaw),
	};
}

/**
 * Walks up the directory tree, starting from this directory, until it finds
 * a directory named `config` containing a `keys.toml` file.
 *
 * @returns the path to the `config` directory.
 */
async function findConfigDir() {
	for (const dir of walkUp(import.meta.dirname)) {
		const checkDir = path.join(dir, "config");
		let checkStat: Stats;
		try {
			checkStat = await fs.stat(checkDir);
		} catch (err) {
			if ((err as { code: string }).code === "ENOENT") {
				// checkDir does not exist
				continue;
			} else {
				throw err;
			}
		}
		if (!checkStat.isDirectory()) {
			continue;
		}
		const checkFile = path.join(dir, "config", "keys.toml");
		let fileStat: Stats;
		try {
			fileStat = await fs.stat(checkFile);
		} catch (err) {
			if ((err as { code: string }).code === "ENOENT") {
				// checkFile does not exist
				continue;
			} else {
				throw err;
			}
		}
		if (!fileStat.isFile()) {
			continue;
		}

		return checkDir;
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
