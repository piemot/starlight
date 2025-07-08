import { ButtonStyle, ComponentType, Events, MessageFlags } from "discord.js";
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
		if (interaction.isButton()) {
			if (interaction.customId === "close-ticket") {
				await interaction.reply({
					components: [
						{
							type: ComponentType.Container,
							accentColor: 0x2965af,
							components: [
								{
									type: ComponentType.TextDisplay,
									content: "Are you sure you want to close this ticket?",
								},
								{ type: ComponentType.Separator },
								{
									type: ComponentType.ActionRow,
									components: [
										{
											type: ComponentType.Button,
											style: ButtonStyle.Danger,
											label: "Close Ticket",
											customId: "close-ticket-confirm",
										},
										{
											type: ComponentType.Button,
											style: ButtonStyle.Secondary,
											label: "Cancel",
											customId: "close-ticket-cancel",
										},
									],
								},
							],
						},
					],
					flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
				});
			}
			if (interaction.customId === "close-ticket-confirm") {
				await closeTicket(interaction);
			}
			if (interaction.customId === "close-ticket-cancel") {
				await interaction.deferUpdate();
				await interaction.deleteReply();
			}
		}
	},
} satisfies Event<Events.InteractionCreate>;
