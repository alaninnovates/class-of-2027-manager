import { System } from '../types';
import { LAHSKeywords, MVHSKeywords } from '../config';
import { GuildMemberRoleManager } from 'discord.js';
import { choose } from '../utils';

const welcomeEmojis = ['👋', '🎉', '🙌', '📚'];

export default {
	name: 'welcomer',
	events: {
		messageCreate: async (message) => {
			if (message.author.bot) return;
			if (message.channelId === process.env.INTRO_CHANNEL_ID) {
				message.react(choose<string>(...welcomeEmojis));
				let school = '';
				const roles = message.member?.roles as GuildMemberRoleManager;
				if (
					!roles.cache.hasAny(
						process.env.MVHS_ROLE_ID!,
						process.env.LAHS_ROLE_ID!,
					)
				) {
					if (
						MVHSKeywords.some((s) =>
							message.content.toLowerCase().includes(s),
						)
					) {
						message.member?.roles.add(process.env.MVHS_ROLE_ID!);
						school = 'Mountain View High School';
					} else if (
						LAHSKeywords.some((s) =>
							message.content.toLowerCase().includes(s),
						)
					) {
						message.member?.roles.add(process.env.LAHS_ROLE_ID!);
						school = 'Los Altos High School';
					}
				}
				message.author
					.send(
						`Welcome to the MVLA Class of 2027 Discord Server!${
							school
								? `\n\nYou have been added to the ${school} role. If this is not your school, please contact an admin!`
								: ''
						}`,
					)
					.catch((_) => _);
			}
		},
	},
} as System;
