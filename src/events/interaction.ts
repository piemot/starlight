import { Events } from "discord.js";
import { closeTicket, createTicket } from "../handlers/ticket.js";
import { loadConfig } from "../util/config.js";
import { loadCommands } from "../util/loaders.js";
import type { Event } from "../util/structures.js";

const commands = await loadCommands(new URL("../commands/", import.meta.url));

export default {
	name: Events.InteractionCreate,
	async execute(interaction) {
		const config = await loadConfig(interaction.client);
		if (interaction.isCommand()) {
			const command = commands.get(interaction.commandName);

			if (!command) {
				throw new Error(`Command '${interaction.commandName}' not found.`);
			}

			await command.execute(interaction, { config });
		}
		if (
			interaction.isStringSelectMenu() &&
			interaction.customId === "create-ticket"
		) {
			await createTicket(interaction, config);
		}
		if (interaction.isButton() && interaction.customId === "close-ticket") {
			await closeTicket(interaction);
		}
	},
} satisfies Event<Events.InteractionCreate>;
