import { Client, GatewayIntentBits } from "discord.js";
import { configFile } from "./util/config.js";
import { loadEvents } from "./util/loaders.js";

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions,
	],
});

// Load the events and commands
const events = await loadEvents(new URL("events/", import.meta.url));

// Register the event handlers
for (const event of events) {
	const registerMethod = event.once ? client.once : client.on;
	registerMethod.apply(client, [
		event.name,
		async (...args) => {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: event args are unpredictable
				await event.execute(...(args as any));
			} catch (error) {
				console.error(`Error executing event ${String(event.name)}:`, error);
			}
		},
	]);
}

void client.login(configFile.bot.token);
