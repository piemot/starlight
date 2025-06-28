import dedent from "dedent";
import {
	type APIButtonComponentWithCustomId,
	type APIComponentInContainer,
	ApplicationCommandOptionType,
	ButtonStyle,
	Collection,
	ComponentType,
	InteractionContextType,
	type InteractionReplyOptions,
	type InteractionUpdateOptions,
	MessageFlags,
	PermissionsBitField,
	roleMention,
} from "discord.js";
import { nanoid } from "nanoid";
import invariant from "tiny-invariant";
import { getGuildServices, updateGuildServices } from "../database/guilds.js";
import type { ServiceState } from "../database/schema.js";
import type { Command } from "../util/structures.js";

const STATUS_EMOJIS = {
	open: "<:ss_open:1366879016950431754>",
	limited: "<:ss_limited:1366879014865862746>",
	closed: "<:ss_closed:1366879013045534821>",
} as const;

const STATUS_EMOJI_IDS = {
	open: "1366879016950431754",
	limited: "1366879014865862746",
	closed: "1366879013045534821",
} as const;

export default {
	data: {
		name: "services",
		description: "Update the availability status of services.",
		options: [
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "update",
				description: "Update any service's availability",
			},
		],
		default_member_permissions:
			PermissionsBitField.Flags.ManageGuild.toString(),
		contexts: [InteractionContextType.Guild],
	},
	async execute(interaction, { config }) {
		invariant(interaction.inGuild(), "asserted by `data.contexts`");

		const services = new Map(Object.entries(config.services.types));
		const serviceStates = await getGuildServices(interaction.guildId);

		if (services.size === 0) {
			await interaction.reply({
				components: [
					{
						type: ComponentType.Container,
						accentColor: 0x9f0712,
						components: [
							{ type: ComponentType.TextDisplay, content: "## Sorry!" },
							{
								type: ComponentType.TextDisplay,
								content: dedent`
									This component has not been set up yet. 
									If you are an administrator, please update the \`config.toml\` file.
									An example configuration is displayed below.

									\`\`\`toml
										[services.availability]
										channel = "123456789123456789"
										message = "build"

										[services.types]
										graphics-non-animated = "Non-Animated GFX"
										graphics-animated = "Animated GFX"
										server-building = "Server Building"
										marketing = "Marketing"
										content = "Content Creation"
										video = "VFX"
									\`\`\`
								`,
							},
						],
					},
				],
				flags: [MessageFlags.IsComponentsV2],
			});
			return;
		}

		const state: State = {
			services: new Collection(),
			submitButtonId: nanoid(),
			resetButtonId: nanoid(),
		};

		for (const [id, name] of services) {
			// default new services to closed
			const originalState = serviceStates.get(id) ?? "closed";
			state.services.set(id, {
				name,
				originalState,
				currentState: originalState,
				buttonId: nanoid(),
			});
		}

		const reply = await interaction.reply(generateComponents(state));

		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.Button,
			idle: 3 * 60 * 1_000, // disable after 3 minutes idle
			filter: (i) =>
				Array.from(state.services.values())
					.map((service) => service.buttonId)
					.includes(i.customId) ||
				i.customId === state.submitButtonId ||
				i.customId === state.resetButtonId,
		});

		collector.on("collect", async (i) => {
			if (i.customId === state.submitButtonId) {
				const stateMap: Record<string, ServiceState> = Object.fromEntries(
					state.services.map((value, key) => [key, value.currentState]),
				);
				await updateGuildServices(interaction.guildId, stateMap);

				const notifyDescription = dedent`
					${STATUS_EMOJIS.open} Open
					${STATUS_EMOJIS.limited} Limited
					${STATUS_EMOJIS.closed} Closed

					${state.services
						.map(
							({ name, currentState }) =>
								`${STATUS_EMOJIS[currentState]} ・ ${name}`,
						)
						.join("\n")}

					<a:redstars:1338652445882191893>‧ ――★

					Once your service is completed please fill out the review form requested by Staff. We are a **free** service provider and it takes seconds to help us show new customers the level of care we put into our work. Failure to leave a review could result in a service blacklist.
				`;

				await config.services.availability.channel.send({
					content: roleMention(config.services.availability.notifyRoleId),
					embeds: [
						{
							title: "📌 Service Availability",
							color: 0x9e2b2b,
							description: notifyDescription,
						},
					],
				});

				const stateDisplay = state.services
					.map(
						({ name, currentState }) =>
							`* ${name}: ${STATUS_EMOJIS[currentState]}`,
					)
					.join("\n");

				await i.update({
					components: [
						{
							type: ComponentType.Container,
							accentColor: 0x2965af,
							components: [
								{
									type: ComponentType.TextDisplay,
									content: "## Update Services",
								},
								{
									type: ComponentType.TextDisplay,
									content: "Successfully updated services.",
								},
								{ type: ComponentType.Separator },
								{ type: ComponentType.TextDisplay, content: stateDisplay },
							],
						},
					],
					flags: [MessageFlags.IsComponentsV2],
				});
			} else if (i.customId === state.resetButtonId) {
				state.services = state.services.mapValues((v) => ({
					...v,
					currentState: v.originalState,
				}));
				await i.update(generateComponents(state));
			} else {
				const serviceId = state.services.findKey(
					(val) => val.buttonId === i.customId,
				);
				invariant(serviceId);
				const service = state.services.get(serviceId);
				invariant(service, "just searched above");

				state.services.set(serviceId, {
					...service,
					currentState: nextState(service.currentState),
				});

				await i.update(generateComponents(state));
			}
		});

		collector.on("end", async () => {
			await reply.edit(generateComponents(state, true));
		});
	},
} satisfies Command;

interface State {
	services: Collection<
		string,
		{
			/** The name of the service */
			name: string;
			/** The database state of the service (defaults to `closed`) */
			originalState: ServiceState;
			/** The `custom_id` of the button toggling the service */
			buttonId: string;
			/** The state of the button describing the service */
			currentState: ServiceState;
		}
	>;
	submitButtonId: string;
	resetButtonId: string;
}

/**
 * Generate the components to send in the message.
 *
 * This should be a pure function, accepting the {@link State} and producing an interaction Reply.
 * Mutating {@link State} should happen __elsewhere__.
 */
function generateComponents(
	state: State,
	disableComponents = false,
): InteractionReplyOptions & InteractionUpdateOptions {
	const serviceComponents: APIComponentInContainer[] = [];
	for (const { name, buttonId, currentState } of state.services.values()) {
		function getButton(): APIButtonComponentWithCustomId {
			const button = {
				type: ComponentType.Button as const,
				style: ButtonStyle.Secondary as const,
				custom_id: buttonId,
				disabled: disableComponents,
			};

			switch (currentState) {
				case "open":
					return {
						...button,
						emoji: { id: STATUS_EMOJI_IDS.open },
						label: "Open",
					};
				case "limited":
					return {
						...button,
						emoji: { id: STATUS_EMOJI_IDS.limited },
						label: "Limited",
					};
				case "closed":
					return {
						...button,
						emoji: { id: STATUS_EMOJI_IDS.closed },
						label: "Closed",
					};
			}
		}

		serviceComponents.push({
			type: ComponentType.Section,
			components: [{ type: ComponentType.TextDisplay, content: name }],
			accessory: getButton(),
		});
	}

	return {
		components: [
			{
				type: ComponentType.Container,
				accentColor: 0x2965af,
				components: [
					{ type: ComponentType.TextDisplay, content: "## Update Services" },
					...serviceComponents,
					{ type: ComponentType.Separator },
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: state.submitButtonId,
								disabled: disableComponents,
								style: ButtonStyle.Primary,
								label: "Save",
							},
							{
								type: ComponentType.Button,
								customId: state.resetButtonId,
								disabled: disableComponents,
								style: ButtonStyle.Secondary,
								label: "Reset",
							},
						],
					},
				],
			},
		],
		flags: [MessageFlags.IsComponentsV2],
	};
}

function nextState(state: ServiceState): ServiceState {
	switch (state) {
		case "open":
			return "limited";
		case "limited":
			return "closed";
		case "closed":
			return "open";
	}
}
