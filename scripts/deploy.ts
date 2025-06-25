import { URL } from "node:url";
import { API } from "@discordjs/core/http-only";
import { REST } from "discord.js";
import { config } from "../src/util/config.js";
import { loadCommands } from "../src/util/loaders.js";

const commands = await loadCommands(
	new URL("../src/commands/", import.meta.url),
);
const commandData = [...commands.values()].map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.keys.bot.token);
const api = new API(rest);

const result = await api.applicationCommands.bulkOverwriteGlobalCommands(
	config.keys.bot.id.toString(),
	commandData,
);

console.log(`Successfully registered ${result.length} commands.`);
