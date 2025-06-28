import { API, ComponentType } from "@discordjs/core/http-only";
import dedent from "dedent";
import { REST } from "discord.js";

const { configFile } = await import("../dist/util/config.js");

const rest = new REST({ version: "10" }).setToken(configFile.bot.token);
const api = new API(rest);

await api.channels.createMessage(configFile.tickets.header.channel, {
	embeds: [
		{
			description: dedent`
        <:ss_1:1371993164830998638> ⁑ ────﹒**Non-Animated GFX**﹐
        Our amazing graphic designers are here to help you create an amazing logo, banner, or other image projects to your heart's desire. Our designers have a variety of skills and programs on their computers ready to create the perfect design for you! ⋆ ★

        <:ss_2:1371993166856851466> ⁑ ────﹒**Animated GFX**﹐
        Our amazing graphic designers are here to help you create an amazing logo, banner, or other image projects to your heart's desire. Our designers have a variety of skills and programs on their computers ready to create the perfect design for you! ⋆ ★
        
        <:ss_3:1371993168110813265> ⁑ ────﹒**Server Building**﹐
        Includes all things that will make your vision for the next best discord server become reality! We can create any server to meet your qualifications (roles, channels, perms, bots, and more) as well as help with any general concerns you have about aspects of your server. We also offer server reviews for your server, covering aesthetics, general features, information channels, and otherwise. ⋆ ★
        
        <:ss_4:1371993169100668979> ⁑ ────﹒**Marketing**﹐
        Is your server ad looking a bit bland? Did you just create a new server and need your very first ad for it? Our marketing team can revamp your current server ad or make you a completely new one. We also offer an ad review, providing feedback for you to improve on your ad. ⋆ ★
        
        <:ss_5:1371993170572869702> ⁑ ────﹒**Content Creation**﹐
        Is your server lacking applications or rules? Need a welcome message written or edited? Our content creation team can assist with any content you need to be written for your server! ⋆ ★
        
        <:ss_6:1371993172384944310> ⁑ ────﹒**Video Editing**﹐
        Video Editing - Our video editing team will help with anything that moves! Any effects or editing you need to be done to a video. Send us the project in your ticket and you'll have it edited in no time. ⋆ ★
        `,
			color: 0xffffff,
		},
		{
			description: `Is your service not available? Check <#${configFile.services.availability.channel}>.`,
			color: 0xc1121f,
		},
	],
	components: [
		{
			type: ComponentType.ActionRow,
			components: [
				{
					type: ComponentType.StringSelect,
					placeholder: "Select a Service",
					custom_id: "create-ticket",
					options: [
						{
							label: "GFX – Non-Animated",
							value: "graphics-non-animated",
							emoji: { id: "1371993164830998638" },
						},
						{
							label: "GFX – Animated",
							value: "graphics-animated",
							emoji: { id: "1371993166856851466" },
						},
						{
							label: "Server Building",
							value: "server-building",
							emoji: { id: "1371993168110813265" },
						},
						{
							label: "Marketing",
							value: "marketing",
							emoji: { id: "1371993169100668979" },
						},
						{
							label: "Content Creation",
							value: "content",
							emoji: { id: "1371993170572869702" },
						},
						{
							label: "Video Editing",
							value: "video",
							emoji: { id: "1371993172384944310" },
						},
					],
				},
			],
		},
	],
});
