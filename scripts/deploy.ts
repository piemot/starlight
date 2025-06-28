import { execSync } from "node:child_process";
import { URL } from "node:url";
import { API } from "@discordjs/core/http-only";
import { REST } from "discord.js";

execSync("pnpm run build");

const { configFile } = await import("../dist/util/config.js");
const { loadCommands } = await import("../dist/util/loaders.js");

const commands = await loadCommands(
	new URL("../dist/commands/", import.meta.url),
);
const commandData = [...commands.values()].map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(configFile.bot.token);
const api = new API(rest);

const result = await api.applicationCommands.bulkOverwriteGlobalCommands(
	configFile.bot.id,
	commandData,
);

console.log(`Successfully registered ${result.length} commands.`);
