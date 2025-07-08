import dedent from "dedent";
import {
	type ButtonInteraction,
	ButtonStyle,
	type CommandInteraction,
	ComponentType,
	MessageFlags,
	type StringSelectMenuInteraction,
} from "discord.js";
import slugify from "slugify";
import invariant from "tiny-invariant";
import {
	createTicket as createDbTicket,
	deleteTicketChannel,
	getNextTicketIndex,
	getTicketByChannel,
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

	const index = await getNextTicketIndex();
	// @ts-ignore issue with `slugify` typings
	const slug = slugify(interaction.user.username.slice(0, 20));
	const newChannel = await serviceConfig.ticketCategory.children.create({
		name: `🔴┃${slug}-${index}`,
		reason: "[Starlight] Automatically created ticket",
	});

	await createDbTicket(newChannel.id, interaction.user.id);

	if (serviceConfig.staffRoleId) {
		await newChannel.send({
			content: `<@&${serviceConfig.staffRoleId}>`,
			embeds: [
				{
					description: dedent`
						Thank you for choosing Starlight Services! A staff member will be with you as soon as possible.

						## Ticket Rules
						- Please be patient; we are a completely free service provider. 
								- We receive many tickets a day and handle them in the order they were received.
						- Please do not ping staff members in your ticket except for the staff member assisting you.
						- Do not DM staff members about your ticket status.
						- Keep all conversation about your request in this ticket.`,
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
		components: [
			{
				type: ComponentType.Container,
				accentColor: 0x2965af,
				components: [
					{
						type: ComponentType.Section,
						components: [
							{ type: ComponentType.TextDisplay, content: "✅ Created ticket" },
						],
						accessory: {
							type: ComponentType.Button,
							style: ButtonStyle.Link,
							url: `https://discord.com/channels/${interaction.guildId}/${newChannel.id}`,
							label: "Open",
						},
					},
				],
			},
		],
		flags: [MessageFlags.IsComponentsV2],
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

export async function closeTicketCommand(interaction: CommandInteraction) {
	invariant(
		interaction.channel,
		"This function must always be called with an interaction in a channel",
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

	await interaction.deferReply();

	await deleteTicketChannel(interaction.channelId);
	await interaction.channel.delete();
}
