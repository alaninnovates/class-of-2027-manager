import { Colors, EmbedBuilder, TextChannel, bold } from 'discord.js';
import { System } from '../types';
import { CensoredEmojis } from '../config';

export default {
	name: 'reaction-moderation',
	events: {
		messageReactionAdd: async (reaction, user) => {
			if (reaction.partial) await reaction.fetch();
			if (CensoredEmojis.some((e) => reaction.emoji.name === e)) {
				reaction.remove();
				const logChan = (await reaction.client.channels.fetch(
					process.env.LOGS_CHANNEL_ID!,
				)) as TextChannel;
				logChan?.send({
					embeds: [
						new EmbedBuilder()
							.setDescription(
								bold(
									`Reaction Removed in <#${reaction.message.channelId}> [Jump to Message](${reaction.message.url})`,
								),
							)
							.setAuthor({
								name: user.tag!,
								iconURL: user.displayAvatarURL(),
							})
							.addFields([
								{
									name: 'User',
									value: `<@${user.id}>`,
								},
								{
									name: 'Emoji',
									value: reaction.emoji.name!,
								},
							])
							.setColor(Colors.Red)
							.setFooter({
								text: `Reacter: ${user.id} | Messsage ID: ${reaction.message.id}`,
							})
							.setTimestamp(),
					],
				});
			}
		},
	},
} as System;
