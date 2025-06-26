import { ComponentType, MessageFlags, time } from "discord.js";
import type { Command } from "../util/structures.js";

const { default: pkg } = await import("../../package.json", {
	with: { type: "json" },
});

export default {
	data: {
		name: "botinfo",
		description: "Displays bot information",
	},
	async execute(interaction) {
		const start = new Date(Date.now() - interaction.client.uptime);
		const userCount = interaction.guild?.memberCount.toLocaleString("en-US");

		await interaction.reply({
			components: [
				{
					type: ComponentType.Container,
					accentColor: 0x2965af,
					components: [
						{
							type: ComponentType.TextDisplay,
							content: `\`v${pkg.version}\` • \`${userCount}\` users`,
						},
						{
							type: ComponentType.TextDisplay,
							content: `Launched ${time(start, "f")}, ${time(start, "R")}`,
						},
					],
				},
			],
			flags: [MessageFlags.IsComponentsV2],
		});
	},
} satisfies Command;
