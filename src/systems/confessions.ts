import {
	Colors,
	EmbedBuilder,
	GuildMember,
	GuildMemberRoleManager,
	PermissionFlagsBits,
	PermissionsBitField,
	SlashCommandBuilder,
	TextChannel,
} from 'discord.js';
import { System } from '../types';
import Keyv from 'keyv';
import { getEnvArray } from '../utils';
import { stripIndents } from 'common-tags';

interface Confession {
	user: string;
	message: string;
	replies: {
		user: string;
		message: string;
	}[];
}

const confessionsDb = new Keyv<Confession | number>(
	'sqlite://./data/database.db',
	{
		namespace: 'confessions',
	},
);

const confessionBanDb = new Keyv<boolean>('sqlite://./data/database.db', {
	namespace: 'confessionBans',
});

const blockedPhrases = ['kys', 'kill'];

export default {
	name: 'confessions',
	commands: [
		new SlashCommandBuilder()
			.setName('confession')
			.setDescription('Confess something anonymously')
			.addSubcommand((cmd) =>
				cmd
					.setName('send')
					.setDescription('Send a confession')
					.addStringOption((option) =>
						option
							.setName('message')
							.setDescription('The message to send')
							.setRequired(true),
					),
			)
			.addSubcommand((cmd) =>
				cmd
					.setName('reply')
					.setDescription('Reply to a confession')
					.addIntegerOption((option) =>
						option
							.setName('id')
							.setDescription('The id of the confession')
							.setRequired(true),
					)
					.addStringOption((option) =>
						option
							.setName('message')
							.setDescription('The message to send')
							.setRequired(true),
					),
			)
			.addSubcommandGroup((group) =>
				group
					.setName('mod')
					.setDescription('Confession moderaton commands')
					.addSubcommand((cmd) =>
						cmd
							.setName('info')
							.setDescription(
								'Get info about a specific confession',
							)
							.addIntegerOption((option) =>
								option
									.setName('id')
									.setDescription('The id of the confession')
									.setRequired(true),
							),
					)
					.addSubcommand((cmd) =>
						cmd
							.setName('ban')
							.setDescription(
								'Ban a user from using the confession system',
							)
							.addUserOption((option) =>
								option
									.setName('user')
									.setDescription('The user to ban')
									.setRequired(true),
							),
					)
					.addSubcommand((cmd) =>
						cmd
							.setName('unban')
							.setDescription(
								'Unban a user from using the confession system',
							)
							.addUserOption((option) =>
								option
									.setName('user')
									.setDescription('The user to unban')
									.setRequired(true),
							),
					),
			) as SlashCommandBuilder,
	],
	init: async () => {
		if (!(await confessionsDb.get('id'))) {
			await confessionsDb.set('id', 1);
		}
	},
	events: {
		interactionCreate: async (interaction) => {
			if (!interaction.isChatInputCommand()) return;
			if (interaction.commandName !== 'confession') return;
			if (await confessionBanDb.get(interaction.user.id)) {
				await interaction.reply({
					content: 'You are banned from using the confession system!',
					ephemeral: true,
				});
				return;
			}
			const subCmdGroup = interaction.options.getSubcommandGroup();
			if (!subCmdGroup) {
				const member = interaction.member! as GuildMember;
				if (member.isCommunicationDisabled()) {
					await interaction.reply({
						content:
							'You cannot use the confession system while timed out!',
						ephemeral: true,
					});
					return;
				}
				switch (interaction.options.getSubcommand()) {
					case 'send': {
						const message = interaction.options.getString(
							'message',
							true,
						);
						if (
							blockedPhrases.some((phrase) =>
								message.toLowerCase().includes(phrase),
							)
						) {
							await interaction.reply({
								content:
									'Your message contains blocked phrases! Please be respectful to other server members.',
								ephemeral: true,
							});
							return;
						}
						const id = (await confessionsDb.get('id')) as number;
						await confessionsDb.set(id.toString(), {
							user: interaction.user.id,
							message,
							replies: [],
						});
						await confessionsDb.set('id', id + 1);
						const confessionChannel =
							(await interaction.client.channels.fetch(
								process.env.CONFESSION_CHANNEL_ID as string,
							)) as TextChannel;
						await confessionChannel.send({
							embeds: [
								new EmbedBuilder()
									.setAuthor({
										name: `Confession #${id}`,
										iconURL: interaction.guild!.iconURL()!,
									})
									.setDescription(message)
									.setFooter({
										text: `/confession send [content] • /confession reply [content]`,
									})
									.setTimestamp()
									.setColor(Colors.Blue),
							],
						});
						await interaction.reply({
							content: 'Confession sent!',
							ephemeral: true,
						});
						break;
					}
					case 'reply': {
						const id = interaction.options.getInteger('id', true);
						const message = interaction.options.getString(
							'message',
							true,
						);
						if (
							blockedPhrases.some((phrase) =>
								message.toLowerCase().includes(phrase),
							)
						) {
							await interaction.reply({
								content:
									'Your message contains blocked phrases! Please be respectful to other server members.',
								ephemeral: true,
							});
							return;
						}
						const confession = (await confessionsDb.get(
							id.toString(),
						)) as Confession | undefined;
						if (!confession) {
							await interaction.reply({
								content: 'Confession not found!',
								ephemeral: true,
							});
							return;
						}
						confession.replies.push({
							user: interaction.user.id,
							message,
						});
						await confessionsDb.set(id.toString(), confession);
						const targetUser = await interaction.client.users.fetch(
							confession.user,
						);
						await targetUser.send({
							content: stripIndents`You have a new reply to your confession #${id}:
                        \`\`\`
                        ${message}
                        \`\`\`
                        `,
						});
						await interaction.reply({
							content: 'Reply sent!',
							ephemeral: true,
						});
						break;
					}
				}
			} else if (subCmdGroup === 'mod') {
				const mods = getEnvArray('MOD_ROLE_IDS');
				if (
					!(
						interaction.member
							?.permissions as Readonly<PermissionsBitField>
					).has(PermissionFlagsBits.ManageGuild) &&
					!mods.some((id) =>
						(
							interaction.member?.roles as GuildMemberRoleManager
						).cache.has(id),
					)
				) {
					await interaction.reply({
						content: 'You do not have permission to do this!',
						ephemeral: true,
					});
					return;
				}
				switch (interaction.options.getSubcommand()) {
					case 'info': {
						const id = interaction.options.getInteger('id', true);
						const confession = (await confessionsDb.get(
							id.toString(),
						)) as Confession;
						if (!confession) {
							await interaction.reply({
								content: 'Confession not found!',
								ephemeral: true,
							});
							return;
						}
						// todo: paginate replies (maybe)
						const targetUser = await interaction.client.users.fetch(
							confession.user,
						);
						await interaction.reply({
							embeds: [
								new EmbedBuilder()
									.setTitle(`Confession #${id}`)
									.setAuthor({
										name: `${
											targetUser.tag ?? 'Unknown User'
										} | ${targetUser.id}`,
										iconURL: targetUser.displayAvatarURL(),
									})
									.setDescription(
										stripIndents`
								\`\`\`
								${confession.message}
								\`\`\`
								Replies:
								\`\`\`
								${confession.replies
									.map(
										(reply, index) =>
											`${index + 1}. ${
												reply.message
											} - ${`${
												interaction.client.users.cache.get(
													reply.user,
												)?.tag ?? 'Unknown User'
											} | ${reply.user}`}`,
									)
									.join('\n')}
								\`\`\`
								`,
									)
									.setColor(Colors.Blue),
							],
						});
						break;
					}
					case 'ban': {
						const user = interaction.options.getUser('user', true);
						await confessionBanDb.set(user.id, true);
						break;
					}
					case 'unban': {
						const user = interaction.options.getUser('user', true);
						await confessionBanDb.delete(user.id);
						break;
					}
				}
			}
		},
	},
} as System;
