import { System } from '../types';
import { log } from '../utils';

// users who have not selected their HS yet
const nonRoleUsers: {
	[id: string]: NodeJS.Timer;
} = {};

export default {
	name: 'role-notifier',
	events: {
		guildMemberAdd: async (member) => {
			nonRoleUsers[member.id] = setTimeout(() => {
				log.info(
					'role-notifier',
					`Sending message to ${member.user.tag} reguarding reaction roles`,
				);
				member
					.send(
						"We hope you have been enjoying your time in the MVLA Class of 2027 Discord Server! We noticed you haven't selected a high school role yet. Please select your high school in <#1119993465640591440>. Thank you!",
					)
					.catch((_) => _);
			}, 24 * 60 * 60 * 1000);
		},
		guildMemberUpdate: async (_oldMember, newMember) => {
			if (
				newMember.roles.cache.hasAny(
					process.env.MVHS_ROLE_ID!,
					process.env.LAHS_ROLE_ID!,
				)
			) {
				if (nonRoleUsers[newMember.id]) {
					clearTimeout(nonRoleUsers[newMember.id]);
				}
			}
		},
	},
} as System;
