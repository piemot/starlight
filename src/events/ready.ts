import { ActivityType, Events, time } from "discord.js";
import type { Event } from "../util/structures.js";

export default {
	name: Events.ClientReady,
	async execute(client) {
		console.log(`Logged in as ${client.user.tag}`);

		const readyChannel = client.channels.cache.get("1373475976586985583");
		if (readyChannel?.isSendable()) {
			await readyChannel.send({
				embeds: [
					{
						title: "Ready!",
						color: 0x66bb6a,
						description: `**Started:** ${time(new Date(), "R")}`,
					},
				],
			});
		}

		client.user.setPresence({
			status: "online",
			activities: [
				{
					name: "Starlight Services!",
					type: ActivityType.Watching,
				},
			],
		});
	},
} satisfies Event<Events.ClientReady>;
