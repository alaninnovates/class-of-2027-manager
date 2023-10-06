import { Colors, EmbedBuilder, GuildMemberRoleManager } from 'discord.js';
import { System } from '../types';
import { HighSchoolRoles, MiddleSchoolRoles } from '../config';
import { parseCustomId } from '../utils';

export default {
	name: 'reaction-roles',
	init: (client) => {
		// const rrChannel = (await client.channels.fetch(
		// 	process.env.RR_CHANNEL_ID!,
		// )) as TextChannel;
		// rrChannel.send(HighSchoolReactionRoleMessage);
		// rrChannel.send(MiddleSchoolReactionRoleMessage);
	},
	events: {
		interactionCreate: async (interaction) => {
			if (!interaction.isStringSelectMenu()) return;
			const { scope, args } = parseCustomId(interaction.customId);
			if (scope === 'rr') {
				await interaction.deferReply({
					ephemeral: true,
				});
				const selectType = args[0];
				const roleList: { [key: string]: string } =
					selectType === 'highschool'
						? HighSchoolRoles
						: MiddleSchoolRoles;
				const roleType =
					selectType === 'highschool'
						? 'High School'
						: 'Middle School';

				const roles = interaction.member
					?.roles as GuildMemberRoleManager;
				if (roles.cache.hasAny(...Object.values(roleList))) {
					await interaction.editReply({
						embeds: [
							new EmbedBuilder()
								.setTitle('Error!')
								.setDescription(
									`You already have a ${roleType} role! If your current role is not accurate, please contact an administrator.`,
								)
								.setColor(Colors.Red),
						],
					});
					return;
				}
				const selectedRole = interaction.values[0];
				const roleId = roleList[selectedRole];
				roles.add(roleId);
				await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle('Success!')
							.setDescription(
								`You have recieved the <@&${roleId}> (${selectedRole.toUpperCase()}) role!`,
							)
							.setColor(Colors.Green),
					],
				});
			}
		},
	},
} as System;
