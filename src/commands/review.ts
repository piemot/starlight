import {
	ApplicationCommandOptionType,
	AttachmentBuilder,
	InteractionContextType,
} from "discord.js";
import invariant from "tiny-invariant";
import type { Command } from "../util/structures.js";
import dedent from "dedent";

export default {
	data: {
		name: "review",
		description: "Submit a service review.",
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: "assisted-by",
				description: "The staff member who assisted you",
				required: true,
			},
			{
				type: ApplicationCommandOptionType.String,
				name: "service",
				description: "What service did you request?",
				choices: [
					{ name: "Non-Animated GFX", value: "Non-Animated GFX" },
					{ name: "Animated GFX", value: "Animated GFX" },
					{ name: "Server Building", value: "Server Building" },
					{ name: "Marketing", value: "Marketing" },
					{ name: "Content Creation", value: "Content Creation" },
				],
				required: true,
			},
			{
				type: ApplicationCommandOptionType.Integer,
				name: "quality",
				description:
					"On a scale from 1–10, what was the quality of the item you recieved?",
				min_value: 1,
				max_value: 10,
				required: true,
			},
			{
				type: ApplicationCommandOptionType.Integer,
				name: "staff",
				description:
					"On a scale from 1–10, how was your interaction with the staff members who assisted you?",
				min_value: 1,
				max_value: 10,
				required: true,
			},
			{
				type: ApplicationCommandOptionType.Integer,
				name: "professionalism",
				description:
					"On a scale from 1–10, how professional were the staff members you interacted with?",
				min_value: 1,
				max_value: 10,
				required: true,
			},
			{
				type: ApplicationCommandOptionType.Integer,
				name: "recommendation",
				description:
					"On a scale from 1–10, how likely are you to recommend Starlight to others in the future?",
				min_value: 1,
				max_value: 10,
				required: true,
			},
			{
				type: ApplicationCommandOptionType.String,
				name: "comments",
				description: "If you have any other comments, please list them here.",
				max_length: 1000,
				required: false,
			},
		],
		contexts: [InteractionContextType.Guild],
	},
	async execute(interaction, { config }) {
		invariant(interaction.isChatInputCommand());
		const user = interaction.user;
		const assistedBy = interaction.options.getUser("assisted-by", true);
		const service = interaction.options.getString("service", true);

		const quality = interaction.options.getInteger("quality", true);
		const staff = interaction.options.getInteger("staff", true);
		const professionalism = interaction.options.getInteger(
			"professionalism",
			true,
		);
		const recommend = interaction.options.getInteger("recommendation", true);

		const comments = interaction.options.getString("comments") || "N/A";

		await interaction.reply({
			content: "Thank you for submitting a review!",
			ephemeral: true,
		});

		const intro = dedent`
			**rev by ,,** <@${user}>
			**staff asst ,,** <@${assistedBy}>`;
		const file = new AttachmentBuilder("./assets/divider.gif");

		const sentMsg = await config.reviewChannel.send({
			content: intro,
			files: [file],
			embeds: [
				{
					title: "<a:redstars:1338652445882191893> Service Review",
					description: dedent`
						<:red_arrow:1338647979132850207> **Username**: <@${user}>
						<:red_arrow:1338647979132850207> **Assisted by**: <@${assistedBy}>
						<:red_arrow:1338647979132850207> **Service requested**: ${service}
						<:red_arrow:1338647979132850207> **Item quality**: ${quality}/10
						<:red_arrow:1338647979132850207> **Interaction with staff**: ${staff}/10
						<:red_arrow:1338647979132850207> **Professionalism**: ${professionalism}/10
						<:red_arrow:1338647979132850207> **Would recommend**: ${recommend}/10
						<:red_arrow:1338647979132850207> **Additional comments**: ${comments}`,
					color: 0x7e0404,
					image: { url: "attachment://divider.gif" },
					footer: { text: "Thank you for choosing Starlight Services!" },
				},
			],
		});
		await sentMsg.react("❤️");
	},
} satisfies Command;
