import fs from "node:fs/promises";
import { dirname, default as path, resolve } from "node:path";
import type { Client, SendableChannels } from "discord.js";
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
	"ready-channel": snowflakeSchema,
	"review-channel": snowflakeSchema,
	services: z.object({
		availability: z.object({
			channel: snowflakeSchema,
			"notify-role": snowflakeSchema,
		}),
		types: z.record(z.object({ name: z.string() })),
	}),
});

export interface Config {
	bot: {
		id: string;
		token: string;
	};
	readyChannel: SendableChannels;
	reviewChannel: SendableChannels;
	services: {
		availability: {
			channel: SendableChannels;
			notifyRoleId: string;
		};
		types: Record<string, { name: string }>;
	};
}

export const configFile = await loadConfigFile();

// export type Config = z.infer<typeof configSchema>;

async function loadConfigFile(): Promise<z.infer<typeof configSchema>> {
	const configContents = await getConfigContents();
	if (!configContents) {
		throw new Error("Failed to find a valid config file.");
	}
	const configRaw = TOML.parse(configContents);
	return configSchema.parse(configRaw);
}

let config: Config | null = null;

export async function loadConfig(client: Client): Promise<Config> {
	if (config) {
		return config;
	}

	const readyChannel = await client.channels.fetch(configFile["ready-channel"]);
	if (!readyChannel || !readyChannel.isSendable()) {
		throw new Error("Invalid `config.ready-channel`");
	}

	const reviewChannel = await client.channels.fetch(
		configFile["review-channel"],
	);
	if (!reviewChannel || !reviewChannel.isSendable()) {
		throw new Error("Invalid `config.review-channel`");
	}

	const serviceChannel = await client.channels.fetch(
		configFile.services.availability.channel,
	);
	if (!serviceChannel || !serviceChannel.isSendable()) {
		throw new Error("Invalid `config.services.availability.channel`");
	}

	config = {
		bot: configFile.bot,
		readyChannel,
		reviewChannel,
		services: {
			availability: {
				channel: serviceChannel,
				notifyRoleId: configFile.services.availability["notify-role"],
			},
			types: configFile.services.types,
		},
	};
	return config;
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
