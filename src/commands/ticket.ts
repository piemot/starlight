import {
	ApplicationCommandOptionType,
	ComponentType,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";
import invariant from "tiny-invariant";
import { getTicketByChannel } from "../database/tickets.js";
import { closeTicketCommand } from "../handlers/ticket.js";
import type { Command } from "../util/structures.js";

export default {
	data: {
		name: "ticket",
		description: "Manage tickets",
		options: [
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "close",
				description: "Close the current ticket",
			},
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "rename",
				description: "Rename the current ticket",
				options: [
					{
						type: ApplicationCommandOptionType.String,
						name: "name",
						description: "The new name of this ticket",
						min_length: 3,
						max_length: 32,
						required: false,
					},
				],
			},
		],
		default_member_permissions:
			PermissionsBitField.Flags.ManageGuild.toString(),
		contexts: [InteractionContextType.Guild],
	},
	async execute(interaction, opts) {
		invariant(interaction.isChatInputCommand());
		invariant(interaction.inGuild(), "asserted by `data.contexts`");

		const thisTicket = await getTicketByChannel(interaction.channelId);
		if (!thisTicket) {
			await interaction.reply({
				components: [
					{
						type: ComponentType.Container,
						accentColor: 0x9f0712,
						components: [
							{
								type: ComponentType.TextDisplay,
								content: "## How Did We Get Here?",
							},
							{
								type: ComponentType.TextDisplay,
								content: "This channel is not a ticket channel.",
							},
						],
					},
				],
				flags: [MessageFlags.IsComponentsV2],
				ephemeral: true,
			});
			return;
		}

		switch (interaction.options.getSubcommand(true)) {
			case "close":
				return await runClose(interaction, opts);
			case "rename":
				return await runRename(interaction, opts);
		}
	},
} satisfies Command;

const runClose: Command["execute"] = async (interaction) => {
	await closeTicketCommand(interaction);
};

const runRename: Command["execute"] = async (interaction) => {
	invariant(interaction.isChatInputCommand());
	invariant(interaction.channel);
	invariant(!interaction.channel.isDMBased());

	await interaction.deferReply({ ephemeral: true });

	const name = interaction.options.getString("name", false);
	let newName: string;
	if (!name) {
		const thisTicket = await getTicketByChannel(interaction.channelId);
		invariant(thisTicket);

		const owner = await interaction.client.users.fetch(thisTicket.ownerId);
		newName = thisTicket.getName(owner.username);
	} else {
		newName = name;
	}

	await interaction.channel.edit({ name: newName });

	await interaction.editReply({
		components: [
			{
				type: ComponentType.Container,
				accentColor: 0x9f0712,
				components: [
					{
						type: ComponentType.TextDisplay,
						content: "Rename complete",
					},
					{
						type: ComponentType.TextDisplay,
						content: `Renamed this channel to "${newName}".`,
					},
				],
			},
		],
		flags: [MessageFlags.IsComponentsV2],
	});

	return;
};
