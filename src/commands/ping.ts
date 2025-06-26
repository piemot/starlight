import type { Command } from "../util/structures.js";

export default {
	data: {
		name: "ping",
		description: "Ping!",
	},
	async execute(interaction) {
		const wsPing = interaction.client.ws.ping;
		const heartbeat = wsPing === -1 ? "N/A" : `${wsPing} ms`;

		await interaction.reply({
			embeds: [
				{
					title: "Pong!",
					color: 0x2965af,
					description:
						`**Round-trip:** \`${Date.now() - interaction.createdTimestamp} ms\`\n` +
						`**Heartbeat:** \`${heartbeat}\``,
					timestamp: new Date().toISOString(),
				},
			],
			ephemeral: true,
		});
	},
} satisfies Command;
