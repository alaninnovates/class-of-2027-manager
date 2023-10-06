import Keyv from 'keyv';
import { KeyvExpire } from '../KeyvExpire';
import { System } from '../types';
import { Client } from 'discord.js';
import { log } from '../utils';

// table of users who have strikes, includes a timestamp of when they will be removed
const countingStrikeDb = new KeyvExpire(
	new Keyv<number>('sqlite://./data/database.db', {
		namespace: 'countingStrike',
	}),
);
// table of users who are currently banned, includes a timestamp of when they will be unbanned
const csDelDb = new KeyvExpire(
	new Keyv('sqlite://./data/database.db', {
		namespace: 'csDel',
	}),
);

const handleCount = async (
	client: Client,
	authorId: string,
	reason: string,
) => {
	const existing = await countingStrikeDb.get(authorId);
	const member = await (
		await client.guilds.fetch(process.env.GUILD_ID!)
	).members.fetch(authorId);
	if (existing) {
		if (existing + 1 >= 3) {
			log.info('counting-moderation', 'adding role to user:', authorId);
			await countingStrikeDb.delete(authorId);
			member.roles.add(process.env.COUNTING_MUTE_ROLE_ID!);
			await csDelDb.set(authorId, 1, 1000 * 60 * 60);
			member
				.send(
					`You have been muted in the counting channel for one hour because **${reason}**!`,
				)
				.catch((_) => _);
			return;
		}
		log.info('counting-moderation', 'adding strike to user:', authorId);
		await countingStrikeDb.set(authorId, existing + 1, 1000 * 60 * 30);
		member
			.send(
				`You have been striked in the counting channel because **${reason}**! You now have ${
					existing + 1
				} strikes. If you get 3 strikes, you will be muted in the counting channel for one hour.\nNote: strikes reset every 30 minutes.`,
			)
			.catch((_) => _);
	} else {
		log.info(
			'counting-moderation',
			'adding first strike to user:',
			authorId,
		);
		await countingStrikeDb.set(authorId, 1, 1000 * 60 * 30);
		member
			.send(
				`You have been striked in the counting channel because **${reason}**! You now have 1 strike. If you get 3 strikes, you will be muted in the counting channel for one hour.\nNote: strikes reset every 30 minutes.`,
			)
			.catch((_) => _);
	}
};

export default {
	name: 'counting-moderation',
	init: (client) => {
		csDelDb.on('expire', async (key, _value) => {
			const member = await (
				await client.guilds.fetch('1074907579890810880')
			).members.fetch(key);
			member.roles.remove(process.env.COUNTING_MUTE_ROLE_ID!);
		});
	},
	events: {
		messageCreate: async (message) => {
			if (message.channelId !== process.env.COUNTING_CHANNEL_ID) return;
			if (
				message.content.includes('RUINED IT AT') &&
				message.author.id === '510016054391734273'
			) {
				await handleCount(
					message.client,
					message.mentions.users.first()!.id,
					'you said the wrong number',
				);
			}
		},
		messageUpdate: async (_oldMessage, newMessage) => {
			if (newMessage.channelId !== process.env.COUNTING_CHANNEL_ID)
				return;
			if (!newMessage || !newMessage.author) return;
			handleCount(
				newMessage.client,
				newMessage.author.id,
				'you edited a message',
			);
		},
		messageDelete: async (message) => {
			if (message.channelId !== process.env.COUNTING_CHANNEL_ID) return;
			if (!message || !message.author) return;
			handleCount(
				message.client,
				message.author.id,
				'you deleted a message',
			);
		},
	},
} as System;
