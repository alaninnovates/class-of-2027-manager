import { MessageType } from 'discord.js';
import { System } from '../types';
import { log, retry } from '../utils';

export default {
	name: 'suggestions',
	events: {
		messageCreate: async (message) => {
			if (message.channelId !== process.env.SUGGESTION_CHANNEL_ID) return;
			if (message.type !== MessageType.Default) return;
			try {
				await retry(() => message.react('✅'), 'suggestions');
				await retry(() => message.react('❌'), 'suggestions');
				await retry(
					() =>
						message.startThread({
							name: 'Discussion',
						}),
					'suggestions',
				);
			} catch (error) {
				log.error('suggestions', error);
			}
		},
	},
} as System;
