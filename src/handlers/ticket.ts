import {
	type ButtonInteraction,
	ButtonStyle,
	ComponentType,
	MessageFlags,
	type StringSelectMenuInteraction,
} from "discord.js";
import slugify from "slugify";
import invariant from "tiny-invariant";
import {
	createTicket as createDbTicket,
	deleteTicketChannel,
	getTicketByChannel,
	getTicketIndex,
	getUserTickets,
} from "../database/tickets.js";
import type { Config } from "../util/config.js";

export async function createTicket(
	interaction: StringSelectMenuInteraction,
	config: Config,
) {
	const selection = interaction.values[0];
	const serviceConfig = config.services.types.get(selection);
	if (!serviceConfig) {
		await interaction.reply({
			components: [
				{
					type: ComponentType.Container,
					accentColor: 0x9f0712,
					components: [
						{ type: ComponentType.TextDisplay, content: "## Sorry!" },
						{
							type: ComponentType.TextDisplay,
							content:
								"This service is not available anymore. If this is an unexpected error, please contact an administrator or <@774660568728469585>.",
						},
					],
				},
			],
			flags: [MessageFlags.IsComponentsV2],
			ephemeral: true,
		});
		return;
	}

	if (!serviceConfig.ticketCategory) {
		await interaction.reply({
			components: [
				{
					type: ComponentType.Container,
					accentColor: 0x9f0712,
					components: [
						{ type: ComponentType.TextDisplay, content: "## Sorry!" },
						{
							type: ComponentType.TextDisplay,
							content: "This service is not configured to be ticketable.",
						},
					],
				},
			],
			flags: [MessageFlags.IsComponentsV2],
			ephemeral: true,
		});
		return;
	}

	const tickets = await getUserTickets(interaction.user.id);
	if (tickets.length !== 0) {
		await interaction.reply({
			components: [
				{
					type: ComponentType.Container,
					accentColor: 0x9f0712,
					components: [
						{ type: ComponentType.TextDisplay, content: "## Sorry!" },
						{
							type: ComponentType.TextDisplay,
							content:
								"It seems like you already have a ticket. Please ensure it is closed before opening a new one.",
						},
					],
				},
			],
			flags: [MessageFlags.IsComponentsV2],
			ephemeral: true,
		});
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const index = await getTicketIndex();
	// @ts-ignore issue with `slugify` typings
	const slug = slugify(interaction.user.username.slice(0, 20));
	const newChannel = await serviceConfig.ticketCategory.children.create({
		name: `${index}-${slug}`,
		reason: "[Starlight] Automatically created ticket",
	});

	await createDbTicket(newChannel.id, interaction.user.id);

	if (serviceConfig.staffRoleId) {
		await newChannel.send({
			content: `<@&${serviceConfig.staffRoleId}>`,
			embeds: [
				{
					description: "Thank you for creating a ticket!",
				},
			],
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							style: ButtonStyle.Secondary,
							label: "Close",
							customId: "close-ticket",
						},
					],
				},
			],
		});
	}

	await interaction.editReply({
		content: `Created ticket: <#${newChannel.id}>`,
	});
}

export async function closeTicket(interaction: ButtonInteraction) {
	invariant(
		interaction.channel,
		"Close Ticket buttons should always be in a channel",
	);

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

	await interaction.deferUpdate();

	await deleteTicketChannel(interaction.channelId);
	await interaction.channel.delete();
}
